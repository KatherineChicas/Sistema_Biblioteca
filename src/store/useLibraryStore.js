// ─── Store global del sistema (Zustand + persistencia en localStorage) ─────
// Capa de lógica de negocio: concentra las reglas de préstamos, devoluciones,
// multas, ventas, usuarios, configuración y bitácora de auditoría.
// Las páginas (capa de presentación) solo leen el estado y llaman acciones.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mockBooks, mockUsers, mockChartData } from "../data/mockData";
import { isRemote } from "../lib/supabase";

const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

// ─── Utilidades de fecha ──────────────────────────────────────────────────
const DAY = 86400000;
export const toISO = (d) => new Date(d).toISOString().slice(0, 10);
export const today = () => toISO(Date.now());
const daysFromNow = (n) => toISO(Date.now() + n * DAY);

/** Días de atraso de un préstamo respecto a hoy (0 si no está vencido). */
export function daysOverdue(loan, ref = today()) {
  if (loan.returnDate) return 0;
  const diff = Math.floor((new Date(ref) - new Date(loan.dueDate)) / DAY);
  return Math.max(0, diff);
}

/** Estado calculado del préstamo: active | overdue | returned. */
export function loanStatus(loan) {
  if (loan.returnDate) return "returned";
  return daysOverdue(loan) > 0 ? "overdue" : "active";
}

// ─── Configuración por defecto (requerimiento 6.2) ───────────────────────
export const DEFAULT_SETTINGS = {
  libraryName: "BiblioSys – Universidad Digital",
  fineRate: 6.5,        // L por día de atraso
  damageFee: 200,       // cargo por libro dañado
  lostFee: 520,         // cargo por libro extraviado
  loanDays: 14,         // duración estándar del préstamo
  rentalDays: 7,        // duración de una renta
  maxLoans: 3,          // préstamos simultáneos por usuario
  blockWithFines: true, // bloquear préstamos si hay multas (4.4)
  renewDays: 7,         // días que agrega una renovación
};

// ─── Datos semilla (fechas relativas a hoy para que la demo sea coherente) ─
const PASSWORDS = {
  "admin@biblioteca.edu": "admin123",
  "harold@biblioteca.edu": "harold123",
  "diego@unitec.edu": "diego123",
};

function seedUsers() {
  return mockUsers.map((u) => ({
    ...u,
    password: PASSWORDS[u.email] ?? "biblio123",
    avatar: u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
    loans: 0,
    fines: u.fines ?? 0,
  }));
}

function seedLoans() {
  const base = [
    { id: "L-0001", userId: 1, bookId: 1, loanDate: daysFromNow(-10), dueDate: daysFromNow(4) },
    { id: "L-0002", userId: 2, bookId: 2, loanDate: daysFromNow(-23), dueDate: daysFromNow(-9) },
    { id: "L-0003", userId: 4, bookId: 4, loanDate: daysFromNow(-38), dueDate: daysFromNow(-24) },
    { id: "L-0004", userId: 5, bookId: 7, loanDate: daysFromNow(-6), dueDate: daysFromNow(8) },
    { id: "L-0005", userId: 1, bookId: 5, loanDate: daysFromNow(-20), dueDate: daysFromNow(-6), returnDate: daysFromNow(-8) },
  ];
  return base.map((l) => {
    const u = mockUsers.find((x) => x.id === l.userId);
    const b = mockBooks.find((x) => x.id === l.bookId);
    return {
      ...l,
      userName: u.name,
      bookTitle: b.title,
      bookAuthor: b.author,
      returnDate: l.returnDate ?? null,
      type: "loan",
      renewals: 0,
      fine: 0,
      condition: l.returnDate ? "good" : null,
    };
  });
}

function seedSales() {
  return [
    { id: "V-0001", userId: 1, userName: "Diego Mantilla", bookId: 4, bookTitle: "Harry Potter y la Piedra Filosofal", type: "buy",  amount: 505, date: daysFromNow(-3) },
    { id: "V-0002", userId: 2, userName: "Katherine Chicas", bookId: 5, bookTitle: "El Alquimista", type: "rent", amount: 40, date: daysFromNow(-5) },
    { id: "V-0003", userId: 5, userName: "Kerlin Robles", bookId: 6, bookTitle: "Don Quijote de la Mancha", type: "buy", amount: 550, date: daysFromNow(-12) },
  ];
}

