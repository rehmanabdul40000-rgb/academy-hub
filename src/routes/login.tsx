import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff, GraduationCap, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { getStoredAdminSession, saveAdminSession } from "@/features/auth/auth.session";
import { getSettings } from "@/features/settings/settings.storage";
import { authenticateUser } from "@/features/users/users.storage";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Academy Hub" }, { name: "description", content: "Private access for Academy Hub student and fee management." }, { property: "og:title", content: "Sign In — Academy Hub" }, { property: "og:description", content: "Private access for Academy Hub student and fee management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false); const [isSubmitting, setIsSubmitting] = useState(false); const [isLeaving, setIsLeaving] = useState(false); const [error, setError] = useState(""); const [academyBranding, setAcademyBranding] = useState("Academy Hub");
  useEffect(() => { const s = getSettings(); setAcademyBranding(s.academyName); if (getStoredAdminSession()) navigate({ to: "/dashboard", replace: true }); }, [navigate]);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const data = new FormData(event.currentTarget); const username = String(data.get("username") ?? "").trim(); const password = String(data.get("password") ?? "");
    if (!username || !password) { setError("Enter your username and password to continue."); return; }
    setIsSubmitting(true);
    try {
      const user = authenticateUser(username, password);
      if (user) {
        saveAdminSession({ id: user.id, username: user.userId, displayName: user.displayName, email: user.email || "", role: user.role, permissions: user.permissions, signedInAt: new Date().toISOString() });
        setIsLeaving(true); await new Promise((resolve) => window.setTimeout(resolve, 200)); await navigate({ to: "/dashboard", replace: true }); return;
      }
      const currentSettings = getSettings(); const expectedUsername = currentSettings.adminUsername.trim().toLowerCase(); const expectedPassword = currentSettings.adminPassword ?? "";
      if (username.trim().toLowerCase() !== expectedUsername || password !== expectedPassword) { setError("Invalid username or password."); return; }
      saveAdminSession({ id: "admin-workspace-session", username: currentSettings.adminUsername || username, displayName: currentSettings.adminDisplayName || "Admin", email: currentSettings.contactEmail || "admin@academyhub.local", role: "admin", signedInAt: new Date().toISOString() });
      setIsLeaving(true); await new Promise((resolve) => window.setTimeout(resolve, 200)); await navigate({ to: "/dashboard", replace: true });
    } catch { setError("Something went wrong. Please try again."); } finally { setIsSubmitting(false); }
  }
  return <main className={`login-stage relative flex min-h-dvh items-center justify-center overflow-hidden bg-login px-4 py-5 transition-opacity duration-300 sm:px-6 ${isLeaving ? "opacity-0" : "opacity-100"}`}><div className="login-grid pointer-events-none absolute inset-0" /><div className="login-glow login-glow-primary pointer-events-none absolute" /><div className="login-glow login-glow-secondary pointer-events-none absolute" /><section className="login-card relative z-10 w-full max-w-[29rem] overflow-hidden rounded-[1.75rem] border border-login-border bg-login-card p-6 shadow-login backdrop-blur-2xl sm:p-9"><div className="login-highlight pointer-events-none absolute inset-x-8 top-0 h-px" /><header className="text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl border border-login-border-strong bg-login-logo shadow-logo"><GraduationCap className="size-7 text-cyan-400" /></div><div className="mt-4"><p className="font-display text-xl font-semibold text-login-heading">{academyBranding}</p><p className="mt-1 text-xs font-medium text-login-muted">Student &amp; Fee Management System</p></div><div className="mx-auto my-6 h-px w-14 bg-login-divider" /><h1 className="font-display text-2xl font-semibold tracking-tight text-login-heading sm:text-[1.75rem]">Welcome Back</h1><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-login-muted">Sign in to manage your academy</p></header><form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate><div className="space-y-1.5"><label htmlFor="username" className="text-xs font-medium text-login-label">Username</label><div className="login-input-wrap flex h-11 items-center gap-3 rounded-xl border border-login-border bg-login-input px-3.5"><UserRound className="size-4 shrink-0 text-cyan-400" /><input id="username" name="username" type="text" autoComplete="username" placeholder="Enter user ID" disabled={isSubmitting} className="login-input min-w-0 flex-1 bg-transparent text-sm text-login-heading outline-none placeholder:text-login-placeholder" /></div></div><div className="space-y-1.5"><label htmlFor="password" className="text-xs font-medium text-login-label">Password</label><div className="login-input-wrap flex h-11 items-center gap-3 rounded-xl border border-login-border bg-login-input px-3.5"><LockKeyhole className="size-4 shrink-0 text-cyan-400" /><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter password" disabled={isSubmitting} className="login-input min-w-0 flex-1 bg-transparent text-sm text-login-heading outline-none placeholder:text-login-placeholder" /><Button type="button" variant="ghost" size="icon" disabled={isSubmitting} onClick={() => setShowPassword((v) => !v)} className="size-7 shrink-0">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></div></div><div aria-live="polite">{error ? <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-login-error-border bg-login-error px-3.5 py-2.5 text-xs text-login-error-foreground"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div> : null}</div><Button type="submit" disabled={isSubmitting} className="login-button h-11 w-full rounded-xl bg-login-button text-sm font-semibold text-login-button-foreground">{isSubmitting ? "Signing in..." : "Sign In to Dashboard"}</Button></form><footer className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-login-muted"><ShieldCheck className="size-3.5 text-cyan-400" />Secure workspace access</footer></section></main>;
}
