import { useState } from "react";
import {
  Search, AlertTriangle, CheckCircle2, Clock,
  BookOpen, DollarSign, Calendar, Hash, ArrowRight, Loader2,
} from "lucide-react";
import { useLibraryStore, loanStatus, daysOverdue as calcDaysOverdue } from "../store/useLibraryStore";
import { useAuth } from "../context/AuthContext";

// Las tarifas ahora vienen de la configuración global (6.2)
function useActiveLoans() {
  return useLibraryStore((s) => s.loans)
    .filter((l) => !l.returnDate)
    .map((l) => ({ ...l, status: loanStatus(l), daysOverdue: calcDaysOverdue(l) }));
}

// ─── ReturnForm ───────────────────────────────────────────────────────────
function ReturnForm() {
  const settings = useLibraryStore((s) => s.settings);
  const registerReturn = useLibraryStore((s) => s.registerReturn);
  const notify = useLibraryStore((s) => s.notify);
  const { user } = useAuth();
  const mockLoans = useActiveLoans();
  const FINE_RATE = settings.fineRate;
  const calcFine = (d) => d * FINE_RATE;
  const [result, setResult] = useState(null);
  const [loanId, setLoanId]         = useState("");
  const [foundLoan, setFoundLoan]   = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [condition, setCondition]   = useState("good");
  const [confirmed, setConfirmed]   = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    await new Promise((r) => setTimeout(r, 600));
    const loan = mockLoans.find(
      (l) => l.id.toLowerCase() === loanId.toLowerCase() && l.status !== "returned"
    );
    if (loan) { setFoundLoan(loan); }
    else { setNotFound(true); setFoundLoan(null); }
    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const r = registerReturn(foundLoan.id, condition, user?.name);
    setLoading(false);
    if (r.error) { notify(r.error, "error"); return; }
    setResult(r);
    setConfirmed(true);
    notify(`Devolución de ${foundLoan.id} registrada`);
  };

  const handleReset = () => {
    setLoanId(""); setFoundLoan(null); setNotFound(false);
    setCondition("good"); setConfirmed(false); setResult(null);
  };

  // Calcular días de retraso y multa al momento de la devolución
  const daysOverdue = foundLoan?.daysOverdue ?? 0;
  const conditionFine = condition === "damaged" ? settings.damageFee : condition === "lost" ? settings.lostFee : 0;
  const totalFine = result ? result.total : calcFine(daysOverdue) + conditionFine;

  if (confirmed) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in-up">
        <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">¡Devolución Exitosa!</h3>
        <p className="text-slate-400 text-sm mb-1">Folio: <span className="text-indigo-400 font-mono">{foundLoan.id}</span></p>
        <p className="text-slate-400 text-sm mb-6">
          {totalFine > 0
            ? <>Multa registrada (pendiente de pago en Multas): <span className="text-amber-400 font-semibold">L {totalFine.toFixed(2)}</span></>
            : "Sin multas pendientes"
          }
        </p>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm"
        >
          Registrar otra devolución
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search by loan ID */}
      <div className="glass-card p-5">
        <h2 className="text-base font-semibold text-white mb-4">Buscar Préstamo</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="return-folio-input"
              type="text"
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Folio del préstamo (ej. L-0002)"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
            />
          </div>
          <button
            id="return-search-btn"
            onClick={handleSearch}
            disabled={!loanId.trim() || loading}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl disabled:opacity-40 transition-all text-sm"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Buscar
          </button>
        </div>

        {/* Quick search demo labels */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="text-xs text-slate-500">Prueba con:</span>
          {mockLoans.filter((l) => l.status !== "returned").map((l) => (
            <button
              key={l.id}
              onClick={() => { setLoanId(l.id); setFoundLoan(null); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full"
            >
              {l.id}
            </button>
          ))}
        </div>

        {notFound && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl p-3">
            <AlertTriangle size={14} />
            No se encontró el préstamo o ya fue devuelto
          </div>
        )}
      </div>

      {/* Loan details */}
      {foundLoan && (
        <>
          <div className="glass-card p-5 animate-fade-in-up">
            <h2 className="text-base font-semibold text-white mb-4">Detalles del Préstamo</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { icon: BookOpen,  label: "Libro",      value: foundLoan.bookTitle },
                { icon: Hash,      label: "Folio",      value: foundLoan.id },
                { icon: Search,    label: "Usuario",    value: foundLoan.userName },
                { icon: Calendar,  label: "Prestado",   value: foundLoan.loanDate },
                { icon: Clock,     label: "Vencimiento",value: foundLoan.dueDate },
                { icon: Calendar,  label: "Hoy",        value: new Date().toLocaleDateString("es-MX") },
              ].map((f) => (
                <div key={f.label} className="bg-white/4 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <f.icon size={11} className="text-slate-500" />
                    <p className="text-xs text-slate-500">{f.label}</p>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Estado del retraso */}
            {foundLoan.status === "overdue" && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Préstamo Vencido</p>
                  <p className="text-xs text-slate-400">{foundLoan.daysOverdue} días de retraso · L {calcFine(foundLoan.daysOverdue).toFixed(2)} en multa base</p>
                </div>
              </div>
            )}

            {/* Condición del libro */}
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-300 mb-2">Condición del libro devuelto</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key:"good",    label:"Buen estado",  extra:"Sin cargo adicional", color:"emerald" },
                  { key:"damaged", label:"Dañado",        extra:`+L ${settings.damageFee.toFixed(2)}`,           color:"amber" },
                  { key:"lost",    label:"Extraviado",    extra:`+L ${settings.lostFee.toFixed(2)}`,            color:"red" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    id={`condition-${opt.key}`}
                    onClick={() => setCondition(opt.key)}
                    className={`p-3 rounded-xl border text-left transition-all
                      ${condition === opt.key
                        ? opt.color === "emerald" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : opt.color === "amber" ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                          : "bg-red-500/20 border-red-500/50 text-red-300"
                        : "bg-white/4 border-white/8 text-slate-400 hover:border-white/20"
                      }`}
                  >
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[10px] mt-0.5 opacity-75">{opt.extra}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen de multa */}
            <div className="bg-white/4 rounded-xl p-4 border border-white/8">
              <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <DollarSign size={14} className="text-amber-400" />
                Resumen de Cargos
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Multa por retraso ({foundLoan.daysOverdue} días × L {FINE_RATE.toFixed(2)})</span>
                  <span className="text-slate-200">L {calcFine(daysOverdue).toFixed(2)}</span>
                </div>
                {conditionFine > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Cargo por condición ({condition === "damaged" ? "Daño" : "Extravío"})</span>
                    <span className="text-amber-400">L {conditionFine.toFixed(2)}</span>
                  </div>
                )}
                <div className="h-px bg-white/10 my-1" />
                <div className="flex justify-between font-semibold text-sm">
                  <span className="text-slate-300">Total a cobrar</span>
                  <span className={totalFine > 0 ? "text-amber-400" : "text-emerald-400"}>
                    L {totalFine.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            id="confirm-return-btn"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Confirmar Devolución{totalFine > 0 && ` · Cobrar L ${totalFine.toFixed(2)}`}
          </button>
        </>
      )}
    </div>
  );
}

// ─── ReturnsPage ──────────────────────────────────────────────────────────
export default function ReturnsPage() {
  const loans = useLibraryStore((s) => s.loans);
  const fineRate = useLibraryStore((s) => s.settings.fineRate);
  const overdueCount = loans.filter((l) => loanStatus(l) === "overdue").length;
  const returnedToday = loans.filter((l) => l.returnDate === new Date().toISOString().slice(0, 10)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Devoluciones y Multas</h1>
        <p className="text-slate-400 text-sm">Registra devoluciones y calcula automáticamente las penalizaciones</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Vencidos pendientes", value: overdueCount, color:"text-red-400",    bg:"bg-red-500/10",     icon: AlertTriangle },
          { label:"Devueltos hoy",       value: returnedToday,color:"text-emerald-400",bg:"bg-emerald-500/10", icon: CheckCircle2  },
          { label:"Tarifa de multa",     value:`L ${fineRate.toFixed(2)} / día`, color:"text-amber-400",  bg:"bg-amber-500/10",   icon: DollarSign    },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Return Form */}
      <ReturnForm />
    </div>
  );
}
