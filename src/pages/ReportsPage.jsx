import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from "recharts";
import { Download, TrendingUp, Calendar, Filter } from "lucide-react";
import { useLibraryStore, computeMetrics, computeChartData, loanStatus } from "../store/useLibraryStore";
import { useAuth } from "../context/AuthContext";
import { exportReportPDF } from "../utils/reportPdf";
import { useState } from "react";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 border border-white/10 text-xs">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{p.dataKey === "sales" ? `L ${Number(p.value).toLocaleString()}` : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("6m");
  const state = useLibraryStore();
  const { user } = useAuth();
  const mockMetrics = computeMetrics(state);
  const mockChartData = computeChartData(state, mockMetrics);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const file = await exportReportPDF({ state, metrics: mockMetrics, chart: mockChartData, author: user?.name, loanStatus });
      state.log(user?.name, "INFORME_EXPORTADO", file);
      state.notify(`Informe ${file} descargado`);
    } catch (e) {
      state.notify("No se pudo generar el PDF: " + e.message, "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Informes y Estadísticas</h1>
          <p className="text-slate-400 text-sm">Análisis completo de operaciones de la biblioteca</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 gap-1">
            {["1m","3m","6m","1a"].map((p) => (
              <button
                key={p}
                id={`period-${p}`}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                  ${period === p ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button id="export-pdf-btn" onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50">
            <Download size={15} />
            {exporting ? "Generando..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Ingresos totales",  value:`L ${mockMetrics.totalRevenue.toLocaleString()}`, sub:"Este mes", color:"text-indigo-400", bg:"bg-indigo-500/10" },
          { label:"Por ventas",        value:`L ${mockMetrics.monthlySales.toLocaleString()}`,  sub:`${Math.round(mockMetrics.monthlySales/(mockMetrics.totalRevenue || 1)*100)}%`, color:"text-violet-400", bg:"bg-violet-500/10" },
          { label:"Por rentas",        value:`L ${mockMetrics.monthlyRentals.toLocaleString()}`,sub:`${Math.round(mockMetrics.monthlyRentals/(mockMetrics.totalRevenue || 1)*100)}%`, color:"text-emerald-400", bg:"bg-emerald-500/10" },
          { label:"Por multas",        value:`L ${mockMetrics.monthlyFines.toLocaleString()}`,  sub:`${Math.round(mockMetrics.monthlyFines/(mockMetrics.totalRevenue || 1)*100)}%`, color:"text-amber-400", bg:"bg-amber-500/10" },
        ].map((kpi) => (
          <div key={kpi.label} className={`glass-card p-4 border border-white/6`}>
            <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
              <TrendingUp size={16} className={kpi.color} />
            </div>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-slate-300 font-medium mt-0.5">{kpi.label}</p>
            <p className="text-xs text-slate-500">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Area Chart – Trend */}
      <div className="glass-card p-5">
        <h2 className="text-base font-semibold text-white mb-1">Tendencia de Ingresos</h2>
        <p className="text-xs text-slate-500 mb-5">Evolución de ventas, rentas y multas por mes</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={mockChartData.loansByMonth} margin={{ top:5, right:5, bottom:5, left:-10 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize:11, fill:"#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:"#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:"11px", color:"#94a3b8" }} />
            <Area type="monotone" dataKey="sales" name="Ventas (L)" stroke="#6366f1" strokeWidth={2.5} fill="url(#salesGrad)" />
            <Line type="monotone" dataKey="loans" name="Préstamos" stroke="#22c55e" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Genre Distribution */}
        <div className="glass-card p-5">
          <h2 className="text-base font-semibold text-white mb-1">Préstamos por Género</h2>
          <p className="text-xs text-slate-500 mb-4">Distribución de demanda por categoría</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockChartData.genreDistribution} layout="vertical" margin={{ top:0, right:20, bottom:0, left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:"#64748b" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="genre" type="category" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} width={65} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Préstamos" fill="#6366f1" radius={[0,6,6,0]}>
                {mockChartData.genreDistribution.map((_, i) => (
                  <Cell key={i} fill={["#6366f1","#8b5cf6","#06b6d4","#22c55e","#f59e0b","#f43f5e"][i % 6]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Pie */}
        <div className="glass-card p-5">
          <h2 className="text-base font-semibold text-white mb-1">Composición de Ingresos</h2>
          <p className="text-xs text-slate-500 mb-4">Proporción por fuente de ingreso</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={mockChartData.revenueByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {mockChartData.revenueByCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {mockChartData.revenueByCategory.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200">L {item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.value / (mockMetrics.totalRevenue || 1)) * 100}%`,
                        backgroundColor: item.fill
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Books Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Top Libros por Demanda</h2>
          <button className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Filter size={11} />
            Filtrar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/4">
              <tr>
                {["#","Libro","Préstamos","Popularidad"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockChartData.topBooks.map((book, i) => {
                const max = mockChartData.topBooks[0].loans;
                return (
                  <tr key={book.title} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-slate-500">#{i+1}</td>
                    <td className="px-4 py-3 text-sm text-slate-200">{book.title}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-indigo-400">{book.loans}</td>
                    <td className="px-4 py-3 w-40">
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                          style={{ width: `${(book.loans/max)*100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
