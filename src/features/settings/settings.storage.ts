export interface AcademySettings {
  academyName: string;
  adminDisplayName: string;
  adminUsername: string;
  adminPassword: string;
  currencyLabel: string;
  academicSession: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  updatedAt: string;
}

const SETTINGS_STORAGE_KEY = "academy_hub_workspace_settings_v1";

export const DEFAULT_SETTINGS: AcademySettings = {
  academyName: "Academy Hub",
  adminDisplayName: "Admin",
  adminUsername: "admin",
  adminPassword: import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD ?? "",
  currencyLabel: "Rs",
  academicSession: "2025-2026",
  contactEmail: "",
  contactPhone: "",
  address: "",
  updatedAt: new Date().toISOString(),
};

export function getSettings(): AcademySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (err) {
    console.error("Error reading settings:", err);
    return DEFAULT_SETTINGS;
  }
}

export function getInitials(name?: string): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function saveSettings(updates: Partial<AcademySettings>): AcademySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const current = getSettings();
    const updated: AcademySettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    // Keep active session username aligned with workspace settings
    const rawSession = localStorage.getItem("academy_hub_admin_session_v1");
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (session) {
          session.username = updated.adminUsername;
          session.displayName = updated.adminDisplayName;
          localStorage.setItem("academy_hub_admin_session_v1", JSON.stringify(session));
        }
      } catch {
        // Ignore session parse error
      }
    }

    // Also update document title if present
    if (typeof document !== "undefined" && updated.academyName) {
      document.title = `${updated.academyName} — Student & Fee Management`;
    }

    window.dispatchEvent(new CustomEvent("academy-settings-updated", { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Error saving settings:", err);
    return DEFAULT_SETTINGS;
  }
}

export function formatCurrencyWithLabel(amount: number, currencyLabel?: string): string {
  const label = currencyLabel || getSettings().currencyLabel || "Rs";
  return `${label} ${Math.round(amount || 0).toLocaleString()}`;
}
