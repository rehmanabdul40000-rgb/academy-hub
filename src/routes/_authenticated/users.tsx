import { createFileRoute, redirect } from "@tanstack/react-router";
import { Check, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/academy/app-shell";
import { can } from "@/features/auth/permissions";
import { isWorkspaceSectionEnabled } from "@/features/workspace/workspace.storage";
import { Button } from "@/components/ui/button";
import { createUser, DEFAULT_PERMISSIONS, deleteUser, getUsers, updateUser, type AcademyUser, type PermissionKey, type UserPermissions } from "@/features/users/users.storage";

export const Route = createFileRoute("/_authenticated/users")({ beforeLoad: () => { if (!isWorkspaceSectionEnabled("userManagement") || !can("userManagement")) throw redirect({ to: "/dashboard" }); }, component: UsersPage });

const permissionLabels: Record<PermissionKey, string> = {
  dashboard: "View Dashboard", studentsView: "View Students", studentsSave: "Save Students", studentsEdit: "Edit Students", studentsDelete: "Delete Students", payments: "Collect / Manage Payments", reports: "Reports & Excel Export", shiftManagement: "Manage Shifts", userManagement: "Manage Users & Permissions", settings: "Workspace Settings",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AcademyUser[]>(getUsers());
  const [userId, setUserId] = useState(""); const [displayName, setDisplayName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [role, setRole] = useState<"User" | "Manager">("User");
  const [permissions, setPermissions] = useState<UserPermissions>({ ...DEFAULT_PERMISSIONS }); const [message, setMessage] = useState("");
  useEffect(() => { const fn = () => setUsers(getUsers()); window.addEventListener("academy-users-updated", fn); return () => window.removeEventListener("academy-users-updated", fn); }, []);
  function toggle(key: PermissionKey) { setPermissions((p) => ({ ...p, [key]: !p[key] })); }
  function setAll(value: boolean) { setPermissions(Object.fromEntries(Object.keys(DEFAULT_PERMISSIONS).map((k) => [k, value])) as UserPermissions); }
  function submit(e: React.FormEvent) { e.preventDefault(); const result = createUser({ userId, displayName: displayName || userId, email: email || undefined, password, role, permissions, active: true }); if (!result.success) { setMessage(result.error || "Unable to create user."); return; } setUsers(getUsers()); setUserId(""); setDisplayName(""); setEmail(""); setPassword(""); setRole("User"); setPermissions({ ...DEFAULT_PERMISSIONS }); setMessage("User created successfully. The user can change their password after signing in."); }
  return <AppShell title="Users & Permissions" subtitle="Create staff accounts and control exactly what each user can view or change.">
    <div className="max-w-6xl space-y-6">
      {message && <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-300">{message}</div>}
      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4"><span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400"><UserPlus className="size-5" /></span><div><h2 className="font-display font-semibold">Create User Account</h2><p className="text-xs text-muted-foreground">Assign a User ID and password, then grant the required rights.</p></div></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium">User ID *<input required value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="e.g. teacher01" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
          <label className="text-xs font-medium">Display Name *<input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Ali Raza" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
          <label className="text-xs font-medium">Email (optional)<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
          <label className="text-xs font-medium">Initial Password *<input required minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set temporary password" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
        </div>
        <div className="mt-4"><label className="text-xs font-medium">Role<select value={role} onChange={(e) => setRole(e.target.value as "User" | "Manager")} className="mt-1 h-10 rounded-lg border border-input bg-background px-3 text-sm"><option>User</option><option>Manager</option></select></label></div>
        <div className="mt-6 rounded-xl border border-border bg-background/40 p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">Permissions</h3><p className="text-xs text-muted-foreground">Enable only the rights this account needs.</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setAll(true)}>All Rights</Button><Button type="button" size="sm" variant="ghost" onClick={() => setAll(false)}>Clear All</Button></div></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(Object.keys(permissionLabels) as PermissionKey[]).map((key) => <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted/30"><input type="checkbox" checked={permissions[key]} onChange={() => toggle(key)} className="size-4 accent-cyan-500" /><span>{permissionLabels[key]}</span></label>)}</div></div>
        <div className="mt-5 flex justify-end"><Button type="submit" className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500"><ShieldCheck className="size-4" />Create User</Button></div>
      </form>
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm"><h2 className="font-display font-semibold">Existing Users</h2><div className="mt-4 space-y-3">{users.length ? users.map((user) => <div key={user.id} className="grid gap-3 rounded-xl border border-border p-4 lg:grid-cols-[1fr_1fr_140px_120px_auto] lg:items-center"><div><p className="font-semibold">{user.displayName}</p><p className="text-xs text-muted-foreground">{user.userId}{user.email ? ` • ${user.email}` : ""}</p></div><div className="text-xs text-muted-foreground">{Object.values(user.permissions).filter(Boolean).length} permissions enabled</div><select value={user.role} onChange={(e) => { updateUser(user.id, { role: e.target.value as "User" | "Manager" }); setUsers(getUsers()); }} className="h-9 rounded-lg border border-input bg-background px-2 text-xs"><option>User</option><option>Manager</option></select><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={user.active} onChange={(e) => { updateUser(user.id, { active: e.target.checked }); setUsers(getUsers()); }} />Active</label><Button variant="ghost" size="icon" title="Delete user" onClick={() => { if (window.confirm(`Delete user ${user.userId}?`)) { deleteUser(user.id); setUsers(getUsers()); } }} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button></div>) : <div className="py-8 text-center text-sm text-muted-foreground">No staff users created yet.</div>}</div></section>
    </div>
  </AppShell>;
}
