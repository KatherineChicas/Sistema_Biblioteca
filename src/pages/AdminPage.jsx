import { useState } from "react";
import {
  Users, Shield, Activity, Database, Download,
  ChevronRight, Search, MoreVertical, UserCheck, UserX,
  Clock, CheckCircle2, Settings, Bell, Lock, Globe,
} from "lucide-react";
import { mockUsers } from "../data/mockData";

// ─── User Row ─────────────────────────────────────────────────────────────
function UserRow({ user }) {
  const roleColors = {
    administrador: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    bibliotecario:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    usuario:        "text-sky-400 bg-sky-500/10 border-sky-500/20",
  };
  const statusColors = {
    activo:     "text-emerald-400",
    suspendido: "text-red-400",
  };

  return (
    <tr className="border-b border-white/4 hover:bg-white/2 transition-colors group">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
            {user.name.slice(0,2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${roleColors[user.role]}`}>
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${statusColors[user.status]}`}>
          {user.status === "activo"
            ? <><CheckCircle2 size={12} />Activo</>
            : <><UserX size={12} />Suspendido</>
          }
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-400">{user.loans}</td>
      <td className="px-4 py-3.5">
        <span className={`text-xs font-semibold ${user.fines > 0 ? "text-amber-400" : "text-slate-500"}`}>
          {user.fines > 0 ? `$${user.fines.toFixed(2)}` : "—"}
        </span>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500">{user.joined}</td>
      <td className="px-4 py-3.5">
        <button className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
          <MoreVertical size={15} />
        </button>
      </td>
    </tr>
  );
}

// ─── AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeSection, setSection] = useState("users");
  const [search, setSearch]         = useState("");

  const filteredUsers = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sections = [
    { key: "users",    label: "Usuarios",     icon: Users    },
    { key: "security", label: "Seguridad",    icon: Shield   },
    { key: "audit",    label: "Auditoría",    icon: Activity },
    { key: "backup",   label: "Respaldos",    icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Administración del Sistema</h1>
        <p className="text-slate-400 text-sm">Gestión de usuarios, seguridad, auditoría y configuración</p>
      </div>

      {/* Section Nav */}
      <div className="flex gap-2 flex-wrap">
        {sections.map((s) => (
          <button
            key={s.key}
            id={`admin-tab-${s.key}`}
            onClick={() => setSection(s.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeSection === s.key
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "glass-card text-slate-400 border-transparent hover:border-indigo-500/30 hover:text-white"
              }`}
          >
            <s.icon size={15} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Users Section */}
      {activeSection === "users" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="admin-user-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario..."
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all">
              <UserCheck size={15} />
              Nuevo Usuario
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/8">
                  <tr>
                    {["Usuario","Rol","Estado","Préstamos","Multas","Registro",""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => <UserRow key={u.id} user={u} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Security Section */}
      {activeSection === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          {[
            { icon: Lock,     title: "Autenticación de 2 Factores", desc: "Requerir 2FA para roles admin", enabled: true  },
            { icon: Clock,    title: "Sesión máxima",               desc: "Tiempo de inactividad: 30 min",  enabled: true  },
            { icon: Shield,   title: "Bloqueo por intentos",        desc: "Bloquear tras 5 intentos fallidos", enabled: true },
            { icon: Globe,    title: "Restricción de IP",           desc: "Limitar acceso por rango de IP",    enabled: false },
            { icon: Bell,     title: "Alertas de seguridad",        desc: "Notificar accesos sospechosos",     enabled: true  },
            { icon: Settings, title: "Logs de actividad",           desc: "Guardar log de acciones de admin",  enabled: true  },
          ].map((item) => (
            <div key={item.title} className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <item.icon size={18} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full cursor-pointer transition-all duration-300 ${item.enabled ? "bg-indigo-600" : "bg-white/10"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${item.enabled ? "left-5.5" : "left-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Section */}
      {activeSection === "audit" && (
        <div className="glass-card animate-fade-in-up overflow-hidden">
          <div className="p-4 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Registro de Auditoría</h2>
            <button className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg">
              <Download size={12} />
              Exportar CSV
            </button>
          </div>
          <div className="divide-y divide-white/4">
            {[
              { user:"admin@biblioteca.edu", action:"Préstamo creado", resource:"L-2024-001",  time:"Hace 5 min",   type:"info"    },
              { user:"maria@biblioteca.edu", action:"Usuario modificado", resource:"Ana García", time:"Hace 20 min", type:"warning" },
              { user:"admin@biblioteca.edu", action:"Configuración actualizada", resource:"Sistema", time:"Hace 1h",  type:"info"   },
              { user:"admin@biblioteca.edu", action:"Backup generado", resource:"BD-2024-12",   time:"Hace 3h",  type:"success"    },
              { user:"admin@biblioteca.edu", action:"Sesión iniciada", resource:"IP:192.168.1.5", time:"Hace 3h", type:"info"     },
              { user:"maria@biblioteca.edu", action:"Multa registrada", resource:"L-2024-002", time:"Hace 4h",    type:"warning"   },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-white/2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  log.type === "success" ? "bg-emerald-400"
                  : log.type === "warning" ? "bg-amber-400"
                  : "bg-indigo-400"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300">{log.action} — <span className="text-indigo-400">{log.resource}</span></p>
                  <p className="text-[10px] text-slate-500">{log.user}</p>
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup Section */}
      {activeSection === "backup" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="glass-card p-5">
            <h2 className="text-base font-semibold text-white mb-4">Estado del Respaldo</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label:"Último respaldo",  value:"Hace 3 horas",      color:"text-emerald-400" },
                { label:"Tamaño de BD",     value:"248 MB",             color:"text-indigo-400" },
                { label:"Respaldos totales",value:"142",                color:"text-violet-400" },
                { label:"Próximo auto",     value:"En 21 horas",        color:"text-amber-400" },
              ].map((s) => (
                <div key={s.label} className="bg-white/4 rounded-xl p-3">
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
            <button
              id="create-backup-btn"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-500/20"
            >
              <Database size={16} />
              Crear Respaldo Ahora
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/8">
              <h2 className="text-sm font-semibold text-white">Historial de Respaldos</h2>
            </div>
            {[
              { id:"BD-2024-12-15-03", date:"2024-12-15 03:00", size:"248 MB", type:"Automático", ok:true  },
              { id:"BD-2024-12-14-18", date:"2024-12-14 18:32", size:"246 MB", type:"Manual",     ok:true  },
              { id:"BD-2024-12-14-03", date:"2024-12-14 03:00", size:"245 MB", type:"Automático", ok:true  },
              { id:"BD-2024-12-13-03", date:"2024-12-13 03:00", size:"243 MB", type:"Automático", ok:false },
            ].map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-4 py-3 border-b border-white/4 last:border-0 hover:bg-white/2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${b.ok ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                  {b.ok ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Shield size={14} className="text-red-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-mono text-slate-300">{b.id}</p>
                  <p className="text-[10px] text-slate-500">{b.date} · {b.type}</p>
                </div>
                <span className="text-xs text-slate-400">{b.size}</span>
                <button className="text-indigo-400 hover:text-indigo-300 p-1 rounded-lg hover:bg-indigo-500/10 transition-all">
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
