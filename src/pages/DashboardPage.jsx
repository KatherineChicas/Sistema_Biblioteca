import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  BookOpen, Users, TrendingUp, AlertTriangle,
  DollarSign, RotateCcw, BookMarked, UserPlus,
  ArrowUpRight, ArrowDownRight, Clock, ShoppingCart,
  CheckCircle2, Activity,
} from "lucide-react";
import { mockMetrics, mockChartData, mockActivity, mockLoans } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

// ─── Metric Card ─────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, subtitle, trend, trendUp, color, delay = 0 }) {
  const colorMap = {
    indigo:  { bg: "bg-indigo-500/10",  border: "border-indigo-500/20",  icon: "text-indigo-400",  glow: "glow-primary"   },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", glow: "glow-success"   },
    amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: "text-amber-400",   glow: "glow-warning"   },
    red:     { bg: "bg-red-500/10",     border: "border-red-500/20",     icon: "text-red-400",     glow: "glow-danger"    },
    violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/20",  icon: "text-violet-400",  glow: "glow-primary"   },
    sky:     { bg: "bg-sky-500/10",     border: "border-sky-500/20",     icon: "text-sky-400",     glow: ""               },
  };
  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <div
      className={`glass-card p-5 border ${c.border} hover:scale-[1.02] transition-all duration-300 animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-300 mb-0.5">{label}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

// ─── Custom Tooltip para gráficos ────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 border border-white/10 text-xs">
      <p className="text-slate-300 font-medium mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">
            {typeof p.value === "number" && p.name?.toLowerCase().includes("venta")
              ? `$${p.value.toLocaleString()}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Activity Feed ───────────────────────────────────────────────────────
const ACTIVITY_CONFIG = {
  loan:     { icon: BookMarked,   color: "text-indigo-400",  bg: "bg-indigo-500/10",  label: "Préstamo" },
  return:   { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Devolución" },
  sale:     { icon: ShoppingCart, color: "text-violet-400",  bg: "bg-violet-500/10",  label: "Venta" },
  fine:     { icon: AlertTriangle,color: "text-amber-400",   bg: "bg-amber-500/10",   label: "Multa" },
  register: { icon: UserPlus,     color: "text-sky-400",     bg: "bg-sky-500/10",     label: "Registro" },
};

function ActivityItem({ item }) {
  const cfg = ACTIVITY_CONFIG[item.type] ?? ACTIVITY_CONFIG.loan;
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/4 last:border-0">
      <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={14} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300">
          <span className="font-medium text-slate-100">{item.user}</span>
          {item.book && <> — <span className="italic">{item.book}</span></>}
        </p>
        <p className="text-[10px] text-slate-500">{item.time}</p>
      </div>
      <span className={`text-[10px] ${cfg.color} bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0`}>
        {cfg.label}
      </span>
    </div>
  );
}

// ─── Overdue Loans Table ─────────────────────────────────────────────────
function OverdueLoanRow({ loan }) {
  return (
    <tr className="border-b border-white/4 hover:bg-white/2 transition-colors">
      <td className="py-3 pr-4">
        <p className="text-xs font-medium text-slate-200">{loan.userName}</p>
        <p className="text-[10px] text-slate-500">{loan.id}</p>
      </td>
      <td className="py-3 pr-4">
        <p className="text-xs text-slate-300 truncate max-w-[150px]">{loan.bookTitle}</p>
      </td>
      <td className="py-3 pr-4">
        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
          {loan.daysOverdue} días
        </span>
      </td>
      <td className="py-3">
        <span className="text-xs font-semibold text-amber-400">${loan.fine.toFixed(2)}</span>
      </td>
    </tr>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const overdueLoans = mockLoans.filter((l) => l.status === "overdue");

  const metrics = [
    {
      icon: BookOpen,  label: "Total Libros",     value: mockMetrics.totalBooks.toLocaleString(),
      subtitle: "+12 este mes",   trend: "+2.3%", trendUp: true,  color: "indigo",  delay: 0,
    },
    {
      icon: BookMarked, label: "Préstamos Activos", value: mockMetrics.activeLoans,
      subtitle: "En circulación",  trend: "+8.1%", trendUp: true,  color: "emerald", delay: 100,
    },
    {
      icon: Users,     label: "Usuarios Activos",  value: mockMetrics.activeUsers,
      subtitle: "+28 este mes",    trend: "+5.4%", trendUp: true,  color: "violet",  delay: 200,
    },
    {
      icon: AlertTriangle, label: "Préstamos Vencidos", value: mockMetrics.overdueLoans,
      subtitle: "Requieren atención", trend: "-12%", trendUp: false, color: "red",   delay: 300,
    },
    {
      icon: DollarSign, label: "Ingresos Ventas",  value: `$${mockMetrics.monthlySales.toLocaleString()}`,
      subtitle: "Este mes",        trend: "+15%",  trendUp: true,  color: "indigo",  delay: 400,
    },
    {
      icon: Clock,     label: "Ingresos Rentas",   value: `$${mockMetrics.monthlyRentals.toLocaleString()}`,
      subtitle: "Este mes",        trend: "+7.2%", trendUp: true,  color: "sky",     delay: 500,
    },
    {
      icon: TrendingUp, label: "Multas Cobradas",  value: `$${mockMetrics.monthlyFines.toLocaleString()}`,
      subtitle: "Este mes",        trend: "-5%",   trendUp: false, color: "amber",   delay: 600,
    },
    {
      icon: RotateCcw, label: "Devoluciones",      value: mockMetrics.returnsThisMonth,
      subtitle: "Este mes",        trend: "+3.8%", trendUp: true,  color: "emerald", delay: 700,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            ¡Hola, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-400 text-sm">
            Resumen del Sistema — {new Date().toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
          <Activity size={14} className="text-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Sistema en línea</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Charts Row 1: Préstamos vs Devoluciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Préstamos y Devoluciones</h2>
              <p className="text-xs text-slate-500">Últimos 6 meses</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockChartData.loansByMonth} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
              <Line type="monotone" dataKey="loans" name="Préstamos" stroke="#6366f1" strokeWidth={2.5} dot={{ fill:"#6366f1", r:4 }} activeDot={{ r:6 }} />
              <Line type="monotone" dataKey="returns" name="Devoluciones" stroke="#22c55e" strokeWidth={2.5} dot={{ fill:"#22c55e", r:4 }} activeDot={{ r:6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart – Revenue Distribution */}
        <div className="glass-card p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Distribución de Ingresos</h2>
            <p className="text-xs text-slate-500">Este mes</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={mockChartData.revenueByCategory}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {mockChartData.revenueByCategory.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {mockChartData.revenueByCategory.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-slate-400">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  ${item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Bar chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart – Ventas mensuales */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Ventas Mensuales</h2>
            <p className="text-xs text-slate-500">Ingresos por ventas (MXN)</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockChartData.loansByMonth} margin={{ top:5, right:5, bottom:5, left:-10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:"#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:"#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" name="Ventas" fill="#6366f1" radius={[6,6,0,0]}>
                {mockChartData.loansByMonth.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 5 ? "#818cf8" : "#4f46e5"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Feed */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Actividad Reciente</h2>
            <span className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">Ver todo</span>
          </div>
          <div>
            {mockActivity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Overdue Loans Table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Préstamos Vencidos</h2>
            <p className="text-xs text-slate-500">{overdueLoans.length} préstamos requieren atención inmediata</p>
          </div>
          <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
            Gestionar multas
          </button>
        </div>
        {overdueLoans.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500/50 mb-2" />
            <p className="text-slate-400 text-sm">No hay préstamos vencidos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {["Usuario", "Libro", "Días vencido", "Multa"].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overdueLoans.map((loan) => <OverdueLoanRow key={loan.id} loan={loan} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Books */}
      <div className="glass-card p-5">
        <h2 className="text-base font-semibold text-white mb-4">Top 5 Libros más Prestados</h2>
        <div className="space-y-3">
          {mockChartData.topBooks.map((book, i) => {
            const max = mockChartData.topBooks[0].loans;
            const pct = (book.loans / max) * 100;
            return (
              <div key={book.title} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-5">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 truncate">{book.title}</span>
                    <span className="text-xs text-indigo-400 font-semibold ml-2">{book.loans} préstamos</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
