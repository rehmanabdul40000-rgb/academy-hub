export type PaymentStatus = "Paid" | "Partial" | "Pending";
export type StudentGender = "Male" | "Female" | "Unspecified";
export type StudentShift = "Morning" | "Evening" | "Unspecified";

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
  id: string;
  name: string;
  gender: StudentGender;
  shift: StudentShift;
  shiftTime?: string;
  phone?: string;
  course?: string;
  dateJoined?: string;
  totalFees: number;
  amountPaid: number;
  remainingFees: number;
  status: PaymentStatus;
  notes?: string;
  savedAt?: string;
  dateAdded?: string;
  timeAdded?: string;
  createdAt: string;
  updatedAt: string;
  payments?: PaymentRecord[];
}

export type NewStudentInput = {
  id: string;
  name: string;
  gender?: StudentGender;
  shift?: StudentShift;
  shiftTime?: string;
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
