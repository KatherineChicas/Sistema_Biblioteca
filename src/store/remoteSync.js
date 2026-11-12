// ─── Sincronización con Supabase ──────────────────────────────────────────
// 1. Al iniciar, carga todas las tablas desde la base de datos.
// 2. Cada vez que una acción del store cambia datos, guarda en la nube solo
//    las filas nuevas o modificadas (comparando con el estado anterior).
// 3. Escucha cambios en tiempo real: si otra persona modifica algo, se recarga.
import { supabase } from "../lib/supabase";
import { useLibraryStore, buildInitialState } from "./useLibraryStore";

// Columnas de cada tabla (en camelCase, como se usan en la aplicación)
const TABLES = {
  users: ["id", "name", "email", "role", "status", "password", "avatar", "loans", "fines", "joined"],
  books: ["id", "title", "author", "isbn", "genre", "cover", "price", "rentalPrice", "stock", "available", "rating", "reviews", "status", "year", "pages", "description", "tags", "canRent", "canBuy"],
  loans: ["id", "userId", "userName", "bookId", "bookTitle", "bookAuthor", "loanDate", "dueDate", "returnDate", "type", "renewals", "fine", "condition"],
  sales: ["id", "userId", "userName", "bookId", "bookTitle", "type", "amount", "date", "loanId"],
  fines: ["id", "userId", "userName", "loanId", "concept", "amount", "date", "paid", "paidDate"],
  audit: ["id", "date", "actor", "action", "detail"],
};
// Orden de escritura respetando las llaves foráneas (users y books primero)
const WRITE_ORDER = ["users", "books", "loans", "sales", "fines", "audit"];

const toSnake = (k) => k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const toRow = (table, obj) => Object.fromEntries(TABLES[table].map((k) => [toSnake(k), obj[k] ?? null]));
const fromRow = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]));

let applyingRemote = false;
let ready = false;

function nextCounter(list, prefix) {
  const nums = list.map((x) => (prefix ? parseInt(String(x.id).replace(prefix, ""), 10) : Number(x.id))).filter((n) => !isNaN(n));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

function applyData(data) {
  applyingRemote = true;
  useLibraryStore.setState({
    ...data,
    counters: {
      loan: nextCounter(data.loans, "L-"), sale: nextCounter(data.sales, "V-"), fine: nextCounter(data.fines, "M-"),
      user: nextCounter(data.users), book: nextCounter(data.books), audit: 0,
    },
  });
  applyingRemote = false;
}

async function fetchAll() {
  const out = {};
  for (const t of Object.keys(TABLES)) {
    const q = supabase.from(t).select("*");
    const { data, error } = await (t === "audit" ? q.order("date", { ascending: false }).limit(500) : q.order("id"));
    if (error) throw error;
    out[t] = data.map(fromRow);
  }
  const { data: st, error } = await supabase.from("settings").select("data").eq("id", 1).maybeSingle();
  if (error) throw error;
  const defaults = useLibraryStore.getState().settings;
  out.settings = { ...defaults, ...(st?.data ?? {}) };
  return out;
}

async function writeDiff(table, current, previous) {
  const prevMap = new Map(previous.map((x) => [x.id, x]));
  const curIds = new Set(current.map((x) => x.id));
  const changed = current.filter((x) => prevMap.get(x.id) !== x);
  const removed = previous.filter((x) => !curIds.has(x.id)).map((x) => x.id);
  if (changed.length) {
    const { error } = await supabase.from(table).upsert(changed.map((x) => toRow(table, x)));
    if (error) throw error;
  }
  return removed;
}

// Cola para que las escrituras se hagan en orden y no se pisen
let queue = Promise.resolve();
function persistChanges(state, prev) {
  queue = queue.then(async () => {
    try {
      const removedByTable = {};
      for (const t of WRITE_ORDER) {
        if (state[t] !== prev[t]) removedByTable[t] = await writeDiff(t, state[t], prev[t]);
      }
      // Los borrados van en orden inverso (primero hijos, luego padres)
      for (const t of [...WRITE_ORDER].reverse()) {
        const ids = removedByTable[t];
        if (ids?.length) {
          const { error } = await supabase.from(t).delete().in("id", ids);
          if (error) throw error;
        }
      }
      if (state.settings !== prev.settings) {
        const { error } = await supabase.from("settings").upsert({ id: 1, data: state.settings });
        if (error) throw error;
      }
    } catch (e) {
      console.error(e);
      useLibraryStore.getState().notify(`No se pudo guardar en la base de datos: ${e.message}`, "error");
    }
  });
}

let reloadTimer = null;
function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(async () => {
    await queue; // esperar a que terminen las escrituras propias
    try { applyData(await fetchAll()); } catch (e) { console.error(e); }
  }, 400);
}

let started = false;
export async function startRemoteSync() {
  if (!supabase || started) return;
  started = true;
  const setRemote = (patch) => useLibraryStore.setState((s) => ({ remote: { ...s.remote, ...patch } }));
  try {
    let data = await fetchAll();
    if (data.users.length === 0) {
      // Primera vez: cargar los datos de demostración en la base de datos
      const seed = buildInitialState();
      for (const t of WRITE_ORDER) {
        if (seed[t].length) {
          const { error } = await supabase.from(t).upsert(seed[t].map((x) => toRow(t, x)));
          if (error) throw error;
        }
      }
      const { error } = await supabase.from("settings").upsert({ id: 1, data: seed.settings });
      if (error) throw error;
      data = await fetchAll();
    }
    applyData(data);
    ready = true;
    setRemote({ status: "ready", error: null });

    // Guardar en la nube cada cambio hecho en este navegador
    useLibraryStore.subscribe((state, prev) => {
      if (!ready || applyingRemote) return;
      const keys = [...WRITE_ORDER, "settings"];
      if (keys.some((k) => state[k] !== prev[k])) persistChanges(state, prev);
    });

    // Recibir cambios hechos por otras personas
    supabase
      .channel("biblioteca")
      .on("postgres_changes", { event: "*", schema: "public" }, scheduleReload)
      .subscribe();
  } catch (e) {
    console.error(e);
    setRemote({ status: "error", error: e.message });
  }
}
