import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
