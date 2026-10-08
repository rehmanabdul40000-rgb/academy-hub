import { formatCurrencyWithLabel, getSettings } from "@/features/settings/settings.storage";
import type { FeeMetrics, MonthlyFeeRecord, NewStudentInput, PaymentRecord, PaymentStatus, Student } from "@/types/student";

const STORAGE_KEY = "academy_hub_students_v3";

export function computeRemaining(totalFees: number, amountPaid: number): number {
  return Math.max(0, Number(totalFees || 0) - Number(amountPaid || 0));
}

export function computeStudentStatus(totalFees: number, amountPaid: number): PaymentStatus {
  const t = Number(totalFees) || 0;
  const p = Number(amountPaid) || 0;
  if (p <= 0) return "Pending";
  if (p >= t) return "Paid";
  return "Partial";
}

function makeInternalId(): string {
  const uuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `ah-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `AH-${uuid}`;
}

function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function addMonths(key: string, count: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1 + count, 1);
  return monthKeyFromDate(date);
}

function createMonthlyRecord(monthKey: string, amount: number, existing?: Partial<MonthlyFeeRecord>): MonthlyFeeRecord {
  const dueAmount = Math.max(0, Number(amount || 0));
  const paidAmount = Math.min(dueAmount, Math.max(0, Number(existing?.paidAmount || 0)));
  return {
    id: existing?.id || `MF-${monthKey}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    monthKey,
    monthLabel: monthLabelFromKey(monthKey),
    dueAmount,
    paidAmount,
    remainingAmount: Math.max(0, dueAmount - paidAmount),
    status: computeStudentStatus(dueAmount, paidAmount),
    paidAt: existing?.paidAt,
  };
}

function buildMonthlySchedule(monthlyFee: number, dateJoined?: string, existing?: MonthlyFeeRecord[]): MonthlyFeeRecord[] {
  const now = new Date();
  const joined = dateJoined ? new Date(dateJoined) : now;
  const start = Number.isNaN(joined.getTime()) ? now : joined;
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const records: MonthlyFeeRecord[] = [];
  while (cursor <= end && records.length < 36) {
    const key = monthKeyFromDate(cursor);
    const old = existing?.find((item) => item.monthKey === key);
    records.push(createMonthlyRecord(key, monthlyFee, old));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  const nextKey = monthKeyFromDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  if (!records.some((item) => item.monthKey === nextKey)) {
    const old = existing?.find((item) => item.monthKey === nextKey);
    records.push(createMonthlyRecord(nextKey, monthlyFee, old));
  }
  return records;
}

function normalizeStudent(raw: Student): Student {
  const admissionFee = Math.max(0, Number(raw.admissionFee ?? 0));
  const monthlyFee = Math.max(0, Number(raw.monthlyFee ?? (raw.admissionFee === undefined ? raw.totalFees : 0)));
  const amountPaid = Math.max(0, Number(raw.amountPaid || 0));
  const totalFees = Number(raw.totalFees ?? (admissionFee + monthlyFee)) || 0;
  const monthlyFees = buildMonthlySchedule(monthlyFee, raw.dateJoined, raw.monthlyFees);
  return {
    ...raw,
    id: String(raw.id || makeInternalId()),
    name: String(raw.name || "").trim(),
    fatherName: raw.fatherName?.trim() || undefined,
    phone: raw.phone?.trim() || undefined,
    phone2: raw.phone2?.trim() || undefined,
    admissionFee,
    admissionPaid: Math.min(admissionFee, Math.max(0, Number(raw.admissionPaid ?? Math.min(admissionFee, amountPaid)))),
    monthlyFee,
    totalFees,
    amountPaid,
    remainingFees: computeRemaining(totalFees, amountPaid),
    status: computeStudentStatus(totalFees, amountPaid),
    monthlyFees,
    payments: raw.payments || undefined,
  };
}

export function getStudentSavedAt(student: Student): string {
  if (student.savedAt) return student.savedAt;
  if (student.dateAdded && student.timeAdded) return `${student.dateAdded}, ${student.timeAdded}`;
  if (student.createdAt) {
    try {
      const d = new Date(student.createdAt);
      if (!Number.isNaN(d.getTime())) {
        return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
      }
    } catch {}
  }
  return student.dateAdded || student.createdAt?.split("T")[0] || "—";
}

export function getStudents(): Student[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((student) => normalizeStudent({
      ...student,
      gender: student.gender === "Male" || student.gender === "Female" ? student.gender : "Unspecified",
      shift: student.shift === "Morning" || student.shift === "Evening" ? student.shift : "Unspecified",
    }));
  } catch (err) {
    console.error("Error reading students from storage:", err);
    return [];
  }
}

