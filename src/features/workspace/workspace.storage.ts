export type WorkspaceSectionKey =
  | "dashboard"
  | "students"
  | "maleStudents"
  | "femaleStudents"
  | "morningShift"
  | "eveningShift"
  | "addStudent"
  | "shiftManagement"
  | "userManagement"
  | "changePassword"
  | "settings";

export interface WorkspaceSection {
  key: WorkspaceSectionKey;
  label: string;
  enabled: boolean;
}

const STORAGE_KEY = "academy_hub_workspace_sections_v1";
const THEME_KEY = "academy_hub_theme_v1";

export const DEFAULT_SECTIONS: WorkspaceSection[] = [
  { key: "dashboard", label: "Dashboard", enabled: true },
  { key: "students", label: "All Students", enabled: true },
  { key: "maleStudents", label: "Male Students", enabled: true },
  { key: "femaleStudents", label: "Female Students", enabled: true },
  { key: "morningShift", label: "Morning Shift", enabled: true },
  { key: "eveningShift", label: "Evening Shift", enabled: true },
  { key: "addStudent", label: "Add Student", enabled: true },
  { key: "shiftManagement", label: "Shift Management", enabled: true },
  { key: "userManagement", label: "Users & Permissions", enabled: true },
  { key: "changePassword", label: "Change Password", enabled: true },
  { key: "settings", label: "Settings", enabled: true },
];

export type WorkspaceTheme = "dark" | "light";

export function getWorkspaceSections(): WorkspaceSection[] {
  if (typeof window === "undefined") return DEFAULT_SECTIONS;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!Array.isArray(parsed)) return DEFAULT_SECTIONS;
    const enabled = new Map(parsed.map((item) => [item?.key, item?.enabled !== false]));
    return DEFAULT_SECTIONS.map((section) => ({ ...section, enabled: enabled.has(section.key) ? Boolean(enabled.get(section.key)) : section.enabled }));
  } catch {
    return DEFAULT_SECTIONS;
  }
}

export function isWorkspaceSectionEnabled(key: WorkspaceSectionKey): boolean {
  return getWorkspaceSections().find((section) => section.key === key)?.enabled ?? true;
}

export function saveWorkspaceSections(sections: WorkspaceSection[]): WorkspaceSection[] {
  const normalized = DEFAULT_SECTIONS.map((base) => ({
    ...base,
    enabled: sections.find((section) => section.key === base.key)?.enabled ?? base.enabled,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("academy-workspace-sections-updated", { detail: normalized }));
  return normalized;
}

export function getWorkspaceTheme(): WorkspaceTheme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function applyWorkspaceTheme(theme: WorkspaceTheme): void {
  if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", theme === "dark");
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_KEY, theme);
    window.dispatchEvent(new CustomEvent("academy-theme-updated", { detail: theme }));
  }
}
