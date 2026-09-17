export interface AcademyShift {
  id: string;
  name: string;
  fromTime: string;
  toTime: string;
  active: boolean;
  updatedAt: string;
}

const STORAGE_KEY = "academy_hub_shifts_v1";

const DEFAULT_SHIFTS: AcademyShift[] = [
  { id: "morning", name: "Morning Shift", fromTime: "08:00", toTime: "14:00", active: true, updatedAt: new Date().toISOString() },
  { id: "evening", name: "Evening Shift", fromTime: "", toTime: "", active: true, updatedAt: new Date().toISOString() },
];

export function getShifts(): AcademyShift[] {
  if (typeof window === "undefined") return DEFAULT_SHIFTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHIFTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SHIFTS;
    return parsed.filter((item) => item && typeof item.name === "string").map((item) => ({
      id: String(item.id || crypto.randomUUID()), name: String(item.name), fromTime: String(item.fromTime || ""), toTime: String(item.toTime || ""), active: item.active !== false, updatedAt: String(item.updatedAt || new Date().toISOString()),
    }));
  } catch { return DEFAULT_SHIFTS; }
}

export function saveShifts(shifts: AcademyShift[]): AcademyShift[] {
  const normalized = shifts.map((shift) => ({ ...shift, name: shift.name.trim(), fromTime: shift.fromTime.trim(), toTime: shift.toTime.trim(), updatedAt: new Date().toISOString() }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("academy-shifts-updated", { detail: normalized }));
  return normalized;
}

export function getShiftById(id: string): AcademyShift | undefined {
  return getShifts().find((shift) => shift.id === id && shift.active);
}

export function formatShiftTime(shift?: AcademyShift): string {
  if (!shift?.fromTime || !shift?.toTime) return "";
  const format = (value: string) => { const [h, m] = value.split(":").map(Number); const hour = h % 12 || 12; return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
  return `${format(shift.fromTime)} – ${format(shift.toTime)}`;
}
