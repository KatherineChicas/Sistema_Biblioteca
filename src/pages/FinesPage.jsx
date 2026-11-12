import { useState } from "react";
import { AlertTriangle, CheckCircle2, DollarSign, Users, Receipt } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { useAuth } from "../context/AuthContext";
import { PageHeader, StatCard, Table, tdCls, Button, EmptyState, Modal, money } from "../components/ui";

// Requerimiento 4.3 / 4.4: control de multas y bloqueo por mora
export default function FinesPage() {
  const fines = useLibraryStore((s) => s.fines);
  const payFine = useLibraryStore((s) => s.payFine);
  const notify = useLibraryStore((s) => s.notify);
  const blockWithFines = useLibraryStore((s) => s.settings.blockWithFines);
  const { user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [confirm, setConfirm] = useState(null);

  const pending = fines.filter((f) => !f.paid);
  const paid = fines.filter((f) => f.paid);
  const list = tab === "pending" ? pending : paid;
  const debtors = new Set(pending.map((f) => f.userId)).size;

  return (
    <div className="space-y-6">
      <PageHeader title="Multas" subtitle="Cobro de penalizaciones por atraso, daño o extravío" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={AlertTriangle} label="Monto pendiente" value={money(pending.reduce((a, f) => a + f.amount, 0))} color="text-amber-400" bg="bg-amber-500/10" />
        <StatCard icon={Users} label={blockWithFines ? "Usuarios bloqueados para préstamo" : "Usuarios con deuda"} value={debtors} color="text-red-400" bg="bg-red-500/10" />
        <StatCard icon={DollarSign} label="Total cobrado" value={money(paid.reduce((a, f) => a + f.amount, 0))} color="text-emerald-400" bg="bg-emerald-500/10" />
      </div>

      <div className="flex gap-2">
        {[["pending", `Pendientes (${pending.length})`], ["paid", `Pagadas (${paid.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === k ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 border border-white/8"}`}>{l}</button>
        ))}
      </div>

      <Table headers={["Folio", "Usuario", "Préstamo", "Concepto", "Fecha", "Monto", tab === "pending" ? "Acción" : "Pagada"]}>
        {list.map((f) => (
          <tr key={f.id} className="border-b border-white/4 hover:bg-white/2">
            <td className={`${tdCls} font-mono text-indigo-400`}>{f.id}</td>
            <td className={tdCls}>{f.userName}</td>
            <td className={`${tdCls} font-mono text-slate-400`}>{f.loanId}</td>
            <td className={tdCls}>{f.concept}</td>
            <td className={`${tdCls} text-slate-400`}>{f.date}</td>
            <td className={`${tdCls} font-semibold text-amber-400`}>{money(f.amount)}</td>
            <td className={tdCls}>
              {f.paid
                ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} />{f.paidDate}</span>
                : <Button variant="success" className="!py-1.5 !px-3 !text-xs" onClick={() => setConfirm(f)}>Registrar pago</Button>}
            </td>
          </tr>
        ))}
      </Table>
      {list.length === 0 && <EmptyState icon={Receipt} title={tab === "pending" ? "No hay multas pendientes" : "Aún no se han cobrado multas"} />}

      {confirm && (
        <Modal title="Confirmar pago de multa" onClose={() => setConfirm(null)}>
          <p className="text-sm text-slate-300 mb-4">
            Se registrará el pago de <b className="text-amber-300">{money(confirm.amount)}</b> de <b>{confirm.userName}</b> por "{confirm.concept}".
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirm(null)}>Cancelar</Button>
            <Button variant="success" className="flex-1" onClick={() => { payFine(confirm.id, user?.name); notify(`Pago de ${confirm.id} registrado`); setConfirm(null); }}>Confirmar pago</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
