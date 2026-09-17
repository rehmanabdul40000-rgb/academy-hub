export interface AdminSession {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName?: string;
  permissions?: Record<string, boolean>;
  signedInAt: string;
}

const SESSION_KEY = "academy_hub_admin_session_v1";

export function getStoredAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch { return null; }
}

export function saveAdminSession(session: AdminSession): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (err) { console.error("Failed to save admin session:", err); }
}
export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(SESSION_KEY); } catch (err) { console.error("Failed to clear admin session:", err); }
}
export function hasStoredAdminSession(): boolean { return getStoredAdminSession() !== null; }
