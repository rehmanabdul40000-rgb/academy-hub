import { formatCurrencyWithLabel, getSettings } from "@/features/settings/settings.storage";
import type {
  FeeMetrics,
  NewStudentInput,
  PaymentRecord,
  PaymentStatus,
  Student,
} from "@/types/student";

const STORAGE_KEY = "academy_hub_students_v3";

export function computeRemaining(totalFees: number, amountPaid: number): number {
  const diff = Number(totalFees) - Number(amountPaid);
  return diff < 0 ? 0 : diff;
}

export function computeStudentStatus(totalFees: number, amountPaid: number): PaymentStatus {
  const t = Number(totalFees) || 0;
  const p = Number(amountPaid) || 0;
  if (p <= 0) return "Pending";
  if (p >= t) return "Paid";
  return "Partial";
}

export function getStudentSavedAt(student: Student): string {
  if (student.savedAt) return student.savedAt;
  if (student.dateAdded && student.timeAdded) {
    return `${student.dateAdded}, ${student.timeAdded}`;
  }
  if (student.createdAt) {
    try {
      const d = new Date(student.createdAt);
      if (!isNaN(d.getTime())) {
        const datePart = d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const timePart = d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return `${datePart}, ${timePart}`;
      }
    } catch {
      // ignore
    }
  }
  return student.dateAdded || student.createdAt?.split("T")[0] || "—";
}

