import { useState } from "react";
import { ShoppingCart, Clock, DollarSign, Receipt } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { useAuth, ROLES } from "../context/AuthContext";
import { PageHeader, StatCard, Table, tdCls, EmptyState, money } from "../components/ui";

// Ventas y rentas: el administrador ve todas, el usuario solo las suyas ("Mis Compras")
export default function SalesPage() {
  const { user } = useAuth();
  const isUser = user?.role === ROLES.USER;
  const all = useLibraryStore((s) => s.sales);
  const sales = isUser ? all.filter((s) => s.userId === user.id) : all;
  const [type, setType] = useState("all");
  const list = sales.filter((s) => type === "all" || s.type === type);
  const sum = (t) => sales.filter((s) => s.type === t).reduce((a, s) => a + s.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isUser ? "Mis Compras" : "Ventas y Rentas"}
        subtitle={isUser ? "Libros que has comprado o rentado" : "Registro de transacciones realizadas desde el catálogo"}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ShoppingCart} label="Compras" value={money(sum("buy"))} />
        <StatCard icon={Clock} label="Rentas" value={money(sum("rent"))} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard icon={DollarSign} label="Total" value={money(sum("buy") + sum("rent"))} color="text-violet-400" bg="bg-violet-500/10" />
      </div>
      <div className="flex gap-2">
        {[["all", "Todas"], ["buy", "Compras"], ["rent", "Rentas"]].map(([k, l]) => (
          <button key={k} onClick={() => setType(k)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${type === k ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 border border-white/8"}`}>{l}</button>
        ))}
      </div>
      <Table headers={["Folio", ...(isUser ? [] : ["Cliente"]), "Libro", "Tipo", "Fecha", "Préstamo", "Monto"]}>
        {list.map((s) => (
          <tr key={s.id} className="border-b border-white/4 hover:bg-white/2">
            <td className={`${tdCls} font-mono text-indigo-400`}>{s.id}</td>
            {!isUser && <td className={tdCls}>{s.userName}</td>}
            <td className={tdCls}>{s.bookTitle}</td>
            <td className={tdCls}>
              <span className={`px-2 py-0.5 rounded-full border ${s.type === "buy" ? "text-indigo-300 border-indigo-500/30 bg-indigo-500/10" : "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"}`}>
                {s.type === "buy" ? "Compra" : "Renta"}
              </span>
            </td>
            <td className={`${tdCls} text-slate-400`}>{s.date}</td>
            <td className={`${tdCls} font-mono text-slate-500`}>{s.loanId ?? "—"}</td>
            <td className={`${tdCls} font-semibold text-slate-100`}>{money(s.amount)}</td>
          </tr>
        ))}
      </Table>
      {list.length === 0 && <EmptyState icon={Receipt} title="No hay transacciones" text={isUser ? "Compra o renta un libro desde el catálogo." : undefined} />}
    </div>
  );
}
