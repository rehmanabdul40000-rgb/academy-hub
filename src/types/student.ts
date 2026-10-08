export type PaymentStatus = "Paid" | "Partial" | "Pending";
export type StudentGender = "Male" | "Female" | "Unspecified";
export type StudentShift = "Morning" | "Evening" | "Unspecified";

export interface MonthlyFeeRecord {
  id: string;
  monthKey: string;
  monthLabel: string;
  dueAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  paidAt?: string;
}

export interface PaymentRecord {
  id: string;
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
  feeType?: "Admission Fee" | "Monthly Fee";
  monthKey?: string;
}

export interface Student {
  name: string;
  fatherName?: string;
  gender: StudentGender;
  shift: StudentShift;
  shiftTime?: string;
  phone?: string;
  phone2?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  course?: string;
  dateJoined?: string;
  admissionFee: number;
  admissionPaid: number;
  monthlyFee: number;
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
  monthlyFees?: MonthlyFeeRecord[];
  payments?: PaymentRecord[];
}

export type NewStudentInput = {
  name: string;
  fatherName?: string;
  gender?: StudentGender;
  shift?: StudentShift;
  shiftTime?: string;
  phone?: string;
  phone2?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  course?: string;
  dateJoined?: string;
  admissionFee?: number;
  amountPaid?: number;
  monthlyFee?: number;
  totalFees?: number;
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
