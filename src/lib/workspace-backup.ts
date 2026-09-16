import { getSettings, type AcademySettings } from "@/features/settings/settings.storage";
import { getStudents, saveStudentsList } from "@/features/students/students.storage";
import {
  getDeletedStudents,
  saveDeletedStudents,
  type DeletedStudentRecord,
} from "@/features/students/recovery.storage";
import type { Student } from "@/types/student";

export interface WorkspaceBackup {
  version: 1;
  exportedAt: string;
  settings: AcademySettings;
  students: Student[];
  deletedStudents: DeletedStudentRecord[];
}

export function createWorkspaceBackup(): WorkspaceBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    students: getStudents(),
    deletedStudents: getDeletedStudents(true),
  };
}

export function downloadWorkspaceBackup(): void {
  if (typeof window === "undefined") return;
  const backup = createWorkspaceBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `academy-hub-backup-${date}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function parseWorkspaceBackup(raw: string): WorkspaceBackup {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("Backup must be a JSON object.");
  const candidate = parsed as Partial<WorkspaceBackup>;
  if (
    candidate.version !== 1 ||
    !candidate.settings ||
    !Array.isArray(candidate.students) ||
    (candidate.deletedStudents !== undefined && !Array.isArray(candidate.deletedStudents))
  ) {
    throw new Error("This file is not a valid Academy Hub backup.");
  }
  if (
    candidate.students.some((student) => !student || typeof student !== "object" || !student.id)
  ) {
    throw new Error("The backup contains an invalid student record.");
  }
  return candidate as WorkspaceBackup;
}

export function restoreWorkspaceBackup(backup: WorkspaceBackup): void {
  saveStudentsList(backup.students);
  saveDeletedStudents(backup.deletedStudents || []);
  window.localStorage.setItem("academy_hub_workspace_settings_v1", JSON.stringify(backup.settings));
  window.dispatchEvent(new CustomEvent("academy-settings-updated", { detail: backup.settings }));
}
