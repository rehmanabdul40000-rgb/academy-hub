import { getStudents, saveStudentsList } from "@/features/students/students.storage";
import type { Student } from "@/types/student";

const RECOVERY_STORAGE_KEY = "academy_hub_deleted_students_v1";

export interface DeletedStudentRecord {
  recoveryId: string;
  student: Student;
  deletedAt: string;
  deletedDate: string;
  deletedTime: string;
  status: "pending" | "deleted";
}

function readRecoveryRecords(): DeletedStudentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECOVERY_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? (parsed as DeletedStudentRecord[]) : [];
  } catch {
    return [];
  }
}

function saveRecoveryRecords(records: DeletedStudentRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent("academy-recovery-updated", { detail: records }));
}

function makeRecoveryRecord(student: Student): DeletedStudentRecord {
  const now = new Date();
  return {
    recoveryId: `DEL-${now.getTime()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    student: structuredClone(student),
    deletedAt: now.toISOString(),
    deletedDate: now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    deletedTime: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    status: "pending",
  };
}

export function getDeletedStudents(includePending = false): DeletedStudentRecord[] {
  return readRecoveryRecords()
    .filter((record) => includePending || record.status === "deleted")
    .sort((left, right) => right.deletedAt.localeCompare(left.deletedAt));
}

export function beginStudentDeletionSnapshot(student: Student): string {
  const record = makeRecoveryRecord(student);
  saveRecoveryRecords([...readRecoveryRecords(), record]);
  return record.recoveryId;
}

export function cancelStudentDeletionSnapshot(recoveryId: string): void {
  saveRecoveryRecords(readRecoveryRecords().filter((record) => record.recoveryId !== recoveryId));
}

export function confirmStudentDeletion(recoveryId: string): { success: boolean; error?: string } {
  const records = readRecoveryRecords();
  const index = records.findIndex((record) => record.recoveryId === recoveryId);
  if (index < 0) return { success: false, error: "Recovery snapshot not found." };

  const snapshot = records[index]!;
  const students = getStudents();
  const remaining = students.filter((student) => student.id !== snapshot.student.id);
  if (remaining.length === students.length) return { success: false, error: "Student not found." };

  records[index] = { ...snapshot, status: "deleted" };
  saveRecoveryRecords(records);
  saveStudentsList(remaining);
  return { success: true };
}

export function restoreDeletedStudent(recoveryId: string): {
  success: boolean;
  error?: string;
  student?: Student;
} {
  const records = readRecoveryRecords();
  const index = records.findIndex(
    (record) => record.recoveryId === recoveryId && record.status === "deleted",
  );
  if (index < 0) return { success: false, error: "Deleted student recovery record not found." };

  const record = records[index]!;
  const students = getStudents();
  if (
    students.some(
      (student) => student.id.trim().toLowerCase() === record.student.id.trim().toLowerCase(),
    )
  ) {
    return { success: false, error: "A student with this Student ID already exists." };
  }

  saveStudentsList([record.student, ...students]);
  saveRecoveryRecords(records.filter((_, recordIndex) => recordIndex !== index));
  return { success: true, student: record.student };
}

export function removeDeletedStudentPermanently(recoveryId: string): boolean {
  const records = readRecoveryRecords();
  const next = records.filter((record) => record.recoveryId !== recoveryId);
  if (next.length === records.length) return false;
  saveRecoveryRecords(next);
  return true;
}

export function saveDeletedStudents(records: DeletedStudentRecord[]): void {
  saveRecoveryRecords(records);
}
