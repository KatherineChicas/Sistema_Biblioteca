import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen, LayoutDashboard, Users, ShoppingCart, RotateCcw,
  BarChart3, Settings, LogOut, Menu, X, Bell, Search,
  BookMarked, AlertTriangle, ChevronRight, Shield,
} from "lucide-react";
import { useAuth, ROLES } from "../context/AuthContext";

// ─── Configuración de navegación por rol ────────────────────────────────
const NAV_CONFIG = {
  [ROLES.ADMIN]: [
    { to: "/dashboard",    label: "Dashboard",     icon: LayoutDashboard, badge: null },
    { to: "/catalog",      label: "Catálogo",      icon: BookOpen,        badge: null },
    { to: "/loans",        label: "Préstamos",     icon: BookMarked,      badge: 3 },
    { to: "/returns",      label: "Devoluciones",  icon: RotateCcw,       badge: null },
    { to: "/sales",        label: "Ventas",        icon: ShoppingCart,    badge: null },
    { to: "/reports",      label: "Informes",      icon: BarChart3,       badge: null },
    { to: "/users",        label: "Usuarios",      icon: Users,           badge: null },
    { to: "/admin",        label: "Administración",icon: Shield,          badge: null },
    { to: "/settings",     label: "Configuración", icon: Settings,        badge: null },
  ],
  [ROLES.LIBRARIAN]: [
    { to: "/catalog",      label: "Catálogo",      icon: BookOpen,        badge: null },
    { to: "/loans",        label: "Préstamos",     icon: BookMarked,      badge: 3 },
    { to: "/returns",      label: "Devoluciones",  icon: RotateCcw,       badge: null },
    { to: "/fines",        label: "Multas",        icon: AlertTriangle,   badge: 2 },
    { to: "/users",        label: "Usuarios",      icon: Users,           badge: null },
  ],
  [ROLES.USER]: [
    { to: "/catalog",      label: "Catálogo",      icon: BookOpen,        badge: null },
    { to: "/my-loans",     label: "Mis Préstamos", icon: BookMarked,      badge: null },
    { to: "/sales",        label: "Mis Compras",   icon: ShoppingCart,    badge: null },
  ],
};

const ROLE_COLORS = {
  [ROLES.ADMIN]:     "from-violet-500 to-indigo-600",
  [ROLES.LIBRARIAN]: "from-emerald-500 to-teal-600",
  [ROLES.USER]:      "from-sky-500 to-blue-600",
};

const ROLE_LABELS = {
  [ROLES.ADMIN]:     "Administrador",
  [ROLES.LIBRARIAN]: "Bibliotecario",
  [ROLES.USER]:      "Usuario",
};

// ─── Sidebar Item ────────────────────────────────────────────────────────
function SidebarItem({ item, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
         ${isActive
           ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
           : "text-slate-400 hover:bg-white/5 hover:text-slate-100 border border-transparent"
         }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Indicador activo */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-r-full" />
          )}
          <Icon size={18} className="flex-shrink-0 ml-1" />
          {!collapsed && (
            <span className="text-sm font-medium flex-1 whitespace-nowrap">{item.label}</span>
          )}
          {!collapsed && item.badge && (
            <span className="text-xs bg-indigo-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {item.badge}
            </span>
          )}
          {collapsed && item.badge && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 rounded-full text-[9px] text-white flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_CONFIG[user?.role] ?? [];
  const gradientClass = ROLE_COLORS[user?.role] ?? "from-violet-500 to-indigo-600";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <BookOpen size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight">BiblioSys</p>
            <p className="text-xs text-slate-500 leading-tight">Universidad Digital</p>
          </div>
        )}
        <button
          onClick={onCollapse}
          className="ml-auto text-slate-500 hover:text-slate-300 transition-colors hidden lg:flex"
        >
          {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* User Card */}
      <div className={`mx-3 mt-3 p-3 rounded-xl bg-white/4 border border-white/6 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center text-xs font-bold text-white`}>
            {user?.avatar}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
              {user?.avatar}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">{ROLE_LABELS[user?.role]}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-widest text-slate-600 px-3 mb-2">Menú</p>
        )}
        {navItems.map((item) => (
          <SidebarItem
            key={item.to}
            item={item}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={18} className="flex-shrink-0 ml-1" />
          {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-white/5 h-full transition-all duration-300 ease-in-out flex-shrink-0
          ${collapsed ? "w-16" : "w-60"}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Close button */}
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}

// ─── Topbar / Navbar ─────────────────────────────────────────────────────
function Topbar({ onMobileMenuOpen, collapsed }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  return (
    <header className="h-14 flex items-center gap-4 px-4 border-b border-white/5 bg-slate-900/60 backdrop-blur-xl flex-shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden text-slate-400 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar libros, usuarios..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-3">
        {/* Notifications */}
        <button className="relative text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        {/* User chip */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300">
          <span className="text-slate-500">Bienvenido,</span>
          <span className="font-medium">{user?.name?.split(" ")[0]}</span>
        </div>
      </div>
    </header>
  );
}

// ─── Layout Principal ─────────────────────────────────────────────────────
export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          onMobileMenuOpen={() => setMobileOpen(true)}
          collapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
