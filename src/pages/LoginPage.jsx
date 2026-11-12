import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useLibraryStore, computeMetrics } from "../store/useLibraryStore";
import { Modal, Field, inputCls, Button } from "../components/ui";
import { UserFormModal } from "./UsersPage";

// Restablecimiento de contraseña (requerimiento 1.4) – simulado: muestra la clave temporal
function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const resetPassword = useLibraryStore((s) => s.resetPassword);
  return (
    <Modal title="Restablecer contraseña" onClose={onClose}>
      {result?.temp ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">En un entorno real se enviaría un correo a <b>{email}</b>. Para esta demo, tu contraseña temporal es:</p>
          <p className="font-mono text-lg text-amber-300 bg-white/5 rounded-xl p-3 text-center">{result.temp}</p>
          <Button className="w-full" onClick={onClose}>Volver al inicio de sesión</Button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setResult(resetPassword(email)); }}>
          <Field label="Correo de tu cuenta"><input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          {result?.error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2.5">{result.error}</p>}
          <Button type="submit" className="w-full">Generar contraseña temporal</Button>
        </form>
      )}
    </Modal>
  );
}

// Credenciales de demo para mostrar al usuario
const DEMO_CREDENTIALS = [
  { role: "Administrador", email: "admin@biblioteca.edu", password: "admin123", color: "from-violet-500 to-indigo-600" },
  { role: "Bibliotecario", email: "harold@biblioteca.edu", password: "harold123", color: "from-emerald-500 to-teal-600" },
  { role: "Usuario",       email: "diego@unitec.edu",  password: "diego123",   color: "from-sky-500 to-blue-600" },
];

const ROLE_REDIRECTS = {
  [ROLES.ADMIN]:     "/dashboard",
  [ROLES.LIBRARIAN]: "/catalog",
  [ROLES.USER]:      "/catalog",
};

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // "forgot" | "register"
  const metrics = computeMetrics(useLibraryStore());
  const notify = useLibraryStore((s) => s.notify);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      // Redirigir según el rol cargado
      const storedRole = Object.values(ROLES).find((r) =>
        DEMO_CREDENTIALS.find((c) => c.email === email && c.role.toLowerCase().includes(r))
      );
      navigate(ROLE_REDIRECTS[storedRole] ?? "/catalog");
    }
  };

  const handleDemoLogin = async (cred) => {
    const result = await login(cred.email, cred.password);
    if (result.success) navigate(ROLE_REDIRECTS[cred.role.toLowerCase()] ?? "/catalog");
  };

  const quickLogin = async (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    const res = await login(cred.email, cred.password);
    if (res.success) {
      const mapping = {
        "Administrador": ROLE_REDIRECTS[ROLES.ADMIN],
        "Bibliotecario": ROLE_REDIRECTS[ROLES.LIBRARIAN],
        "Usuario":       ROLE_REDIRECTS[ROLES.USER],
      };
      navigate(mapping[cred.role] ?? "/catalog");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel – Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-56 h-56 bg-violet-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay:"1s"}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-center">
          {/* Logo */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl mb-8 animate-float">
            <BookOpen size={36} className="text-white" />
          </div>

          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            Biblio<span className="gradient-text"> Grupo 4</span>
          </h1>
          <p className="text-slate-300 text-lg mb-3 font-medium">Sistema de Gestión de Biblioteca</p>
          <p className="text-slate-500 text-sm max-w-sm">
            Digitaliza los procesos de inventario, préstamos, devoluciones, ventas y generación de informes.
          </p>

          {/* Stats chips */}
          <div className="flex gap-4 mt-10">
            {[
              { label: "Libros", value: metrics.totalBooks },
              { label: "Usuarios", value: metrics.activeUsers },
              { label: "Préstamos", value: metrics.activeLoans },
            ].map((s) => (
              <div key={s.label} className="glass-card px-4 py-3 text-center">
                <p className="text-2xl font-bold text-indigo-300">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel – Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">Biblioteca Grupo 4</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
            <p className="text-slate-400">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@biblioteca.edu"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password-input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar al Sistema
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="flex justify-between mt-4 text-xs">
            <button id="forgot-btn" onClick={() => setModal("forgot")} className="text-slate-400 hover:text-indigo-300">¿Olvidaste tu contraseña?</button>
            <button id="register-btn" onClick={() => setModal("register")} className="text-indigo-400 hover:text-indigo-300 font-medium">Crear cuenta nueva</button>
          </div>
          {modal === "forgot" && <ForgotPasswordModal onClose={() => setModal(null)} />}
          {modal === "register" && (
            <UserFormModal allowRole={false} onClose={(u) => {
              setModal(null);
              if (u) { setEmail(u.email); notify("Cuenta creada. Ya puedes iniciar sesión."); }
            }} />
          )}

          {/* Demo Credentials */}
          <div className="mt-8">
            <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wider">
              — Acceso rápido —
            </p>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  id={`demo-${cred.role.toLowerCase()}-btn`}
                  onClick={() => quickLogin(cred)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/3 hover:bg-white/7 border border-white/8 rounded-xl transition-all duration-200 group disabled:opacity-50"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cred.color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {cred.role[0]}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-slate-300">{cred.role}</p>
                    <p className="text-xs text-slate-500">{cred.email}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