function seedFines() {
  return [
    { id: "M-0001", userId: 2, userName: "Katherine Chicas", loanId: "L-0099", concept: "Atraso en devolución", amount: 60, date: daysFromNow(-15), paid: false },
    { id: "M-0002", userId: 4, userName: "Ian Zelaya", loanId: "L-0098", concept: "Atraso en devolución", amount: 155, date: daysFromNow(-30), paid: false },
  ];
}

export function buildInitialState() {
  const users = seedUsers();
  const loans = seedLoans();
  const books = mockBooks.map((b) => ({ ...b }));
  // Sincronizar contadores con los préstamos activos semilla
  loans.filter((l) => !l.returnDate).forEach((l) => {
    const u = users.find((x) => x.id === l.userId);
    if (u) u.loans += 1;
  });
  return {
    books,
    users,
    loans,
    sales: seedSales(),
    fines: seedFines(),
    settings: { ...DEFAULT_SETTINGS },
    audit: [
      { id: "init", date: new Date(Date.now() - 2 * 3600000).toISOString(), actor: "Sistema", action: "INIT", detail: "Base de datos inicializada con datos de demostración" },
    ],
    counters: { loan: 6, sale: 4, fine: 3, user: 7, book: 9, audit: 2 },
  };
}

const pad = (n) => String(n).padStart(4, "0");