export function saveStudentsList(students: Student[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students.map(normalizeStudent)));
    window.dispatchEvent(new CustomEvent("academy-students-updated", { detail: students }));
  } catch (err) {
    console.error("Error saving students to storage:", err);
  }
}

export function getPaymentHistory(student: Student): PaymentRecord[] {
  return [...(student.payments || [])].sort((a, b) => `${b.paymentDate} ${b.paymentTime}`.localeCompare(`${a.paymentDate} ${a.paymentTime}`));
}

export function getMonthlyFeeHistory(student: Student): MonthlyFeeRecord[] {
  return buildMonthlySchedule(student.monthlyFee, student.dateJoined, student.monthlyFees).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export function getOutstandingMonthlyAmount(student: Student): number {
  return getMonthlyFeeHistory(student).reduce((sum, item) => sum + item.remainingAmount, 0);
}

export function getStudentById(id: string): Student | undefined {
  return getStudents().find((s) => s.id.trim().toLowerCase() === id.trim().toLowerCase());
}

function allocatePayment(student: Student, amount: number): { admissionPaid: number; monthlyFees: MonthlyFeeRecord[] } {
  let left = amount;
  const admissionPaid = Math.min(student.admissionFee, Math.max(0, student.admissionPaid)) + 0;
  let nextAdmissionPaid = admissionPaid;
  if (student.admissionFee > nextAdmissionPaid) {
    const add = Math.min(left, student.admissionFee - nextAdmissionPaid);
    nextAdmissionPaid += add;
    left -= add;
  }
  const monthlyFees = getMonthlyFeeHistory(student).map((item) => ({ ...item }));
  for (const fee of [...monthlyFees].sort((a, b) => a.monthKey.localeCompare(b.monthKey))) {
    if (left <= 0) break;
    const add = Math.min(left, fee.remainingAmount);
    fee.paidAmount += add;
    fee.remainingAmount = Math.max(0, fee.dueAmount - fee.paidAmount);
    fee.status = computeStudentStatus(fee.dueAmount, fee.paidAmount);
    if (fee.remainingAmount === 0) fee.paidAt = new Date().toISOString();
    left -= add;
  }
  if (left > 0) throw new Error("Payment exceeds the currently scheduled outstanding fees.");
  return { admissionPaid: nextAdmissionPaid, monthlyFees };
}

export function bulkAddStudents(inputs: NewStudentInput[]): { success: boolean; imported: number; skipped: number; errors: string[]; students: Student[] } {
  const all = getStudents();
  const students: Student[] = [];
  const errors: string[] = [];
  for (let index = 0; index < inputs.length; index += 1) {
    const input = inputs[index]!;
    const rowNumber = index + 2;
    const result = addStudent(input);
    if (!result.success || !result.student) {
      errors.push(`Row ${rowNumber}: ${result.error || "Unable to add student."}`);
    } else {
      students.push(result.student);
    }
  }
  return { success: errors.length === 0, imported: students.length, skipped: inputs.length - students.length, errors, students: students.length ? getStudents().filter((s) => !all.some((old) => old.id === s.id)) : [] };
}

export function addStudent(input: NewStudentInput): { success: boolean; error?: string; student?: Student } {
  const name = (input.name || "").trim();
  if (!name) return { success: false, error: "Student Full Name is required." };
  const admissionFee = Math.max(0, Number(input.admissionFee || 0));
  const monthlyFee = Math.max(0, Number(input.monthlyFee ?? 0));
  const totalFees = Number(input.totalFees ?? (admissionFee + monthlyFee));
  const amountPaid = Math.max(0, Number(input.amountPaid || 0));
  if (!Number.isFinite(totalFees) || totalFees < 0) return { success: false, error: "Total Fees must be a valid non-negative number." };
  if (amountPaid > admissionFee + monthlyFee) return { success: false, error: "Amount Paid cannot be greater than Admission Fee + first Monthly Fee." };
  const all = getStudents();
  const id = (input.id || "").trim() || makeInternalId();
  if (all.some((s) => s.id.toLowerCase() === id.toLowerCase())) return { success: false, error: "A student with this internal record already exists." };
  const nowDate = new Date();
  const nowIso = nowDate.toISOString();
  const dateAddedFormatted = nowDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timeAddedFormatted = nowDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const savedAtFormatted = `${dateAddedFormatted}, ${timeAddedFormatted}`;
  let monthlyFees = buildMonthlySchedule(monthlyFee, input.dateJoined);
  let admissionPaid = 0;
  let left = amountPaid;
  admissionPaid = Math.min(admissionFee, left);
  left -= admissionPaid;
  monthlyFees = monthlyFees.map((fee) => {
    if (left <= 0) return fee;
    const add = Math.min(left, fee.remainingAmount);
    left -= add;
    return { ...fee, paidAmount: add, remainingAmount: fee.dueAmount - add, status: computeStudentStatus(fee.dueAmount, add), paidAt: add >= fee.dueAmount ? nowIso : undefined };
  });
  const enrollmentPayment: PaymentRecord | undefined = amountPaid > 0 ? {
    id: `PAY-ENROLL-${nowDate.getTime()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    studentId: id,
    studentName: name,
    amount: amountPaid,
    paymentDate: dateAddedFormatted,
    paymentTime: timeAddedFormatted,
    previousPaid: 0,
    previousRemaining: admissionFee + monthlyFee,
    newPaid: amountPaid,
    newRemaining: computeRemaining(admissionFee + monthlyFee, amountPaid),
    recordedBy: getSettings().adminDisplayName || "Admin",
    note: "Enrollment payment",
    feeType: admissionFee > 0 && admissionPaid > 0 ? "Admission Fee" : "Monthly Fee",
    monthKey: monthlyFees[0]?.monthKey,
  } : undefined;
  const newRecord: Student = normalizeStudent({
    id,
    name,
    fatherName: input.fatherName?.trim() || undefined,
    gender: input.gender === "Male" || input.gender === "Female" ? input.gender : "Unspecified",
    shift: input.shift === "Morning" || input.shift === "Evening" ? input.shift : "Unspecified",
    shiftTime: input.shiftTime?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    phone2: input.phone2?.trim() || undefined,
    course: input.course?.trim() || undefined,
    dateJoined: input.dateJoined?.trim() || undefined,
    admissionFee,
    admissionPaid,
    monthlyFee,
    totalFees: admissionFee + monthlyFee,
    amountPaid,
    remainingFees: computeRemaining(admissionFee + monthlyFee, amountPaid),
    status: computeStudentStatus(admissionFee + monthlyFee, amountPaid),
    notes: input.notes?.trim() || undefined,
    savedAt: savedAtFormatted,
    dateAdded: dateAddedFormatted,
    timeAdded: timeAddedFormatted,
    createdAt: nowIso,
    updatedAt: nowIso,
    monthlyFees,
    payments: enrollmentPayment ? [enrollmentPayment] : undefined,
  });
  saveStudentsList([newRecord, ...all]);
  return { success: true, student: newRecord };
}

export function updateStudent(id: string, updates: Partial<NewStudentInput>): { success: boolean; error?: string; student?: Student } {
  const all = getStudents();
  const index = all.findIndex((s) => s.id.trim().toLowerCase() === id.trim().toLowerCase());
  if (index === -1) return { success: false, error: "Student not found." };
  const existing = all[index]!;
  const admissionFee = updates.admissionFee !== undefined ? Math.max(0, Number(updates.admissionFee)) : existing.admissionFee;
  const monthlyFee = updates.monthlyFee !== undefined ? Math.max(0, Number(updates.monthlyFee)) : existing.monthlyFee;
  const amountPaid = updates.amountPaid !== undefined ? Math.max(0, Number(updates.amountPaid)) : existing.amountPaid;
  const totalFees = updates.totalFees !== undefined ? Math.max(0, Number(updates.totalFees)) : (admissionFee + monthlyFee);
  if (amountPaid > totalFees) return { success: false, error: "Amount Paid cannot be greater than the initial billed total." };
  const updatedRecord: Student = normalizeStudent({
    ...existing,
    id: existing.id,
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    fatherName: updates.fatherName !== undefined ? updates.fatherName.trim() || undefined : existing.fatherName,
    gender: updates.gender === "Male" || updates.gender === "Female" || updates.gender === "Unspecified" ? updates.gender : existing.gender,
    shift: updates.shift === "Morning" || updates.shift === "Evening" || updates.shift === "Unspecified" ? updates.shift : existing.shift,
    shiftTime: updates.shiftTime !== undefined ? updates.shiftTime.trim() || undefined : existing.shiftTime,
    phone: updates.phone !== undefined ? updates.phone.trim() || undefined : existing.phone,
    phone2: updates.phone2 !== undefined ? updates.phone2.trim() || undefined : existing.phone2,
    course: updates.course !== undefined ? updates.course.trim() || undefined : existing.course,
    dateJoined: updates.dateJoined !== undefined ? updates.dateJoined.trim() || undefined : existing.dateJoined,
    admissionFee,
    admissionPaid: Math.min(admissionFee, existing.admissionPaid || 0),
    monthlyFee,
    totalFees,
    amountPaid,
    remainingFees: computeRemaining(totalFees, amountPaid),
    status: computeStudentStatus(totalFees, amountPaid),
    notes: updates.notes !== undefined ? updates.notes.trim() || undefined : existing.notes,
    updatedAt: new Date().toISOString(),
    monthlyFees: buildMonthlySchedule(monthlyFee, updates.dateJoined !== undefined ? updates.dateJoined : existing.dateJoined, existing.monthlyFees),
  });
  all[index] = updatedRecord;
  saveStudentsList(all);
  return { success: true, student: updatedRecord };
}

export function recordQuickPayment(id: string, additionalAmount: number): { success: boolean; error?: string; student?: Student; payment?: PaymentRecord } {
  const numAdd = Number(additionalAmount);
  if (!Number.isFinite(numAdd) || numAdd <= 0) return { success: false, error: "Payment amount must be greater than zero." };
  const student = getStudentById(id);
  if (!student) return { success: false, error: "Student not found." };
  const scheduledOutstanding = student.admissionFee - student.admissionPaid + getOutstandingMonthlyAmount(student);
  if (numAdd > scheduledOutstanding) return { success: false, error: `Payment exceeds scheduled outstanding balance of ${formatCurrencyWithLabel(scheduledOutstanding)}.` };
  const paymentNow = new Date();
  const allocation = allocatePayment(student, numAdd);
  const newPaid = student.amountPaid + numAdd;
  const payment: PaymentRecord = {
    id: `PAY-${paymentNow.getTime()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    studentId: student.id,
    studentName: student.name,
    amount: numAdd,
    paymentDate: paymentNow.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    paymentTime: paymentNow.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    previousPaid: student.amountPaid,
    previousRemaining: student.remainingFees,
    newPaid,
    newRemaining: computeRemaining(student.totalFees, Math.min(newPaid, student.totalFees)),
    recordedBy: getSettings().adminDisplayName || "Admin",
    feeType: allocation.admissionPaid > student.admissionPaid ? "Admission Fee" : "Monthly Fee",
    monthKey: allocation.monthlyFees.find((item) => item.paidAmount > (student.monthlyFees?.find((old) => old.monthKey === item.monthKey)?.paidAmount || 0))?.monthKey,
  };
  const updated: Student = normalizeStudent({
    ...student,
    admissionPaid: allocation.admissionPaid,
    monthlyFees: allocation.monthlyFees,
    amountPaid: newPaid,
    remainingFees: computeRemaining(student.totalFees, Math.min(newPaid, student.totalFees)),
    status: computeStudentStatus(student.totalFees, Math.min(newPaid, student.totalFees)),
    updatedAt: paymentNow.toISOString(),
    payments: [payment, ...(student.payments || [])],
  });
  const saved = getStudents();
  const index = saved.findIndex((item) => item.id === student.id);
  if (index < 0) return { success: false, error: "Student not found." };
  saved[index] = updated;
  saveStudentsList(saved);
  return { success: true, student: updated, payment };
}

export function calculateMetrics(students: Student[]): FeeMetrics {
  let paidStudents = 0;
  let partialStudents = 0;
  let pendingStudents = 0;
  let totalFeesCollected = 0;
  let totalOutstandingFees = 0;
  let totalBilledFees = 0;
  for (const s of students) {
    const total = Number(s.totalFees) || 0;
    const paid = Number(s.amountPaid) || 0;
    totalBilledFees += total;
    totalFeesCollected += Math.min(paid, total);
    totalOutstandingFees += computeRemaining(total, Math.min(paid, total));
    const status = computeStudentStatus(total, Math.min(paid, total));
    if (status === "Paid") paidStudents++;
    else if (status === "Partial") partialStudents++;
    else pendingStudents++;
  }
  return { totalStudents: students.length, paidStudents, partialStudents, pendingStudents, totalFeesCollected, totalOutstandingFees, totalBilledFees };
}

export function formatCurrency(amount: number): string {
  return formatCurrencyWithLabel(amount);
}
