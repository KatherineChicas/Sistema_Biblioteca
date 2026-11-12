// ─── Componentes de interfaz reutilizables ────────────────────────────────
// Mantienen la consistencia visual (regla dorada #3) entre todas las pantallas.
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, width = "max-w-lg" }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className={`w-full ${width} glass-card bg-slate-900/95 animate-fade-in-up p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-300 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all";

export function Button({ variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
    danger:  "bg-red-600/80 hover:bg-red-500 text-white",
    ghost:   "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
}

export function StatCard({ icon: Icon, label, value, color = "text-indigo-400", bg = "bg-indigo-500/10" }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="py-12 text-center">
      <Icon size={32} className="mx-auto text-slate-600 mb-2" />
      <p className="text-slate-300 text-sm font-medium">{title}</p>
      {text && <p className="text-slate-500 text-xs mt-1">{text}</p>}
    </div>
  );
}

export function Table({ headers, children }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/8">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export const tdCls = "px-4 py-3.5 text-xs text-slate-300 whitespace-nowrap";

// Notificaciones emergentes: retroalimentación inmediata de cada acción
export function Toaster() {
  const toasts = useLibraryStore((s) => s.toasts);
  const icons = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const colors = {
    success: "border-emerald-500/40 text-emerald-300",
    error: "border-red-500/40 text-red-300",
    info: "border-indigo-500/40 text-indigo-300",
  };
  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2 w-80">
      {toasts.map((t) => {
        const Icon = icons[t.kind] ?? Info;
        return (
          <div key={t.id} className={`flex items-start gap-2 p-3 rounded-xl bg-slate-900/95 border ${colors[t.kind]} shadow-2xl animate-fade-in-up text-sm`}>
            <Icon size={16} className="mt-0.5 flex-shrink-0" />
            <span className="text-slate-200">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export const money = (n) => `L ${Number(n || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