// ─── Store ────────────────────────────────────────────────────────────────
export const useLibraryStore = create(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      // Notificaciones tipo toast (no se persisten)
      toasts: [],
      // Estado de la conexión con la base de datos en la nube (no se persiste)
      remote: { enabled: isRemote, status: isRemote ? "loading" : "off", error: null },
      notify: (message, kind = "success") => {
        const id = Date.now() + Math.random();
        set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3500);
      },

      // ── Auditoría (6.4) ────────────────────────────────────────────────
      log: (actor, action, detail) =>
        set((s) => ({
          audit: [
            { id: newId(), date: new Date().toISOString(), actor: actor ?? "Sistema", action, detail },
            ...s.audit,
          ].slice(0, 500),
        })),

      // ── Libros (2.1 / 2.2) ─────────────────────────────────────────────
      saveBook: (data, actor) => {
        const s = get();
        if (data.id) {
          const prev = s.books.find((b) => b.id === data.id);
          const stockDelta = Number(data.stock) - prev.stock;
          const book = {
            ...prev, ...data,
            price: Number(data.price), rentalPrice: Number(data.rentalPrice),
            stock: Number(data.stock), year: Number(data.year), pages: Number(data.pages),
            available: Math.max(0, prev.available + stockDelta),
          };
          set({ books: s.books.map((b) => (b.id === data.id ? book : b)) });
          get().log(actor, "LIBRO_EDITADO", `${book.title} (ISBN ${book.isbn})`);
          return book;
        }
        if (s.books.some((b) => b.isbn === data.isbn)) return { error: "Ya existe un libro con ese ISBN." };
        const book = {
          id: s.counters.book,
          rating: 0, reviews: 0, tags: [], canRent: true, canBuy: true,
          cover: "",
          ...data,
          price: Number(data.price), rentalPrice: Number(data.rentalPrice),
          stock: Number(data.stock), available: Number(data.stock),
          year: Number(data.year), pages: Number(data.pages),
        };
        set({ books: [...s.books, book], counters: { ...s.counters, book: s.counters.book + 1 } });
        get().log(actor, "LIBRO_REGISTRADO", `${book.title} · ${book.stock} copias`);
        return book;
      },

      // ── Usuarios (1.3 / 1.4 / 6.1) ─────────────────────────────────────
      saveUser: (data, actor) => {
        const s = get();
        const email = data.email.trim().toLowerCase();
        const dup = s.users.find((u) => u.email === email && u.id !== data.id);
        if (dup) return { error: "El correo ya está registrado." };
        if (data.id) {
          const users = s.users.map((u) => (u.id === data.id ? { ...u, ...data, email } : u));
          set({ users });
          get().log(actor, "USUARIO_EDITADO", `${data.name} <${email}> · rol ${data.role}`);
          return users.find((u) => u.id === data.id);
        }
        const user = {
          id: s.counters.user,
          name: data.name.trim(),
          email,
          role: data.role ?? "usuario",
          status: "activo",
          password: data.password || "biblio123",
          avatar: data.name.trim().split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
          loans: 0, fines: 0, joined: today(),
        };
        set({ users: [...s.users, user], counters: { ...s.counters, user: s.counters.user + 1 } });
        get().log(actor ?? user.name, "USUARIO_CREADO", `${user.name} <${email}> · rol ${user.role}`);
        return user;
      },

      toggleUserStatus: (id, actor) => {
        const u = get().users.find((x) => x.id === id);
        const status = u.status === "activo" ? "suspendido" : "activo";
        set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, status } : x)) }));
        get().log(actor, status === "activo" ? "USUARIO_ACTIVADO" : "USUARIO_SUSPENDIDO", u.email);
      },

      resetPassword: (email, actor) => {
        const u = get().users.find((x) => x.email === email.trim().toLowerCase());
        if (!u) return { error: "No existe una cuenta con ese correo." };
        const temp = "Tmp" + Math.random().toString(36).slice(2, 8);
        set((s) => ({ users: s.users.map((x) => (x.id === u.id ? { ...x, password: temp } : x)) }));
        get().log(actor ?? u.name, "CONTRASENA_RESTABLECIDA", u.email);
        return { temp };
      },

      // ── Préstamos (3.1 – 3.4) ──────────────────────────────────────────
      canBorrow: (userId) => {
        const { users, settings, fines } = get();
        const u = users.find((x) => x.id === userId);
        if (!u) return { ok: false, reason: "Usuario no encontrado." };
        if (u.status !== "activo") return { ok: false, reason: "El usuario está suspendido." };
        const pending = fines.filter((f) => f.userId === userId && !f.paid).reduce((a, f) => a + f.amount, 0);
        if (settings.blockWithFines && pending > 0)
          return { ok: false, reason: `Tiene multas pendientes por L ${pending.toFixed(2)}.` };
        if (u.loans >= settings.maxLoans)
          return { ok: false, reason: `Alcanzó el máximo de ${settings.maxLoans} préstamos simultáneos.` };
        return { ok: true };
      },

      createLoan: (userId, bookId, actor, type = "loan") => {
        const s = get();
        const check = s.canBorrow(userId);
        if (!check.ok) return { error: check.reason };
        const book = s.books.find((b) => b.id === bookId);
        if (!book || book.available <= 0) return { error: "No hay copias disponibles de este libro." };
        if (s.loans.some((l) => l.userId === userId && l.bookId === bookId && !l.returnDate))
          return { error: "El usuario ya tiene un préstamo activo de este libro." };
        const user = s.users.find((u) => u.id === userId);
        const days = type === "rent" ? s.settings.rentalDays : s.settings.loanDays;
        const loan = {
          id: `L-${pad(s.counters.loan)}`,
          userId, userName: user.name,
          bookId, bookTitle: book.title, bookAuthor: book.author,
          loanDate: today(), dueDate: daysFromNow(days), returnDate: null,
          type, renewals: 0, fine: 0, condition: null,
        };
        set({
          loans: [loan, ...s.loans],
          books: s.books.map((b) => (b.id === bookId ? { ...b, available: b.available - 1 } : b)),
          users: s.users.map((u) => (u.id === userId ? { ...u, loans: u.loans + 1 } : u)),
          counters: { ...s.counters, loan: s.counters.loan + 1 },
        });
        get().log(actor, type === "rent" ? "RENTA_REGISTRADA" : "PRESTAMO_REGISTRADO", `${loan.id} · ${book.title} → ${user.name}`);
        return loan;
      },

      renewLoan: (loanId, actor) => {
        const s = get();
        const loan = s.loans.find((l) => l.id === loanId);
        if (!loan || loan.returnDate) return { error: "Préstamo no válido." };
        if (loanStatus(loan) === "overdue") return { error: "No se puede renovar un préstamo vencido." };
        if (loan.renewals >= 1) return { error: "Este préstamo ya fue renovado una vez." };
        const dueDate = toISO(new Date(loan.dueDate).getTime() + s.settings.renewDays * DAY);
        set({ loans: s.loans.map((l) => (l.id === loanId ? { ...l, dueDate, renewals: l.renewals + 1 } : l)) });
        get().log(actor, "PRESTAMO_RENOVADO", `${loanId} · nueva fecha ${dueDate}`);
        return { dueDate };
      },

      // ── Devoluciones y multas (4.1 – 4.4) ──────────────────────────────
      quoteReturn: (loan, condition) => {
        const { settings } = get();
        const late = daysOverdue(loan);
        const lateFine = late * settings.fineRate;
        const condFine = condition === "damaged" ? settings.damageFee : condition === "lost" ? settings.lostFee : 0;
        return { late, lateFine, condFine, total: lateFine + condFine };
      },

      registerReturn: (loanId, condition, actor) => {
        const s = get();
        const loan = s.loans.find((l) => l.id === loanId);
        if (!loan || loan.returnDate) return { error: "El préstamo no existe o ya fue devuelto." };
        const q = s.quoteReturn(loan, condition);
        const newFines = [...s.fines];
        let fineCounter = s.counters.fine;
        if (q.total > 0) {
          newFines.unshift({
            id: `M-${pad(fineCounter++)}`, userId: loan.userId, userName: loan.userName, loanId,
            concept: [q.late > 0 && `Atraso (${q.late} días)`, condition === "damaged" && "Libro dañado", condition === "lost" && "Libro extraviado"].filter(Boolean).join(" + "),
            amount: q.total, date: today(), paid: false,
          });
        }
        set({
          loans: s.loans.map((l) => (l.id === loanId ? { ...l, returnDate: today(), fine: q.total, condition } : l)),
          books: s.books.map((b) => {
            if (b.id !== loan.bookId) return b;
            return condition === "lost" ? { ...b, stock: Math.max(0, b.stock - 1) } : { ...b, available: b.available + 1 };
          }),
          users: s.users.map((u) => (u.id === loan.userId ? { ...u, loans: Math.max(0, u.loans - 1), fines: u.fines + q.total } : u)),
          fines: newFines,
          counters: { ...s.counters, fine: fineCounter },
        });
        get().log(actor, "DEVOLUCION_REGISTRADA", `${loanId} · ${loan.bookTitle} · cargo L ${q.total.toFixed(2)}`);
        return q;
      },

      payFine: (fineId, actor) => {
        const s = get();
        const f = s.fines.find((x) => x.id === fineId);
        if (!f || f.paid) return;
        set({
          fines: s.fines.map((x) => (x.id === fineId ? { ...x, paid: true, paidDate: today() } : x)),
          users: s.users.map((u) => (u.id === f.userId ? { ...u, fines: Math.max(0, u.fines - f.amount) } : u)),
        });
        get().log(actor, "MULTA_PAGADA", `${fineId} · ${f.userName} · L ${f.amount.toFixed(2)}`);
      },

      // ── Ventas y rentas desde el catálogo ──────────────────────────────
      purchase: (userId, bookId, type, actor) => {
        const s = get();
        const book = s.books.find((b) => b.id === bookId);
        const user = s.users.find((u) => u.id === userId);
        if (!book || !user) return { error: "Datos incompletos." };
        if (book.available <= 0) return { error: "No hay copias disponibles." };
        let loan = null;
        if (type === "rent") {
          loan = get().createLoan(userId, bookId, actor, "rent");
          if (loan.error) return loan;
        }
        const st = get();
        const sale = {
          id: `V-${pad(st.counters.sale)}`, userId, userName: user.name, bookId, bookTitle: book.title,
          type, amount: type === "rent" ? book.rentalPrice : book.price, date: today(), loanId: loan?.id ?? null,
        };
        set({
          sales: [sale, ...st.sales],
          books: type === "buy"
            ? st.books.map((b) => (b.id === bookId ? { ...b, stock: b.stock - 1, available: b.available - 1 } : b))
            : st.books,
          counters: { ...st.counters, sale: st.counters.sale + 1 },
        });
        get().log(actor, type === "rent" ? "VENTA_RENTA" : "VENTA_COMPRA", `${sale.id} · ${book.title} · L ${sale.amount.toFixed(2)}`);
        return sale;
      },

      // ── Configuración (6.2) ────────────────────────────────────────────
      updateSettings: (patch, actor) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        get().log(actor, "CONFIG_ACTUALIZADA", Object.keys(patch).join(", "));
      },

      // ── Respaldo (6.3) ─────────────────────────────────────────────────
      exportBackup: () => {
        const { books, users, loans, sales, fines, settings, audit, counters } = get();
        return { version: 1, exportedAt: new Date().toISOString(), books, users, loans, sales, fines, settings, audit, counters };
      },
      importBackup: (data, actor) => {
        const keys = ["books", "users", "loans", "sales", "fines", "settings", "counters"];
        if (!data || keys.some((k) => !(k in data))) return { error: "El archivo no es un respaldo válido." };
        set({ ...Object.fromEntries(keys.map((k) => [k, data[k]])), audit: data.audit ?? [] });
        get().log(actor, "RESPALDO_RESTAURADO", `Respaldo del ${data.exportedAt ?? "—"}`);
        return { ok: true };
      },
      resetDemo: (actor) => {
        set(buildInitialState());
        get().log(actor, "DATOS_REINICIADOS", "Se restauraron los datos de demostración");
      },
    }),
    {
      name: "bibliosys-db",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
                const { toasts, remote, ...rest } = s;
        // Con Supabase activo los datos viven en la nube: no se guardan en el navegador
        if (isRemote) return {};
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
      },
    }
  )
);

