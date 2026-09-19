import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Save } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/academy/app-shell";
import { Button } from "@/components/ui/button";
import { getStoredAdminSession } from "@/features/auth/auth.session";
import { getSettings, saveSettings } from "@/features/settings/settings.storage";
import { getUsers, updateUser } from "@/features/users/users.storage";

export const Route = createFileRoute("/_authenticated/change-password")({ component: ChangePasswordPage });

function ChangePasswordPage() {
  const session = getStoredAdminSession();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (next.length < 4) return setMessage("New password must be at least 4 characters.");
    if (next !== confirm) return setMessage("New password and confirmation do not match.");
    if (session?.id === "admin-workspace-session") {
      const settings = getSettings();
      if (current !== settings.adminPassword) return setMessage("Current password is incorrect.");
      saveSettings({ adminPassword: next });
    } else {
      const user = session ? getUsers().find((item) => item.id === session.id) : undefined;
      if (!user || current !== user.password) return setMessage("Current password is incorrect.");
      updateUser(user.id, { password: next });
    }
    setCurrent(""); setNext(""); setConfirm(""); setMessage("Password changed successfully.");
  }

  return <AppShell title="Change Password" subtitle="Update your own login password whenever you need to.">
    <div className="max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-border pb-4"><span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400"><KeyRound className="size-5" /></span><div><h2 className="font-display font-semibold">Change Your Password</h2><p className="text-xs text-muted-foreground">Signed in as {session?.username || "current user"}.</p></div></div>
      {message && <div className="mt-5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-300">{message}</div>}
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-xs font-medium">Current Password<input required type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
        <label className="block text-xs font-medium">New Password<input required type="password" value={next} onChange={(e) => setNext(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
        <label className="block text-xs font-medium">Confirm New Password<input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
        <Button type="submit" className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500"><Save className="size-4" />Change Password</Button>
      </form>
    </div>
  </AppShell>;
}
