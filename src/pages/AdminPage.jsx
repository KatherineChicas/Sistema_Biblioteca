import { useRef, useState } from "react";
import { Users, ScrollText, Database, Download, Upload, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { useAuth } from "../context/AuthContext";
import { PageHeader, Table, tdCls, Button, Modal, StatCard, EmptyState, inputCls } from "../components/ui";
import { UsersPanel } from "./UsersPage";

// ─── Registro de auditoría (6.4) ──────────────────────────────────────────
function AuditPanel() {
  const audit = useLibraryStore((s) => s.audit);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("todas");
  const actions = [...new Set(audit.map((a) => a.action))].sort();
  const list = audit.filter((a) =>
    (action === "todas" || a.action === action) &&
    `${a.actor} ${a.detail}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por usuario o detalle..." className={`${inputCls} pl-9`} />
        </div>
        <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputCls} sm:max-w-xs`}>
          <option value="todas" className="bg-slate-800">Todas las acciones</option>
          {actions.map((a) => <option key={a} className="bg-slate-800">{a}</option>)}
        </select>
      </div>
      <Table headers={["Fecha y hora", "Responsable", "Acción", "Detalle"]}>
        {list.slice(0, 200).map((a) => (
          <tr key={`${a.id}-${a.date}`} className="border-b border-white/4 hover:bg-white/2">
            <td className={`${tdCls} text-slate-400`}>{new Date(a.date).toLocaleString("es-HN")}</td>
            <td className={tdCls}>{a.actor}</td>
            <td className={tdCls}><span className="font-mono text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">{a.action}</span></td>
            <td className={`${tdCls} whitespace-normal`}>{a.detail}</td>
          </tr>
        ))}
      </Table>
      {list.length === 0 && <EmptyState icon={ScrollText} title="Sin registros" />}
    </div>
  );
}

// ─── Respaldo y restauración (6.3) ────────────────────────────────────────
function BackupPanel() {
  const exportBackup = useLibraryStore((s) => s.exportBackup);
  const importBackup = useLibraryStore((s) => s.importBackup);
  const resetDemo = useLibraryStore((s) => s.resetDemo);
  const log = useLibraryStore((s) => s.log);
  const notify = useLibraryStore((s) => s.notify);
  const state = useLibraryStore();
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const data = exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `respaldo-bibliosys-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    log(user?.name, "RESPALDO_GENERADO", a.download);
    notify("Respaldo descargado");
  };

  const restore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((txt) => {
      try {
        const r = importBackup(JSON.parse(txt), user?.name);
        notify(r.error ?? "Respaldo restaurado correctamente", r.error ? "error" : "success");
      } catch {
        notify("El archivo no es un JSON válido", "error");
      }
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="grid sm:grid-cols-4 gap-3">
        <StatCard icon={Database} label="Libros" value={state.books.length} />
        <StatCard icon={Users} label="Usuarios" value={state.users.length} />
        <StatCard icon={ScrollText} label="Préstamos" value={state.loans.length} />
        <StatCard icon={ShieldCheck} label="Eventos auditados" value={state.audit.length} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <Download className="text-indigo-400 mb-2" size={22} />
          <h3 className="text-sm font-semibold text-white mb-1">Generar respaldo</h3>
          <p className="text-xs text-slate-400 mb-4">Descarga toda la base de datos (libros, usuarios, préstamos, ventas, multas, configuración y auditoría) en un archivo JSON.</p>
          <Button onClick={download} className="w-full">Descargar respaldo</Button>
        </div>
        <div className="glass-card p-5">
          <Upload className="text-emerald-400 mb-2" size={22} />
          <h3 className="text-sm font-semibold text-white mb-1">Restaurar respaldo</h3>
          <p className="text-xs text-slate-400 mb-4">Reemplaza los datos actuales por los de un respaldo generado previamente.</p>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={restore} />
          <Button variant="success" onClick={() => fileRef.current?.click()} className="w-full">Seleccionar archivo</Button>
        </div>
        <div className="glass-card p-5">
          <RotateCcw className="text-red-400 mb-2" size={22} />
          <h3 className="text-sm font-semibold text-white mb-1">Reiniciar datos de demo</h3>
          <p className="text-xs text-slate-400 mb-4">Vuelve al estado inicial. Útil antes de una presentación.</p>
          <Button variant="danger" onClick={() => setConfirmReset(true)} className="w-full">Reiniciar</Button>
        </div>
      </div>
      {confirmReset && (
        <Modal title="¿Reiniciar todos los datos?" onClose={() => setConfirmReset(false)}>
          <p className="text-sm text-slate-300 mb-4">Se perderán los cambios que no estén en un respaldo. Esta acción no se puede deshacer.</p>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmReset(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={() => { resetDemo(user?.name); notify("Datos reiniciados", "info"); setConfirmReset(false); }}>Sí, reiniciar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeSection, setSection] = useState("users");
  const sections = [
    { key: "users",  label: "Usuarios",   icon: Users },
    { key: "audit",  label: "Auditoría",  icon: ScrollText },
    { key: "backup", label: "Respaldo",   icon: Database },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Administración del Sistema" subtitle="Gestión de usuarios, auditoría y respaldo de la base de datos" />
      <div className="flex gap-2 flex-wrap">
        {sections.map((s) => (
          <button
            key={s.key}
            id={`admin-tab-${s.key}`}
            onClick={() => setSection(s.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeSection === s.key
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "glass-card text-slate-400 border-transparent hover:border-indigo-500/30 hover:text-white"}`}
          >
            <s.icon size={15} />
            {s.label}
          </button>
        ))}
      </div>
      {activeSection === "users" && <UsersPanel />}
      {activeSection === "audit" && <AuditPanel />}
      {activeSection === "backup" && <BackupPanel />}
    </div>
  );
}
