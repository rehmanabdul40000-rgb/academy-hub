import { formatCurrencyWithLabel, getSettings } from "@/features/settings/settings.storage";
import type { FeeMetrics, MonthlyFeeRecord, NewStudentInput, PaymentRecord, PaymentStatus, Student } from "@/types/student";

const STORAGE_KEY = "academy_hub_students_v4_fresh";
const LEGACY_STORAGE_KEYS = ["academy_hub_students_v3", "academy_hub_students_v2", "academy_hub_students_v1"];

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
  const end = new Date(start.getFullYear(), start.getMonth() + 11, 1);
  const records: MonthlyFeeRecord[] = [];
  while (cursor <= end && records.length < 36) {
    const key = monthKeyFromDate(cursor);
    const old = existing?.find((item) => item.monthKey === key);
    records.push(createMonthlyRecord(key, monthlyFee, old));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return records;
}

function normalizeStudent(raw: Student): Student {
  const legacy = raw as Student & { id?: string };
  const { id: _legacyId, ...cleanRaw } = legacy;
  const admissionFee = Math.max(0, Number(cleanRaw.admissionFee ?? 0));
  const monthlyFee = Math.max(0, Number(cleanRaw.monthlyFee ?? (cleanRaw.admissionFee === undefined ? cleanRaw.totalFees : 0)));
  const amountPaid = Math.max(0, Number(cleanRaw.amountPaid || 0));
  const totalFees = Number(cleanRaw.totalFees ?? (admissionFee + monthlyFee)) || 0;
  const monthlyFees = buildMonthlySchedule(monthlyFee, cleanRaw.dateJoined, cleanRaw.monthlyFees);
  return {
    ...cleanRaw,
    name: String(cleanRaw.name || "").trim(),
    fatherName: cleanRaw.fatherName?.trim() || undefined,
    phone: cleanRaw.phone?.trim() || undefined,
    phone2: cleanRaw.phone2?.trim() || undefined,
    bankName: cleanRaw.bankName?.trim() || undefined,
    bankAccountName: cleanRaw.bankAccountName?.trim() || undefined,
    bankAccountNumber: cleanRaw.bankAccountNumber?.trim() || undefined,
    admissionFee,
    admissionPaid: Math.min(admissionFee, Math.max(0, Number(cleanRaw.admissionPaid ?? Math.min(admissionFee, amountPaid)))),
    monthlyFee,
    totalFees,
    amountPaid,
    remainingFees: computeRemaining(totalFees, amountPaid),
    status: computeStudentStatus(totalFees, amountPaid),
    monthlyFees,
    payments: cleanRaw.payments?.map((payment) => { const { studentId: _legacyStudentId, ...cleanPayment } = payment as PaymentRecord & { studentId?: string }; return cleanPayment; }) || undefined,
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
    if (!raw) { LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key)); return []; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map((student) => normalizeStudent({
      ...student,
      gender: student.gender === "Male" || student.gender === "Female" ? student.gender : "Unspecified",
      shift: student.shift === "Morning" || student.shift === "Evening" ? student.shift : "Unspecified",
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
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
  const currentKey = monthKeyFromDate(new Date());
  return buildMonthlySchedule(student.monthlyFee, student.dateJoined, student.monthlyFees)
    .filter((item) => item.monthKey <= currentKey)
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export function getOutstandingMonthlyAmount(student: Student): number {
  return getMonthlyFeeHistory(student).reduce((sum, item) => sum + item.remainingAmount, 0);
}

export function getStudentById(recordKey: string): Student | undefined {
  return getStudents().find((s) => s.createdAt === recordKey);
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
  return { success: errors.length === 0, imported: students.length, skipped: inputs.length - students.length, errors, students };
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
    name,
    fatherName: input.fatherName?.trim() || undefined,
    gender: input.gender === "Male" || input.gender === "Female" ? input.gender : "Unspecified",
    shift: input.shift === "Morning" || input.shift === "Evening" ? input.shift : "Unspecified",
    shiftTime: input.shiftTime?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    phone2: input.phone2?.trim() || undefined,
    bankName: input.bankName?.trim() || undefined,
    bankAccountName: input.bankAccountName?.trim() || undefined,
    bankAccountNumber: input.bankAccountNumber?.trim() || undefined,
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

export function updateStudent(recordKey: string, updates: Partial<NewStudentInput>): { success: boolean; error?: string; student?: Student } {
  const all = getStudents();
  const index = all.findIndex((s) => s.createdAt === recordKey);
  if (index === -1) return { success: false, error: "Student not found." };
  const existing = all[index]!;
  const admissionFee = updates.admissionFee !== undefined ? Math.max(0, Number(updates.admissionFee)) : existing.admissionFee;
  const monthlyFee = updates.monthlyFee !== undefined ? Math.max(0, Number(updates.monthlyFee)) : existing.monthlyFee;
  const amountPaid = updates.amountPaid !== undefined ? Math.max(0, Number(updates.amountPaid)) : existing.amountPaid;
  const totalFees = updates.totalFees !== undefined ? Math.max(0, Number(updates.totalFees)) : (admissionFee + monthlyFee);
  if (amountPaid > totalFees) return { success: false, error: "Amount Paid cannot be greater than the initial billed total." };
  const updatedRecord: Student = normalizeStudent({
    ...existing,
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    fatherName: updates.fatherName !== undefined ? updates.fatherName.trim() || undefined : existing.fatherName,
    gender: updates.gender === "Male" || updates.gender === "Female" || updates.gender === "Unspecified" ? updates.gender : existing.gender,
    shift: updates.shift === "Morning" || updates.shift === "Evening" || updates.shift === "Unspecified" ? updates.shift : existing.shift,
    shiftTime: updates.shiftTime !== undefined ? updates.shiftTime.trim() || undefined : existing.shiftTime,
    phone: updates.phone !== undefined ? updates.phone.trim() || undefined : existing.phone,
    phone2: updates.phone2 !== undefined ? updates.phone2.trim() || undefined : existing.phone2,
    bankName: updates.bankName !== undefined ? updates.bankName.trim() || undefined : existing.bankName,
    bankAccountName: updates.bankAccountName !== undefined ? updates.bankAccountName.trim() || undefined : existing.bankAccountName,
    bankAccountNumber: updates.bankAccountNumber !== undefined ? updates.bankAccountNumber.trim() || undefined : existing.bankAccountNumber,
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
  const changedMonthKey = allocation.monthlyFees.find((item) => item.paidAmount > (student.monthlyFees?.find((old) => old.monthKey === item.monthKey)?.paidAmount || 0))?.monthKey;
  const feeType: PaymentRecord["feeType"] = allocation.admissionPaid > student.admissionPaid ? "Admission Fee" : "Monthly Fee";
  const existingPayments = [...(student.payments || [])];
  const existingReceiptIndex = existingPayments.findIndex((item) => item.feeType === feeType && item.monthKey === changedMonthKey);
  const existingReceipt = existingReceiptIndex >= 0 ? existingPayments[existingReceiptIndex] : undefined;
  const payment: PaymentRecord = {
    id: existingReceipt?.id || `PAY-${paymentNow.getTime()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    studentName: student.name,
    amount: (existingReceipt?.amount || 0) + numAdd,
    paymentDate: paymentNow.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    paymentTime: paymentNow.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    previousPaid: existingReceipt?.previousPaid ?? student.amountPaid,
    previousRemaining: existingReceipt?.previousRemaining ?? student.remainingFees,
    newPaid,
    newRemaining: computeRemaining(student.totalFees, Math.min(newPaid, student.totalFees)),
    recordedBy: getSettings().adminDisplayName || "Admin",
    feeType,
    monthKey: changedMonthKey,
  };
  if (existingReceiptIndex >= 0) existingPayments[existingReceiptIndex] = payment;
  else existingPayments.unshift(payment);
  const updated: Student = normalizeStudent({
    ...student,
    admissionPaid: allocation.admissionPaid,
    monthlyFees: allocation.monthlyFees,
    amountPaid: newPaid,
    remainingFees: computeRemaining(student.totalFees, Math.min(newPaid, student.totalFees)),
    status: computeStudentStatus(student.totalFees, Math.min(newPaid, student.totalFees)),
    updatedAt: paymentNow.toISOString(),
    payments: existingPayments,
  });
  const saved = getStudents();
  const index = saved.findIndex((item) => item.createdAt === student.createdAt);
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
