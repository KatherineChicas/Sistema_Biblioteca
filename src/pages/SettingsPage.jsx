import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { useLibraryStore, DEFAULT_SETTINGS } from "../store/useLibraryStore";
import { useAuth } from "../context/AuthContext";
import { PageHeader, Field, inputCls, Button } from "../components/ui";

// Requerimiento 6.2: configuración global de reglas de negocio
export default function SettingsPage() {
  const settings = useLibraryStore((s) => s.settings);
  const updateSettings = useLibraryStore((s) => s.updateSettings);
  const notify = useLibraryStore((s) => s.notify);
  const { user } = useAuth();
  const [form, setForm] = useState(settings);
  const [error, setError] = useState("");

  const num = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value === "" ? "" : Number(e.target.value) }));
  const changed = Object.keys(form).filter((k) => form[k] !== settings[k]);

  const save = () => {
    const nums = ["fineRate", "damageFee", "lostFee", "loanDays", "rentalDays", "maxLoans", "renewDays"];
    if (nums.some((k) => form[k] === "" || form[k] < 0)) return setError("Todos los valores numéricos deben ser cero o mayores.");
    if (form.loanDays < 1 || form.maxLoans < 1) return setError("La duración y el máximo de préstamos deben ser al menos 1.");
    setError("");
    updateSettings(Object.fromEntries(changed.map((k) => [k, form[k]])), user?.name);
    notify("Configuración guardada");
  };

  const groups = [
    { title: "Préstamos", fields: [
      ["loanDays", "Duración del préstamo (días)"], ["rentalDays", "Duración de la renta (días)"],
      ["maxLoans", "Máximo de préstamos simultáneos"], ["renewDays", "Días por renovación"],
    ]},
    { title: "Penalizaciones", fields: [
      ["fineRate", "Multa por día de atraso (L)"], ["damageFee", "Cargo por libro dañado (L)"], ["lostFee", "Cargo por libro extraviado (L)"],
    ]},
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Configuración" subtitle="Parámetros globales que aplican a préstamos, devoluciones y multas">
        <Button variant="ghost" onClick={() => setForm({ ...DEFAULT_SETTINGS })}><RotateCcw size={15} /> Valores por defecto</Button>
        <Button onClick={save} disabled={changed.length === 0}><Save size={15} /> Guardar {changed.length > 0 && `(${changed.length})`}</Button>
      </PageHeader>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">General</h2>
        <Field label="Nombre de la biblioteca">
          <input className={inputCls} value={form.libraryName} onChange={(e) => setForm((f) => ({ ...f, libraryName: e.target.value }))} />
        </Field>
        <label className="flex items-center gap-3 mt-4 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={form.blockWithFines} onChange={(e) => setForm((f) => ({ ...f, blockWithFines: e.target.checked }))} />
          Bloquear nuevos préstamos a usuarios con multas pendientes (requerimiento 4.4)
        </label>
      </div>

      {groups.map((g) => (
        <div key={g.title} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">{g.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {g.fields.map(([k, label]) => (
              <Field key={k} label={label}>
                <input type="number" min="0" step="0.5" className={`${inputCls} ${form[k] !== settings[k] ? "border-indigo-500/60" : ""}`} value={form[k]} onChange={num(k)} />
              </Field>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-3">{error}</p>}
    </div>
  );
}
