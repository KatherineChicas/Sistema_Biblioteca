import { createContext, useContext, useState } from "react";
import { useLibraryStore } from "../store/useLibraryStore";

// ─── Auth Context ─────────────────────────────────────────────────────────
const AuthContext = createContext(null);

/**
 * Roles disponibles:
 * - "administrador": Acceso total al sistema
 * - "bibliotecario": Gestión de préstamos, devoluciones y catálogo
 * - "usuario": Catálogo, historial personal
 */
export const ROLES = {
  ADMIN: "administrador",
  LIBRARIAN: "bibliotecario",
  USER: "usuario",
};

const SESSION_KEY = "bibliosys-session";

function readSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [sessionId, setSessionId] = useState(() => readSession());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]   = useState(null);
  const users = useLibraryStore((s) => s.users);
  const log = useLibraryStore((s) => s.log);

  // El usuario siempre se lee del store, así los cambios de rol/estado se reflejan al instante
  const user = users.find((u) => u.id === sessionId) ?? null;

  // Simula una llamada a la API de autenticación (1.1 / 1.2)
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 600)); // Simular latencia

    const found = users.find((u) => u.email === email.trim().toLowerCase());
    if (found && found.password === password) {
      if (found.status !== "activo") {
        setError("Tu cuenta está suspendida. Contacta a la biblioteca.");
        setIsLoading(false);
        return { success: false };
      }
      setSessionId(found.id);
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(found.id)); } catch { /* sin almacenamiento */ }
      log(found.name, "INICIO_SESION", found.email);
      setIsLoading(false);
      return { success: true };
    }
    setError("Credenciales incorrectas. Intenta de nuevo.");
    setIsLoading(false);
    return { success: false };
  };

  const logout = () => {
    if (user) log(user.name, "CIERRE_SESION", user.email);
    setSessionId(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* sin almacenamiento */ }
  };

  const hasRole = (...roles) => roles.includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error, setError, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