// ─── Selector de métricas calculadas para Dashboard / Informes ────────────
export function computeMetrics(state) {
  const { books, users, loans, sales, fines } = state;
  const active = loans.filter((l) => !l.returnDate);
  const thisMonth = today().slice(0, 7);
  const monthly = (arr, field = "date") => arr.filter((x) => (x[field] ?? "").startsWith(thisMonth));
  const monthlySales = monthly(sales).filter((s) => s.type === "buy").reduce((a, s) => a + s.amount, 0);
  const monthlyRentals = monthly(sales).filter((s) => s.type === "rent").reduce((a, s) => a + s.amount, 0);
  const monthlyFines = fines.filter((f) => f.paid && (f.paidDate ?? "").startsWith(thisMonth)).reduce((a, f) => a + f.amount, 0);
  return {
    totalBooks: books.reduce((a, b) => a + b.stock, 0),
    titles: books.length,
    activeLoans: active.length,
    activeUsers: users.filter((u) => u.status === "activo").length,
    overdueLoans: active.filter((l) => loanStatus(l) === "overdue").length,
    monthlySales, monthlyRentals, monthlyFines,
    totalRevenue: monthlySales + monthlyRentals + monthlyFines,
    returnsThisMonth: monthly(loans, "returnDate").length,
    newUsersThisMonth: monthly(users, "joined").length,
    pendingFines: fines.filter((f) => !f.paid).reduce((a, f) => a + f.amount, 0),
  };
}

