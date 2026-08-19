import { createContext, useContext, useState } from "react";

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

const MOCK_USERS = {
  "admin@biblioteca.edu": {
    id: 6, name: "Admin Sistema", email: "admin@biblioteca.edu",
    role: ROLES.ADMIN, avatar: "AS", password: "admin123"
  },
  "maria@biblioteca.edu": {
    id: 3, name: "María Fernández", email: "maria@biblioteca.edu",
    role: ROLES.LIBRARIAN, avatar: "MF", password: "biblio123"
  },
  "ana@universidad.edu": {
    id: 1, name: "Ana García López", email: "ana@universidad.edu",
    role: ROLES.USER, avatar: "AG", password: "user123"
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]   = useState(null);

  // Simula una llamada a la API de autenticación
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 800)); // Simular latencia

    const found = MOCK_USERS[email.toLowerCase()];
    if (found && found.password === password) {
      setUser(found);
      setIsLoading(false);
      return { success: true };
    }
    setError("Credenciales incorrectas. Intenta de nuevo.");
    setIsLoading(false);
    return { success: false };
  };

  const logout = () => setUser(null);

  const hasRole = (...roles) => roles.includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
