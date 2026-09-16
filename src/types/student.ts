export type PaymentStatus = "Paid" | "Partial" | "Pending";

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  paymentTime: string;
  previousPaid: number;
  previousRemaining: number;
  newPaid: number;
  newRemaining: number;
  recordedBy: string;
  note?: string;
}

export interface Student {
  id: string; // Manually entered Student ID (Required, unique)
  name: string; // Student Full Name (Required)
  phone?: string; // Phone / WhatsApp (Optional)
  course?: string; // Course / Class (Optional)
  dateJoined?: string; // Date Joined (Optional, YYYY-MM-DD)
  totalFees: number; // Total Fees (Required)
  amountPaid: number; // Amount Paid at Enrollment (Default 0, optional)
  remainingFees: number; // Calculated: max(0, totalFees - amountPaid)
  status: PaymentStatus; // Paid | Partial | Pending
  notes?: string; // Notes & Remarks (Optional)
  savedAt?: string; // Exact saved timestamp e.g. "16 Sep 2026, 03:14 PM"
  dateAdded?: string; // e.g. "16 Sep 2026"
  timeAdded?: string; // e.g. "03:25 PM"
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  payments?: PaymentRecord[];
}

export type NewStudentInput = {
  id: string;
  name: string;
  phone?: string;
  course?: string;
  dateJoined?: string;
  totalFees: number;
  amountPaid?: number;
  notes?: string;
  dateAdded?: string;
  timeAdded?: string;
};

export interface FeeMetrics {
  totalStudents: number;
  paidStudents: number;
  partialStudents: number;
  pendingStudents: number;
  totalFeesCollected: number;
  totalOutstandingFees: number;
  totalBilledFees: number;
}
