import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2, DatabaseZap } from "lucide-react";
import { useLibraryStore } from "./store/useLibraryStore";
import { startRemoteSync } from "./store/remoteSync";
import { AuthProvider, useAuth, ROLES } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage    from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CatalogPage  from "./pages/CatalogPage";
import LoansPage    from "./pages/LoansPage";
import ReturnsPage  from "./pages/ReturnsPage";
import ReportsPage  from "./pages/ReportsPage";
import AdminPage    from "./pages/AdminPage";
import UsersPage    from "./pages/UsersPage";
import FinesPage    from "./pages/FinesPage";
import MyLoansPage  from "./pages/MyLoansPage";
import SalesPage    from "./pages/SalesPage";
import SettingsPage from "./pages/SettingsPage";
import { Toaster }  from "./components/ui";

// ─── Ruta protegida ───────────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/catalog" replace />;
  return children;
}

// ─── Layout wrapper for protected pages ──────────────────────────────────
function AppLayout({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────
function AppRouter() {
  const { user } = useAuth();

  const STAFF = [ROLES.ADMIN, ROLES.LIBRARIAN];
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === ROLES.ADMIN || user.role === ROLES.LIBRARIAN ? "/dashboard" : "/catalog"} /> : <LoginPage />}
      />

      {/* Protected – Admin + Librarian */}
      <Route path="/dashboard" element={
        <AppLayout roles={STAFF}><DashboardPage /></AppLayout>
      } />
      <Route path="/loans" element={
        <AppLayout roles={STAFF}><LoansPage /></AppLayout>
      } />
      <Route path="/returns" element={
        <AppLayout roles={STAFF}><ReturnsPage /></AppLayout>
      } />
      <Route path="/reports" element={
        <AppLayout roles={STAFF}><ReportsPage /></AppLayout>
      } />
      <Route path="/admin" element={
        <ProtectedRoute roles={[ROLES.ADMIN]}>
          <Layout><AdminPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Protected – All roles */}
      <Route path="/catalog" element={
        <AppLayout><CatalogPage /></AppLayout>
      } />

      {/* Nuevas rutas (antes enlaces rotos del menú) */}
      <Route path="/users"    element={<AppLayout roles={STAFF}><UsersPage /></AppLayout>} />
      <Route path="/fines"    element={<AppLayout roles={STAFF}><FinesPage /></AppLayout>} />
      <Route path="/settings" element={<AppLayout roles={[ROLES.ADMIN]}><SettingsPage /></AppLayout>} />
      <Route path="/sales"    element={<AppLayout><SalesPage /></AppLayout>} />
      <Route path="/my-loans" element={<AppLayout roles={[ROLES.USER]}><MyLoansPage /></AppLayout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/catalog" : "/login"} replace />} />
    </Routes>
  );
}

// ─── Pantalla mientras se conecta con la base de datos ───────────────────
function RemoteGate({ children }) {
  const remote = useLibraryStore((s) => s.remote);
  useEffect(() => { startRemoteSync(); }, []);
  if (remote.status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <p className="text-sm">Conectando con la base de datos...</p>
      </div>
    );
  }
  if (remote.status === "error") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="glass-card max-w-lg p-6 text-slate-300">
          <DatabaseZap className="text-red-400 mb-3" size={28} />
          <h1 className="text-lg font-bold text-white mb-2">No se pudo conectar con la base de datos</h1>
          <p className="text-sm mb-3">Revisa que el archivo <code className="text-indigo-300">.env</code> tenga la URL y la clave correctas y que el script <code className="text-indigo-300">supabase/schema.sql</code> se haya ejecutado en Supabase.</p>
          <p className="text-xs font-mono text-red-300 bg-red-500/10 rounded-lg p-3 break-words">{remote.error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl">Reintentar</button>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <RemoteGate>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </RemoteGate>
      <Toaster />
    </BrowserRouter>
  );
}