export function getStudents(): Student[] {
  if (typeof window === "undefined") return [];
  try {
    // Clean up any legacy demo storage keys from previous tests
    if (localStorage.getItem("academy_hub_students_records_v2")) {
      localStorage.removeItem("academy_hub_students_records_v2");
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Error reading students from storage:", err);
    return [];
  }
}

export function saveStudentsList(students: Student[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    window.dispatchEvent(new CustomEvent("academy-students-updated", { detail: students }));
  } catch (err) {
    console.error("Error saving students to storage:", err);
  }
}

export function getPaymentHistory(student: Student): PaymentRecord[] {
  return [...(student.payments || [])].sort((left, right) => {
    const leftKey = `${left.paymentDate} ${left.paymentTime}`;
    const rightKey = `${right.paymentDate} ${right.paymentTime}`;
    return rightKey.localeCompare(leftKey);
  });
}

export function getStudentById(id: string): Student | undefined {
  const all = getStudents();
  return all.find((s) => s.id.trim().toLowerCase() === id.trim().toLowerCase());
}

export function addStudent(input: NewStudentInput): {
  success: boolean;
  error?: string;
  student?: Student;
} {
  const trimmedId = (input.id || "").trim();
  const trimmedName = (input.name || "").trim();
  const trimmedPhone = (input.phone || "").trim();

  if (!trimmedId) {
    return { success: false, error: "Student ID is required." };
  }
  if (!trimmedName) {
    return { success: false, error: "Student Full Name is required." };
  }
  if (
    input.totalFees === undefined ||
    isNaN(Number(input.totalFees)) ||
    Number(input.totalFees) < 0
  ) {
    return { success: false, error: "Total Fees must be a valid non-negative number." };
  }

  const all = getStudents();
  if (all.some((s) => s.id.trim().toLowerCase() === trimmedId.toLowerCase())) {
    return {
      success: false,
      error: `Student ID "${trimmedId}" is already in use. Please enter a unique ID.`,
    };
  }

  const totalFees = Number(input.totalFees);
  const amountPaid = Math.max(0, Number(input.amountPaid || 0));

  if (amountPaid > totalFees) {
    return {
      success: false,
      error: "Amount Paid cannot be greater than Total Fees.",
    };
  }

  const remainingFees = computeRemaining(totalFees, amountPaid);
  const status = computeStudentStatus(totalFees, amountPaid);
  const nowDate = new Date();
  const nowIso = nowDate.toISOString();
  const dateAddedFormatted = nowDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeAddedFormatted = nowDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const savedAtFormatted = `${dateAddedFormatted}, ${timeAddedFormatted}`;

  const newRecord: Student = {
    id: trimmedId,
    name: trimmedName,
    phone: trimmedPhone || undefined,
    course: (input.course || "").trim() || undefined,
    dateJoined: (input.dateJoined || "").trim() || undefined,
    totalFees,
    amountPaid,
    remainingFees,
    status,
    notes: (input.notes || "").trim() || undefined,
    savedAt: savedAtFormatted,
    dateAdded: dateAddedFormatted,
    timeAdded: timeAddedFormatted,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const updatedList = [newRecord, ...all];
  saveStudentsList(updatedList);
  return { success: true, student: newRecord };
}

export function updateStudent(
  id: string,
  updates: Partial<NewStudentInput>,
): {
  success: boolean;
  error?: string;
  student?: Student;
} {
  const all = getStudents();
  const index = all.findIndex((s) => s.id.trim().toLowerCase() === id.trim().toLowerCase());
  if (index === -1) {
    return { success: false, error: "Student not found." };
  }

  const existing = all[index]!;

  // If changing ID, verify uniqueness
  if (updates.id && updates.id.trim().toLowerCase() !== existing.id.trim().toLowerCase()) {
    const newId = updates.id.trim();
    if (all.some((s) => s.id.trim().toLowerCase() === newId.toLowerCase())) {
      return { success: false, error: `Student ID "${newId}" is already taken.` };
    }
  }

  const totalFees =
    updates.totalFees !== undefined && !isNaN(Number(updates.totalFees))
      ? Number(updates.totalFees)
      : existing.totalFees;

  const amountPaid =
    updates.amountPaid !== undefined && !isNaN(Number(updates.amountPaid))
      ? Math.max(0, Number(updates.amountPaid))
      : existing.amountPaid;

  if (amountPaid > totalFees) {
    return {
      success: false,
      error: "Amount Paid cannot be greater than Total Fees.",
    };
  }

  const remainingFees = computeRemaining(totalFees, amountPaid);
  const status = computeStudentStatus(totalFees, amountPaid);

  const updatedRecord: Student = {
    ...existing,
    id: (updates.id || "").trim() || existing.id,
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    phone: updates.phone !== undefined ? updates.phone.trim() || undefined : existing.phone,
    course: updates.course !== undefined ? updates.course.trim() || undefined : existing.course,
    dateJoined:
      updates.dateJoined !== undefined
        ? updates.dateJoined.trim() || undefined
        : existing.dateJoined,
    totalFees,
    amountPaid,
    remainingFees,
    status,
    notes: updates.notes !== undefined ? updates.notes.trim() || undefined : existing.notes,
    savedAt:
      existing.savedAt ||
      (existing.dateAdded && existing.timeAdded
        ? `${existing.dateAdded}, ${existing.timeAdded}`
        : undefined),
    dateAdded: existing.dateAdded,
    timeAdded: existing.timeAdded,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updatedRecord;
  saveStudentsList([...all]);
  return { success: true, student: updatedRecord };
}

export function deleteStudent(id: string): boolean {
  const all = getStudents();
  const filtered = all.filter((s) => s.id.trim().toLowerCase() !== id.trim().toLowerCase());
  if (filtered.length === all.length) return false;
  saveStudentsList(filtered);
  return true;
}

export function recordQuickPayment(
  id: string,
  additionalAmount: number,
): {
  success: boolean;
  error?: string;
  student?: Student;
  payment?: PaymentRecord;
} {
  const numAdd = Number(additionalAmount);
  if (isNaN(numAdd) || numAdd <= 0) {
    return { success: false, error: "Payment amount must be greater than zero." };
  }

  const student = getStudentById(id);
  if (!student) {
    return { success: false, error: "Student not found." };
  }

  const newPaid = student.amountPaid + numAdd;
  if (newPaid > student.totalFees) {
    return {
      success: false,
      error: `Payment amount (${formatCurrencyWithLabel(numAdd)}) exceeds remaining balance of ${formatCurrencyWithLabel(student.remainingFees)}.`,
    };
  }
  const previousRemaining = computeRemaining(student.totalFees, student.amountPaid);
  const paymentNow = new Date();
  const payment: PaymentRecord = {
    id: `PAY-${paymentNow.getTime()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    studentId: student.id,
    studentName: student.name,
    amount: numAdd,
    paymentDate: paymentNow.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    paymentTime: paymentNow.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    previousPaid: student.amountPaid,
    previousRemaining,
    newPaid,
    newRemaining: computeRemaining(student.totalFees, newPaid),
    recordedBy: getSettings().adminDisplayName || "Admin",
  };

  const updated = updateStudent(id, { amountPaid: newPaid });
  if (!updated.success || !updated.student) return updated;

  const all = getStudents();
  const updatedIndex = all.findIndex((item) => item.id === updated.student!.id);
  if (updatedIndex >= 0) {
    const updatedStudent = all[updatedIndex]!;
    updatedStudent.payments = [payment, ...(updatedStudent.payments || [])];
    saveStudentsList(all);
  }
  return {
    ...updated,
    student: { ...updated.student, payments: [payment, ...(updated.student.payments || [])] },
    payment,
  };
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
    const remaining = computeRemaining(total, paid);

    totalBilledFees += total;
    totalFeesCollected += paid;
    totalOutstandingFees += remaining;

    const status = computeStudentStatus(total, paid);
    if (status === "Paid") {
      paidStudents += 1;
    } else if (status === "Partial") {
      partialStudents += 1;
    } else {
      pendingStudents += 1;
    }
  }

  return {
    totalStudents: students.length,
    paidStudents,
    partialStudents,
    pendingStudents,
    totalFeesCollected,
    totalOutstandingFees,
    totalBilledFees,
  };
}

export function formatCurrency(amount: number): string {
  return formatCurrencyWithLabel(amount);
}