// ─── Datos para gráficos: histórico de demostración + operaciones reales ──

export function computeChartData(state, metrics = computeMetrics(state)) {
  const counts = {};
  state.loans.forEach((l) => { counts[l.bookTitle] = (counts[l.bookTitle] ?? 0) + 1; });
  const short = { "Harry Potter y la Piedra Filosofal": "Harry Potter I", "Cien Años de Soledad": "Cien Años de Soledad", "Sapiens: De Animales a Dioses": "Sapiens" };
  const merged = {};
  mockChartData.topBooks.forEach((b) => { merged[b.title] = b.loans; });
  Object.entries(counts).forEach(([t, n]) => { const k = short[t] ?? t; merged[k] = (merged[k] ?? 0) + n; });
  const topBooks = Object.entries(merged).map(([title, loans]) => ({ title, loans })).sort((a, b) => b.loans - a.loans).slice(0, 5);
  return {
    ...mockChartData,
    topBooks,
    revenueByCategory: [
      { name: "Ventas", value: metrics.monthlySales, fill: "#6366f1" },
      { name: "Rentas", value: metrics.monthlyRentals, fill: "#22c55e" },
      { name: "Multas", value: metrics.monthlyFines, fill: "#f59e0b" },
    ],
  };
}

const ACTION_TYPE = { PRESTAMO_REGISTRADO: "loan", RENTA_REGISTRADA: "loan", DEVOLUCION_REGISTRADA: "return", VENTA_COMPRA: "sale", VENTA_RENTA: "sale", MULTA_PAGADA: "fine", USUARIO_CREADO: "register" };

function relTime(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "Hace un momento";
  if (m < 60) return `Hace ${m} min`;
  if (m < 1440) return `Hace ${Math.round(m / 60)} h`;
  return `Hace ${Math.round(m / 1440)} días`;
}

export function computeActivity(state, limit = 6) {
  return state.audit
    .filter((a) => ACTION_TYPE[a.action])
    .slice(0, limit)
    .map((a) => ({ id: `${a.id}-${a.date}`, type: ACTION_TYPE[a.action], user: a.actor, book: a.detail, time: relTime(a.date) }));
}
