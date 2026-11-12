import { useState } from "react";
import { Search, UserPlus, Pencil, UserX, UserCheck, KeyRound, CheckCircle2, Users } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { useAuth, ROLES } from "../context/AuthContext";
import { PageHeader, Modal, Field, inputCls, Button, Table, tdCls, EmptyState, money } from "../components/ui";

const ROLE_COLORS = {
  administrador: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  bibliotecario: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  usuario:       "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

// ─── Formulario de usuario (crear / editar) ───────────────────────────────
export function UserFormModal({ user: editing, onClose, allowRole = true }) {
  const [form, setForm] = useState(editing ?? { name: "", email: "", role: "usuario", password: "" });
  const [error, setError] = useState("");
  const saveUser = useLibraryStore((s) => s.saveUser);
  const notify = useLibraryStore((s) => s.notify);
  const { user } = useAuth();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (form.name.trim().length < 3) return setError("Ingresa el nombre completo.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("El correo no tiene un formato válido.");
    if (!editing && form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    const r = saveUser(form, user?.name);
    if (r.error) return setError(r.error);
    notify(editing ? "Usuario actualizado" : `Usuario ${r.email} creado`);
    onClose(r);
  };

  return (
    <Modal title={editing ? "Editar usuario" : "Nuevo usuario"} onClose={() => onClose()}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nombre completo"><input className={inputCls} value={form.name} onChange={set("name")} /></Field>
        <Field label="Correo electrónico"><input type="email" className={inputCls} value={form.email} onChange={set("email")} /></Field>
        {allowRole && (
          <Field label="Rol">
            <select className={inputCls} value={form.role} onChange={set("role")}>
              <option value="usuario" className="bg-slate-800">Usuario</option>
              <option value="bibliotecario" className="bg-slate-800">Bibliotecario</option>
              <option value="administrador" className="bg-slate-800">Administrador</option>
            </select>
          </Field>
        )}
        {!editing && (
          <Field label="Contraseña inicial" hint="Mínimo 6 caracteres">
            <input type="password" className={inputCls} value={form.password} onChange={set("password")} />
          </Field>
        )}
        {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2.5">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" onClick={() => onClose()}>Cancelar</Button>
          <Button type="submit">{editing ? "Guardar cambios" : "Crear usuario"}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Panel de usuarios (reutilizado en /users y en /admin) ────────────────
export function UsersPanel() {
  const users = useLibraryStore((s) => s.users);
  const toggleUserStatus = useLibraryStore((s) => s.toggleUserStatus);
  const resetPassword = useLibraryStore((s) => s.resetPassword);
  const notify = useLibraryStore((s) => s.notify);
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(ROLES.ADMIN);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [editing, setEditing] = useState(null);
  const [tempPass, setTempPass] = useState(null);

  const filtered = users.filter((u) =>
    (roleFilter === "todos" || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="user-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`${inputCls} sm:max-w-[180px]`}>
          {["todos", "usuario", "bibliotecario", "administrador"].map((r) => <option key={r} value={r} className="bg-slate-800 capitalize">{r}</option>)}
        </select>
        <Button id="new-user-btn" onClick={() => setEditing("new")}><UserPlus size={15} /> Nuevo usuario</Button>
      </div>

      <Table headers={["Usuario", "Rol", "Estado", "Préstamos", "Multas", "Registro", "Acciones"]}>
        {filtered.map((u) => (
          <tr key={u.id} className="border-b border-white/4 hover:bg-white/2">
            <td className={tdCls}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">{u.avatar}</div>
                <div><p className="text-sm font-medium text-slate-200">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
              </div>
            </td>
            <td className={tdCls}><span className={`px-2 py-0.5 rounded-full border capitalize ${ROLE_COLORS[u.role]}`}>{u.role}</span></td>
            <td className={tdCls}>
              {u.status === "activo"
                ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} />Activo</span>
                : <span className="flex items-center gap-1 text-red-400"><UserX size={12} />Suspendido</span>}
            </td>
            <td className={tdCls}>{u.loans}</td>
            <td className={tdCls}><span className={u.fines > 0 ? "text-amber-400 font-semibold" : "text-slate-500"}>{u.fines > 0 ? money(u.fines) : "—"}</span></td>
            <td className={`${tdCls} text-slate-500`}>{u.joined}</td>
            <td className={tdCls}>
              <div className="flex gap-1">
                {(isAdmin || u.role === "usuario") && (
                  <>
                    <button title="Editar" onClick={() => setEditing(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"><Pencil size={14} /></button>
                    <button title="Restablecer contraseña" onClick={() => { const r = resetPassword(u.email, user?.name); setTempPass({ email: u.email, temp: r.temp }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/10"><KeyRound size={14} /></button>
                    {u.id !== user?.id && (
                      <button
                        title={u.status === "activo" ? "Suspender" : "Activar"}
                        onClick={() => { toggleUserStatus(u.id, user?.name); notify(`Usuario ${u.status === "activo" ? "suspendido" : "activado"}`, "info"); }}
                        className={`p-1.5 rounded-lg hover:bg-white/10 ${u.status === "activo" ? "text-slate-400 hover:text-red-400" : "text-slate-400 hover:text-emerald-400"}`}
                      >
                        {u.status === "activo" ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    )}
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
      {filtered.length === 0 && <EmptyState icon={Users} title="No hay usuarios que coincidan" />}

      {editing && <UserFormModal user={editing === "new" ? null : editing} allowRole={isAdmin} onClose={() => setEditing(null)} />}
      {tempPass && (
        <Modal title="Contraseña restablecida" onClose={() => setTempPass(null)}>
          <p className="text-sm text-slate-300 mb-3">Se generó una contraseña temporal para <b>{tempPass.email}</b>. Entrégala al usuario por un canal seguro.</p>
          <p className="font-mono text-lg text-amber-300 bg-white/5 rounded-xl p-3 text-center">{tempPass.temp}</p>
        </Modal>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios" subtitle="Registro, edición, suspensión y restablecimiento de contraseñas" />
      <UsersPanel />
    </div>
  );
}
