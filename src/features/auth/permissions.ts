import { getStoredAdminSession } from "@/features/auth/auth.session";
import type { PermissionKey } from "@/features/users/users.storage";

export function isCurrentAdmin(): boolean {
  const session = getStoredAdminSession();
  return !!session && (session.id === "admin-workspace-session" || session.role?.toLowerCase() === "admin");
}

export function can(permission: PermissionKey): boolean {
  if (isCurrentAdmin()) return true;
  return Boolean(getStoredAdminSession()?.permissions?.[permission]);
}
