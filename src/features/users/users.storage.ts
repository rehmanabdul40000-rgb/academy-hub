export const PERMISSION_KEYS = ["dashboard", "studentsView", "studentsSave", "studentsEdit", "studentsDelete", "payments", "reports", "shiftManagement", "userManagement", "settings"] as const;
export type PermissionKey = typeof PERMISSION_KEYS[number];
export type UserPermissions = Record<PermissionKey, boolean>;

export interface AcademyUser {
  id: string;
  userId: string;
  displayName: string;
  email?: string;
  password: string;
  role: "User" | "Manager";
  permissions: UserPermissions;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "academy_hub_users_v1";
export const DEFAULT_PERMISSIONS: UserPermissions = {
  dashboard: true, studentsView: true, studentsSave: false, studentsEdit: false, studentsDelete: false,
  payments: false, reports: false, shiftManagement: false, userManagement: false, settings: false,
};

export function getUsers(): AcademyUser[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
export function saveUsers(users: AcademyUser[]): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); window.dispatchEvent(new CustomEvent("academy-users-updated", { detail: users })); }
export function createUser(input: Omit<AcademyUser, "id" | "createdAt" | "updatedAt">): { success: boolean; error?: string; user?: AcademyUser } {
  const users = getUsers(); const normalized = input.userId.trim().toLowerCase();
  if (!normalized) return { success: false, error: "User ID is required." };
  if (!input.password) return { success: false, error: "Password is required." };
  if (users.some((u) => u.userId.toLowerCase() === normalized)) return { success: false, error: "This User ID is already in use." };
  const now = new Date().toISOString(); const user: AcademyUser = { ...input, id: crypto.randomUUID(), userId: input.userId.trim(), displayName: input.displayName.trim(), password: input.password, createdAt: now, updatedAt: now };
  saveUsers([user, ...users]); return { success: true, user };
}
export function updateUser(id: string, updates: Partial<AcademyUser>): boolean { const users = getUsers(); const index = users.findIndex((u) => u.id === id); if (index < 0) return false; users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() }; saveUsers(users); return true; }
export function deleteUser(id: string): boolean { const users = getUsers(); const next = users.filter((u) => u.id !== id); if (next.length === users.length) return false; saveUsers(next); return true; }
export function authenticateUser(userId: string, password: string): AcademyUser | undefined { const normalized = userId.trim().toLowerCase(); return getUsers().find((u) => u.active && u.userId.toLowerCase() === normalized && u.password === password); }
export function getUserById(id: string): AcademyUser | undefined { return getUsers().find((u) => u.id === id); }
export function hasPermission(user: AcademyUser | null | undefined, permission: PermissionKey): boolean { return !!user?.permissions?.[permission]; }
