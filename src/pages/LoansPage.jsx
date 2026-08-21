import { useState } from "react";
import {
  Search, Plus, BookOpen, Clock, CheckCircle2, AlertTriangle,
  User, Calendar, Hash, ChevronDown, Filter, Eye,
} from "lucide-react";
import { mockLoans, mockBooks, mockUsers } from "../data/mockData";

const STATUS_CONFIG = {
  active:   { label: "Activo",     color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/20"  },
  overdue:  { label: "Vencido",    color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
  returned: { label: "Devuelto",   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      {status === "active"   && <Clock size={10} />}
      {status === "overdue"  && <AlertTriangle size={10} />}
      {status === "returned" && <CheckCircle2 size={10} />}
      {cfg.label}
    </span>
  );
}

// Modal – Nuevo Préstamo
function NewLoanModal({ onClose }) {
  const [step, setStep]   = useState(1);
  const [userId, setUser] = useState("");
  const [bookId, setBook] = useState("");

  const selectedUser = mockUsers.find((u) => String(u.id) === userId);
  const selectedBook = mockBooks.find((b) => String(b.id) === bookId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-card animate-fade-in-up p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Nuevo Préstamo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {[1,2,3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${step >= s ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-400"}`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-indigo-600" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mb-6 -mt-4">
          <span>Seleccionar Usuario</span><span>Seleccionar Libro</span><span>Confirmar</span>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Buscar Usuario</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                id="loan-user-select"
                value={userId}
                onChange={(e) => setUser(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="" className="bg-slate-800">— Selecciona un usuario —</option>
                {mockUsers.filter((u) => u.role === "usuario").map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-800">{u.name} — {u.email}</option>
                ))}
              </select>
            </div>
            {selectedUser && (
              <div className="bg-white/4 rounded-xl p-4 border border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                    {selectedUser.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedUser.name}</p>
                    <p className="text-xs text-slate-400">{selectedUser.email}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-400">Préstamos activos</p>
                    <p className="text-sm font-bold text-indigo-400">{selectedUser.loans}</p>
                  </div>
                </div>
                {selectedUser.fines > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2">
                    <AlertTriangle size={12} />
                    Multa pendiente: L {selectedUser.fines.toFixed(2)}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={!userId}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Siguiente →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Seleccionar Libro</label>
            <select
              id="loan-book-select"
              value={bookId}
              onChange={(e) => setBook(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="" className="bg-slate-800">— Selecciona un libro —</option>
              {mockBooks.filter((b) => b.available > 0).map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-800">{b.title} — {b.available} disponibles</option>
              ))}
            </select>
            {selectedBook && (
              <div className="bg-white/4 rounded-xl p-4 border border-white/8 flex gap-3">
                <img src={selectedBook.cover} alt={selectedBook.title}
                  onError={(e) => { e.target.src = `https://placehold.co/48x64/1e293b/6366f1?text=${encodeURIComponent(selectedBook.title.slice(0,2))}`; }}
                  className="w-12 h-16 object-cover rounded-lg"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{selectedBook.title}</p>
                  <p className="text-xs text-slate-400">{selectedBook.author}</p>
                  <p className="text-xs text-emerald-400 mt-1">{selectedBook.available} copias disponibles</p>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl transition-all">
                ← Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!bookId}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl disabled:opacity-40 transition-all"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white/4 rounded-xl p-4 border border-white/8 space-y-2">
              <p className="text-sm font-medium text-slate-300 mb-3">Resumen del Préstamo</p>
              {[
                { label: "Usuario", value: selectedUser?.name, icon: User },
                { label: "Libro",   value: selectedBook?.title, icon: BookOpen },
                { label: "Fecha préstamo", value: new Date().toLocaleDateString("es-MX"), icon: Calendar },
                { label: "Fecha devolución", value: new Date(Date.now() + 14*86400000).toLocaleDateString("es-MX"), icon: Calendar },
                { label: "Folio",   value: `L-${Date.now().toString().slice(-6)}`, icon: Hash },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <f.icon size={14} className="text-slate-500 flex-shrink-0" />
                  <span className="text-xs text-slate-400 w-32">{f.label}</span>
                  <span className="text-xs text-slate-200 font-medium">{f.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl transition-all">
                ← Atrás
              </button>
              <button
                id="confirm-loan-btn"
                onClick={onClose}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
              >
                ✓ Confirmar Préstamo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LoansPage ────────────────────────────────────────────────────────────
export default function LoansPage() {
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");
  const [showModal, setModal]   = useState(false);

  const filtered = mockLoans.filter((l) => {
    const matchSearch = l.userName.toLowerCase().includes(search.toLowerCase())
      || l.bookTitle.toLowerCase().includes(search.toLowerCase())
      || l.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || l.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: mockLoans.length,
    active: mockLoans.filter((l) => l.status === "active").length,
    overdue: mockLoans.filter((l) => l.status === "overdue").length,
    returned: mockLoans.filter((l) => l.status === "returned").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Gestión de Préstamos</h1>
          <p className="text-slate-400 text-sm">Administra y asigna préstamos de libros</p>
        </div>
        <button
          id="new-loan-btn"
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm"
        >
          <Plus size={16} />
          Nuevo Préstamo
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key:"all",     label:"Todos",     count: counts.all },
          { key:"active",  label:"Activos",   count: counts.active },
          { key:"overdue", label:"Vencidos",  count: counts.overdue },
          { key:"returned",label:"Devueltos", count: counts.returned },
        ].map((tab) => (
          <button
            key={tab.key}
            id={`loan-tab-${tab.key}`}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${filter === tab.key
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "bg-white/5 text-slate-400 border border-white/8 hover:border-indigo-500/30"
              }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? "bg-white/20" : "bg-white/10"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="loans-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por usuario, libro o folio..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>

      {/* Loans Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/8">
              <tr>
                {["Folio", "Usuario", "Libro", "Prestado", "Vence", "Estado", "Multa", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((loan) => (
                <tr key={loan.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-mono text-indigo-400">{loan.id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {loan.userName.slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-300 whitespace-nowrap">{loan.userName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 max-w-[160px]">
                    <p className="text-xs text-slate-300 truncate">{loan.bookTitle}</p>
                    <p className="text-[10px] text-slate-500 truncate">{loan.bookAuthor}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{loan.loanDate}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                    <span className={loan.status === "overdue" ? "text-red-400 font-medium" : "text-slate-400"}>
                      {loan.dueDate}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill status={loan.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold ${loan.fine > 0 ? "text-amber-400" : "text-slate-500"}`}>
                      {loan.fine > 0 ? `L ${loan.fine.toFixed(2)}` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <BookOpen size={32} className="mx-auto text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm">No se encontraron préstamos</p>
            </div>
          )}
        </div>
      </div>

      {showModal && <NewLoanModal onClose={() => setModal(false)} />}
    </div>
  );
}
