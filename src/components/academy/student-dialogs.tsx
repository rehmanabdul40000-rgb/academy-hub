import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileText,
  Phone,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/features/settings/settings.storage";
import {
  computeRemaining,
  computeStudentStatus,
  deleteStudent,
  formatCurrency,
  getStudentSavedAt,
  recordQuickPayment,
  updateStudent,
} from "@/features/students/students.storage";
import type { Student } from "@/types/student";

// Quick Payment Modal
export function QuickPaymentModal({
  student,
  open,
  onClose,
  onSuccess,
}: {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amountToAdd, setAmountToAdd] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (student) {
      setAmountToAdd("");
      setError("");
    }
  }, [student, open]);

  if (!open || !student) return null;

  const currentPaid = student.amountPaid;
  const currentTotal = student.totalFees;
  const currentRemaining = student.remainingFees;

  const numAdded = parseFloat(amountToAdd) || 0;
  const previewPaid = currentPaid + numAdded;
  const previewRemaining = computeRemaining(currentTotal, previewPaid);
  const previewStatus = computeStudentStatus(currentTotal, previewPaid);

  const settings = getSettings();
  const currencyLabel = settings.currencyLabel || "Rs";

  function handleQuickFill(amount: number) {
    setAmountToAdd(amount.toString());
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (numAdded <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }
    if (currentPaid + numAdded > currentTotal) {
      setError(
        `Payment amount cannot exceed the remaining balance of ${formatCurrency(currentRemaining)}.`,
      );
      return;
    }

    const res = recordQuickPayment(student!.id, numAdded);
    if (!res.success) {
      setError(res.error || "Failed to record payment.");
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <Banknote className="size-5" />
            </span>
            <div>
              <h3 className="font-display font-semibold text-foreground">Record Quick Payment</h3>
              <p className="text-xs text-muted-foreground">
                {student.name} ({student.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Fee Overview Pill */}
          <div className="rounded-lg border border-border/70 bg-muted/40 p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Fees:</span>
              <span className="font-semibold text-foreground">{formatCurrency(currentTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currently Paid:</span>
              <span className="font-semibold text-emerald-400">{formatCurrency(currentPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-border/50 pt-1.5 font-medium">
              <span className="text-muted-foreground">Remaining Balance:</span>
              <span className="font-bold text-amber-400">{formatCurrency(currentRemaining)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">
              Payment Amount ({currencyLabel}) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 5000"
              value={amountToAdd}
              onChange={(e) => {
                setAmountToAdd(e.target.value);
                setError("");
              }}
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              autoFocus
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {currentRemaining > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickFill(currentRemaining)}
                className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                Clear Full Balance ({formatCurrency(currentRemaining)})
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickFill(1000)}
              className="h-7 text-xs"
            >
              +Rs 1,000
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickFill(5000)}
              className="h-7 text-xs"
            >
              +Rs 5,000
            </Button>
          </div>

          {/* Live Preview */}
          {numAdded > 0 && (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs">
              <p className="font-semibold text-cyan-400">Transaction Preview:</p>
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>New Total Paid:</span>
                <span className="font-medium text-foreground">{formatCurrency(previewPaid)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>New Remaining:</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(previewRemaining)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>New Status:</span>
                <span
                  className={`font-semibold ${
                    previewStatus === "Paid"
                      ? "text-emerald-400"
                      : previewStatus === "Partial"
                        ? "text-blue-400"
                        : "text-amber-400"
                  }`}
                >
                  {previewStatus}
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-cyan-600 text-white hover:bg-cyan-500">
              Confirm Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Student Modal
export function EditStudentModal({
  student,
  open,
  onClose,
  onSuccess,
}: {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [totalFees, setTotalFees] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (student) {
      setName(student.name || "");
      setPhone(student.phone || "");
      setCourse(student.course || "");
      setDateJoined(student.dateJoined || "");
      setTotalFees(student.totalFees?.toString() || "0");
      setAmountPaid(student.amountPaid?.toString() || "0");
      setNotes(student.notes || "");
      setError("");
    }
  }, [student, open]);

  if (!open || !student) return null;

  const numTotal = parseFloat(totalFees) || 0;
  const numPaid = parseFloat(amountPaid) || 0;
  const remaining = computeRemaining(numTotal, numPaid);
  const status = computeStudentStatus(numTotal, numPaid);
  const settings = getSettings();
  const currencyLabel = settings.currencyLabel || "Rs";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Student Full Name is required.");
      return;
    }
    if (numTotal < 0) {
      setError("Total Fees cannot be negative.");
      return;
    }
    if (numPaid < 0) {
      setError("Amount Paid cannot be negative.");
      return;
    }
    if (numPaid > numTotal) {
      setError(
        `Amount Paid (${formatCurrency(numPaid)}) cannot be greater than Total Fees (${formatCurrency(numTotal)}).`,
      );
      return;
    }

    const res = updateStudent(student!.id, {
      name: name.trim(),
      phone: phone.trim() || undefined,
      course: course.trim() || undefined,
      dateJoined: dateJoined.trim() || undefined,
      totalFees: numTotal,
      amountPaid: numPaid,
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setError(res.error || "Failed to update student.");
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <Edit3 className="size-5" />
            </span>
            <div>
              <h3 className="font-display font-semibold text-foreground">Edit Student Record</h3>
              <p className="text-xs text-muted-foreground">ID: {student.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Student ID (Manual, Cannot be altered here)
            </label>
            <input
              type="text"
              value={student.id}
              disabled
              className="mt-1 h-10 w-full rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">Student Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">
                Phone / WhatsApp <span className="text-muted-foreground">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">
                Course / Class <span className="text-muted-foreground">(Optional)</span>
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. Mathematics"
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">
                Date Joined <span className="text-muted-foreground">(Optional)</span>
              </label>
              <input
                type="date"
                value={dateJoined}
                onClick={(e) => {
                  try {
                    (e.currentTarget as HTMLInputElement).showPicker?.();
                  } catch {
                    // fallback
                  }
                }}
                onFocus={(e) => {
                  try {
                    (e.currentTarget as HTMLInputElement).showPicker?.();
                  } catch {
                    // fallback
                  }
                }}
                onChange={(e) => setDateJoined(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">
                Total Fees ({currencyLabel}) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={totalFees}
                onChange={(e) => setTotalFees(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">
                Amount Paid ({currencyLabel})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Computed Status Preview */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs flex justify-between items-center">
            <div>
              <span className="text-muted-foreground">Remaining: </span>
              <span className="font-bold text-foreground">{formatCurrency(remaining)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Status: </span>
              <span
                className={`font-semibold ${
                  status === "Paid"
                    ? "text-emerald-400"
                    : status === "Partial"
                      ? "text-blue-400"
                      : "text-amber-400"
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">
              Notes &amp; Remarks <span className="text-muted-foreground">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fee terms, installment notes..."
              className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-cyan-600 text-white hover:bg-cyan-500">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Student Modal (Student Detail View)
export function ViewStudentModal({
  student,
  open,
  onClose,
  onEdit,
  onQuickPayment,
  onDelete,
}: {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onQuickPayment: (student: Student) => void;
  onDelete: (student: Student) => void;
}) {
  if (!open || !student) return null;

  const statusColor =
    student.status === "Paid"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : student.status === "Partial"
        ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
        : "bg-amber-500/15 text-amber-400 border-amber-500/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <User className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">{student.name}</h3>
              <p className="font-mono text-xs text-cyan-400">{student.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Payment Status</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
            >
              {student.status === "Paid" && <CheckCircle2 className="size-3.5" />}
              {student.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/80 bg-muted/20 p-3.5 text-xs">
            <div>
              <p className="text-muted-foreground">Course / Class</p>
              <p className="mt-0.5 font-medium text-foreground">
                {student.course || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone / WhatsApp</p>
              <p className="mt-0.5 font-medium text-foreground">
                {student.phone || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Date Joined</p>
              <p className="mt-0.5 font-medium text-foreground">
                {student.dateJoined || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Date Added</p>
              <p className="mt-0.5 font-medium text-foreground">
                {student.dateAdded || new Date(student.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
              <span>Saved At (System Timestamp):</span>
              <span className="font-mono font-medium text-cyan-300">
                {getStudentSavedAt(student)}
              </span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4 space-y-2">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Tuition Fee Breakdown
            </h4>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Fees Billed:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(student.totalFees)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Amount Paid:</span>
              <span className="font-semibold text-emerald-400">
                {formatCurrency(student.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-bold">
              <span className="text-foreground">Remaining Balance:</span>
              <span className={student.remainingFees > 0 ? "text-amber-400" : "text-emerald-400"}>
                {formatCurrency(student.remainingFees)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {student.notes && (
            <div className="rounded-lg border border-border bg-card p-3 text-xs">
              <p className="font-medium text-muted-foreground">Notes &amp; Remarks:</p>
              <p className="mt-1 text-foreground whitespace-pre-wrap">{student.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onClose();
                onDelete(student);
              }}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(student);
                }}
                className="gap-1.5 text-xs"
              >
                <Edit3 className="size-3.5" />
                Edit
              </Button>
              {student.remainingFees > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onQuickPayment(student);
                  }}
                  className="gap-1.5 text-xs bg-cyan-600 text-white hover:bg-cyan-500"
                >
                  <Banknote className="size-3.5" />
                  Quick Pay
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete Student Confirmation Dialog
export function DeleteStudentDialog({
  student,
  open,
  onClose,
  onSuccess,
}: {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  if (!open || !student) return null;

  function handleConfirm() {
    deleteStudent(student!.id);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-destructive/30 bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </span>
          <div>
            <h3 className="font-display font-semibold text-foreground">Confirm Student Deletion</h3>
            <p className="text-xs text-muted-foreground">{student.id}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-bold text-foreground">{student.name}</span>? This will permanently
          remove their enrollment and payment history.
        </p>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={handleConfirm}>
            Delete Student
          </Button>
        </div>
      </div>
    </div>
  );
}
