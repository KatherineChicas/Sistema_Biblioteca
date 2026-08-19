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

// ─── Ruta protegida ───────────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/catalog" replace />;
  return children;
}

// ─── Layout wrapper for protected pages ──────────────────────────────────
function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────
function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === ROLES.ADMIN || user.role === ROLES.LIBRARIAN ? "/dashboard" : "/catalog"} /> : <LoginPage />}
      />

      {/* Protected – Admin + Librarian */}
      <Route path="/dashboard" element={
        <AppLayout><DashboardPage /></AppLayout>
      } />
      <Route path="/loans" element={
        <AppLayout><LoansPage /></AppLayout>
      } />
      <Route path="/returns" element={
        <AppLayout><ReturnsPage /></AppLayout>
      } />
      <Route path="/reports" element={
        <AppLayout><ReportsPage /></AppLayout>
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
      </AuthProvider>
    </BrowserRouter>
  );
}
