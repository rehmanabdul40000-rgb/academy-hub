import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, PlusCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/academy/app-shell";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/features/settings/settings.storage";
import {
  addStudent,
  computeRemaining,
  computeStudentStatus,
  formatCurrency,
} from "@/features/students/students.storage";

export const Route = createFileRoute("/_authenticated/add-student")({
  head: () => ({
    meta: [
      { title: "Add Student — Academy Hub" },
      { name: "description", content: "Enroll a new student in Academy Hub." },
      { property: "og:title", content: "Add Student — Academy Hub" },
      { property: "og:description", content: "Enroll a new student in Academy Hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddStudentPage,
});

function AddStudentPage() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(getSettings);
  const currencyLabel = settings.currencyLabel || "Rs";

  useEffect(() => {
    function handleSettingsUpdate() {
      setSettings(getSettings());
    }
    window.addEventListener("academy-settings-updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("academy-settings-updated", handleSettingsUpdate);
    };
  }, []);

  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"" | "Male" | "Female">("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [totalFees, setTotalFees] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<string>("0");
  const [notes, setNotes] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numTotal = parseFloat(totalFees) || 0;
  const numPaid = parseFloat(amountPaid) || 0;
  const isOverpaid = numPaid > numTotal;
  const remaining = computeRemaining(numTotal, numPaid);
  const autoStatus = computeStudentStatus(numTotal, numPaid);

  function resetForm() {
    setStudentId("");
    setName("");
    setGender("");
    setPhone("");
    setCourse("");
    setDateJoined("");
    setTotalFees("");
    setAmountPaid("0");
    setNotes("");
    setErrorMessage("");
  }

  function handleSave(addAnother = false) {
    setErrorMessage("");
    setSuccessMessage("");

    if (!studentId.trim()) {
      setErrorMessage("Student ID is required. Please choose and enter a unique Student ID.");
      return;
    }
    if (!name.trim()) {
      setErrorMessage("Student Full Name is required.");
      return;
    }
    if (!gender) { setErrorMessage("Please select Student Gender."); return; }
    if (totalFees.trim() === "" || isNaN(numTotal) || numTotal < 0) {
      setErrorMessage("Please enter a valid non-negative Total Fees amount.");
      return;
    }
    if (numPaid < 0) {
      setErrorMessage("Amount Paid cannot be negative.");
      return;
    }
    if (numPaid > numTotal) {
      setErrorMessage(
        `Amount Paid (${formatCurrency(numPaid)}) cannot be greater than Total Fees (${formatCurrency(numTotal)}).`,
      );
      return;
    }

    setIsSubmitting(true);
    const result = addStudent({
      id: studentId.trim(),
      name: name.trim(),
      gender,
      phone: phone.trim() || undefined,
      course: course.trim() || undefined,
      dateJoined: dateJoined.trim() || undefined,
      totalFees: numTotal,
      amountPaid: numPaid,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || "Failed to register student.");
      return;
    }

    if (addAnother) {
      setSuccessMessage(`Student ${name.trim()} (${studentId.trim()}) successfully saved!`);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate({ to: "/students" });
    }
  }

  return (
    <AppShell
      title="Add Student"
      subtitle="Enroll a new student and establish their tuition fee structure."
      showAddStudent={false}
    >
      <div className="mx-auto max-w-2xl">
        {/* Navigation back */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link to="/students">
              <ArrowLeft className="size-3.5" />
              Back to Students
            </Link>
          </Button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(false);
          }}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          {/* Section 1: Student Identification */}
          <div>
            <h2 className="font-display text-sm font-semibold tracking-wide text-foreground uppercase text-cyan-400">
              Student Identification
            </h2>
            <div className="mt-4 space-y-4">
              {/* Student ID */}
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-foreground">
                  <span>Student ID *</span>
                  <span className="text-[11px] text-muted-foreground">Manual entry</span>
                </label>
                <input
                  id="input-student-id"
                  type="text"
                  required
                  placeholder="e.g. STD-2026-01"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Choose a unique Student ID (never auto-generated).
                </p>
              </div>

              {/* Student Full Name */}
              <div>
                <label className="text-xs font-medium text-foreground">Student Full Name *</label>
                <input
                  id="input-student-name"
                  type="text"
                  required
                  placeholder="e.g. Abdullah Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              {/* Gender, Phone & Course Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Gender *</label>
                  <select id="input-student-gender" required value={gender} onChange={(e) => setGender(e.target.value as "" | "Male" | "Female")} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">
                    <option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center justify-between text-xs font-medium text-foreground">
                    <span>Phone / WhatsApp</span>
                    <span className="text-[11px] text-muted-foreground">Optional</span>
                  </label>
                  <input
                    id="input-student-phone"
                    type="tel"
                    placeholder="e.g. 0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-medium text-foreground">
                    <span>Course / Class</span>
                    <span className="text-[11px] text-muted-foreground">Optional</span>
                  </label>
                  <input
                    id="input-student-course"
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              {/* Date Joined */}
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-foreground">
                  <span>Date Joined</span>
                  <span className="text-[11px] text-muted-foreground">Optional</span>
                </label>
                <input
                  id="input-student-date-joined"
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
                  className="academy-date-input mt-1 h-10 w-full cursor-pointer rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>
          </div>

          <hr className="my-6 border-border" />

          {/* Section 2: Tuition Fee Structure */}
          <div>
            <h2 className="font-display text-sm font-semibold tracking-wide text-foreground uppercase text-cyan-400">
              Tuition Fee Structure
            </h2>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                {/* Total Fees */}
                <div>
                  <div className="flex h-5 items-center justify-between">
                    <label
                      htmlFor="input-total-fees"
                      className="text-xs font-medium text-foreground"
                    >
                      Total Fees ({currencyLabel}) *
                    </label>
                  </div>
                  <input
                    id="input-total-fees"
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="e.g. 25000"
                    value={totalFees}
                    onChange={(e) => setTotalFees(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                {/* Amount Paid at Enrollment */}
                <div>
                  <div className="flex h-5 items-center justify-between">
                    <label
                      htmlFor="input-amount-paid"
                      className="text-xs font-medium text-foreground"
                    >
                      Amount Paid at Enrollment ({currencyLabel})
                    </label>
                    <span className="text-[11px] text-muted-foreground">Default 0</span>
                  </div>
                  <input
                    id="input-amount-paid"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-background px-3 font-mono text-sm outline-none transition-colors focus:ring-2 ${
                      isOverpaid
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20 text-destructive"
                        : "border-input focus:border-cyan-500 focus:ring-cyan-500/20"
                    }`}
                  />
                  {isOverpaid && (
                    <p className="mt-1 text-[11px] font-medium text-destructive">
                      Amount Paid cannot exceed Total Fees.
                    </p>
                  )}
                </div>
              </div>

              {/* Calculated Remaining & Automatic Payment Status */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3.5 text-xs">
                <div>
                  <p className="text-muted-foreground">Calculated Remaining</p>
                  <p className="mt-1 font-mono text-sm font-bold text-foreground">
                    {formatCurrency(remaining)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Automatic Payment Status</p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      autoStatus === "Paid"
                        ? "text-emerald-400"
                        : autoStatus === "Partial"
                          ? "text-blue-400"
                          : "text-amber-400"
                    }`}
                  >
                    {autoStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-border" />

          {/* Section 3: Notes & Remarks */}
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-foreground">
              <span>Notes &amp; Remarks</span>
              <span className="text-[11px] text-muted-foreground">Optional</span>
            </label>
            <textarea
              id="input-student-notes"
              rows={3}
              placeholder="Installment notes, concessions, or remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/students">Cancel</Link>
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto"
            >
              <PlusCircle className="mr-1.5 size-4" />
              Save &amp; Add Another
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-cyan-600 text-white hover:bg-cyan-500"
            >
              <Save className="mr-1.5 size-4" />
              Save Student
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
