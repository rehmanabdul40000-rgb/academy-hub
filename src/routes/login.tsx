import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { signInAdmin } from "@/features/auth/auth.functions";
import { getStoredAdminSession, saveAdminSession } from "@/features/auth/auth.session";
import { getSettings } from "@/features/settings/settings.storage";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Academy Hub" },
      {
        name: "description",
        content: "Private administrator access for Academy Hub student and fee management.",
      },
      { property: "og:title", content: "Sign In — Academy Hub" },
      {
        property: "og:description",
        content: "Private administrator access for Academy Hub student and fee management.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const authenticate = useServerFn(signInAdmin);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState("");
  const [academyBranding, setAcademyBranding] = useState("Academy Hub");

  useEffect(() => {
    const s = getSettings();
    setAcademyBranding(s.academyName);

    if (getStoredAdminSession()) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!username || !password) {
      setError("Enter your username and password to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      // The single source of truth for admin credentials is the persistent workspace settings
      const currentSettings = getSettings();
      const expectedUsername = (currentSettings.adminUsername || "admin123").trim().toLowerCase();
      const expectedPassword = currentSettings.adminPassword || "admin";

      const enteredUsername = username.trim().toLowerCase();
      const isUsernameMatch = enteredUsername === expectedUsername;
      const isPasswordMatch = password === expectedPassword;

      if (!isUsernameMatch || !isPasswordMatch) {
        setError("Invalid username or password.");
        return;
      }

      saveAdminSession({
        id: "admin-workspace-session",
        username: currentSettings.adminUsername || username,
        displayName: currentSettings.adminDisplayName || "Admin",
        email: currentSettings.contactEmail || "admin@academyhub.local",
        role: "admin",
        signedInAt: new Date().toISOString(),
      });

      // Sync Supabase backend session if online
      try {
        const result = await authenticate({
          data: { username: expectedUsername, password: expectedPassword },
        });
        if (result.ok && result.accessToken && result.refreshToken) {
          await supabase.auth.setSession({
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
          });
        }
      } catch {
        // Continue if Supabase backend is offline
      }

      setIsLeaving(true);
      await new Promise((resolve) => window.setTimeout(resolve, 200));
      await navigate({ to: "/dashboard", replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className={`login-stage relative flex min-h-dvh items-center justify-center overflow-hidden bg-login px-4 py-5 transition-opacity duration-300 sm:px-6 ${isLeaving ? "opacity-0" : "opacity-100"}`}
    >
      <div className="login-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="login-glow login-glow-primary pointer-events-none absolute"
        aria-hidden="true"
      />
      <div
        className="login-glow login-glow-secondary pointer-events-none absolute"
        aria-hidden="true"
      />
      <section className="login-card relative z-10 w-full max-w-[29rem] overflow-hidden rounded-[1.75rem] border border-login-border bg-login-card p-6 shadow-login backdrop-blur-2xl sm:p-9">
        <div
          className="login-highlight pointer-events-none absolute inset-x-8 top-0 h-px"
          aria-hidden="true"
        />
        <header className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-login-border-strong bg-login-logo shadow-logo">
            <GraduationCap className="size-7 text-cyan-400" strokeWidth={1.8} />
          </div>
          <div className="mt-4">
            <p className="font-display text-xl font-semibold text-login-heading">
              {academyBranding}
            </p>
            <p className="mt-1 text-xs font-medium text-login-muted">
              Student &amp; Fee Management System
            </p>
          </div>
          <div className="mx-auto my-6 h-px w-14 bg-login-divider" />
          <h1 className="font-display text-2xl font-semibold text-login-heading sm:text-[1.75rem]">
            Admin Sign In
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-login-muted">
            Enter your credentials to manage academy students and tuition fee collections.
          </p>
        </header>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-medium text-login-label">
              Username
            </label>
            <div className="login-input-wrap flex h-11 items-center gap-3 rounded-xl border border-login-border bg-login-input px-3.5 transition duration-200 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20">
              <UserRound className="size-4 shrink-0 text-cyan-400" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter admin username"
                disabled={isSubmitting}
                className="min-w-0 flex-1 bg-transparent text-sm text-login-heading outline-none placeholder:text-login-placeholder disabled:cursor-wait"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-login-label">
              Password
            </label>
            <div className="login-input-wrap flex h-11 items-center gap-3 rounded-xl border border-login-border bg-login-input px-3.5 transition duration-200 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20">
              <LockKeyhole className="size-4 shrink-0 text-cyan-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                disabled={isSubmitting}
                className="min-w-0 flex-1 bg-transparent text-sm text-login-heading outline-none placeholder:text-login-placeholder disabled:cursor-wait"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="size-7 shrink-0 rounded-lg text-login-icon hover:bg-login-control hover:text-login-heading"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>
          <div aria-live="polite">
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-login-error-border bg-login-error px-3.5 py-2.5 text-xs text-login-error-foreground"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-cyan-600 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-cyan-500 active:translate-y-0 disabled:opacity-70"
          >
            <span className="relative flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </span>
          </Button>
        </form>
        <footer className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-login-muted">
          <ShieldCheck className="size-3.5 text-cyan-400" />
          Private Admin Access
        </footer>
      </section>
    </main>
  );
}
