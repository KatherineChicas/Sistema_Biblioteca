import { BookMarked, Clock, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useLibraryStore, loanStatus, daysOverdue } from "../store/useLibraryStore";
import { useAuth } from "../context/AuthContext";
import { PageHeader, StatCard, Button, EmptyState, money } from "../components/ui";

const DAY = 86400000;

// Vista del usuario final: historial personal de préstamos y rentas
export default function MyLoansPage() {
  const { user } = useAuth();
  const loans = useLibraryStore((s) => s.loans).filter((l) => l.userId === user?.id);
  const fines = useLibraryStore((s) => s.fines).filter((f) => f.userId === user?.id && !f.paid);
  const settings = useLibraryStore((s) => s.settings);
  const renewLoan = useLibraryStore((s) => s.renewLoan);
  const notify = useLibraryStore((s) => s.notify);

  const active = loans.filter((l) => !l.returnDate);
  const history = loans.filter((l) => l.returnDate);
  const debt = fines.reduce((a, f) => a + f.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Préstamos" subtitle="Consulta tus libros prestados, fechas de entrega y renovaciones" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BookMarked} label={`Activos (máx. ${settings.maxLoans})`} value={active.length} />
        <StatCard icon={AlertTriangle} label="Vencidos" value={active.filter((l) => loanStatus(l) === "overdue").length} color="text-red-400" bg="bg-red-500/10" />
        <StatCard icon={Clock} label="Multas pendientes" value={money(debt)} color="text-amber-400" bg="bg-amber-500/10" />
      </div>

      {debt > 0 && settings.blockWithFines && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
          <AlertTriangle size={18} />
          Tienes multas pendientes. No podrás solicitar nuevos préstamos hasta pagarlas en la biblioteca.
        </div>
      )}

      <section>
        <h2 className="text-base font-semibold text-white mb-3">En curso</h2>
        {active.length === 0 ? (
          <div className="glass-card"><EmptyState icon={BookMarked} title="No tienes préstamos activos" text="Explora el catálogo para rentar un libro." /></div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((l) => {
              const st = loanStatus(l);
              const left = Math.ceil((new Date(l.dueDate) - new Date(new Date().toISOString().slice(0, 10))) / DAY);
              return (
                <div key={l.id} className={`glass-card p-4 border ${st === "overdue" ? "border-red-500/30" : ""}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{l.bookTitle}</p>
                      <p className="text-xs text-slate-400">{l.bookAuthor}</p>
                    </div>
                    <span className="text-[11px] font-mono text-indigo-400">{l.id}</span>
                  </div>
                  <p className="text-xs text-slate-400">Prestado el {l.loanDate} · vence el <b className="text-slate-200">{l.dueDate}</b></p>
                  {st === "overdue" ? (
                    <p className="text-xs text-red-400 mt-2">Vencido hace {daysOverdue(l)} días · multa acumulada {money(daysOverdue(l) * settings.fineRate)}</p>
                  ) : (
                    <p className={`text-xs mt-2 ${left <= 2 ? "text-amber-400" : "text-emerald-400"}`}>Faltan {left} días para devolverlo</p>
                  )}
                  {st === "active" && (l.renewals ?? 0) < 1 && (
                    <Button variant="ghost" className="mt-3 !py-1.5 !text-xs" onClick={() => {
                      const r = renewLoan(l.id, user?.name);
                      if (r.error) notify(r.error, "error"); else notify(`Renovado hasta el ${r.dueDate}`);
                    }}><RefreshCw size={13} /> Renovar {settings.renewDays} días</Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-3">Historial</h2>
        <div className="glass-card divide-y divide-white/5">
          {history.length === 0 && <EmptyState icon={CheckCircle2} title="Sin devoluciones registradas" />}
          {history.map((l) => (
            <div key={l.id} className="flex items-center justify-between p-3 text-xs">
              <div><p className="text-slate-200">{l.bookTitle}</p><p className="text-slate-500">{l.loanDate} → {l.returnDate}</p></div>
              <span className={l.fine > 0 ? "text-amber-400" : "text-emerald-400"}>{l.fine > 0 ? `Cargo ${money(l.fine)}` : "A tiempo"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
