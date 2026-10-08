import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, PlusCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/academy/app-shell";
import { can } from "@/features/auth/permissions";
import { isWorkspaceSectionEnabled } from "@/features/workspace/workspace.storage";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/features/settings/settings.storage";
import { getShiftById, formatShiftTime, getShifts, type AcademyShift } from "@/features/shifts/shifts.storage";
import { addStudent, computeRemaining, computeStudentStatus, formatCurrency } from "@/features/students/students.storage";

export const Route = createFileRoute("/_authenticated/add-student")({
  beforeLoad: () => { if (!isWorkspaceSectionEnabled("addStudent") || !can("studentsSave")) throw redirect({ to: "/dashboard" }); },
  head: () => ({ meta: [{ title: "Add Student — Academy Hub" }, { name: "description", content: "Enroll a new student in Academy Hub." }] }),
  component: AddStudentPage,
});
const inputClass = "mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

function AddStudentPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(getSettings);
  const [shifts, setShifts] = useState<AcademyShift[]>(getShifts());
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState<"" | "Male" | "Female">("");
  const [shift, setShift] = useState("");
  const [shiftTime, setShiftTime] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [course, setCourse] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [admissionFee, setAdmissionFee] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const settingsFn = () => setSettings(getSettings());
    const shiftsFn = () => setShifts(getShifts());
    window.addEventListener("academy-settings-updated", settingsFn);
    window.addEventListener("academy-shifts-updated", shiftsFn);
    return () => {
      window.removeEventListener("academy-settings-updated", settingsFn);
      window.removeEventListener("academy-shifts-updated", shiftsFn);
    };
  }, []);

  const currencyLabel = settings.currencyLabel || "Rs";
  const numAdmission = Math.max(0, parseFloat(admissionFee) || 0);
  const numMonthly = Math.max(0, parseFloat(monthlyFee) || 0);
  const numPaid = Math.max(0, parseFloat(amountPaid) || 0);
  const initialTotal = numAdmission + numMonthly;
  const remaining = computeRemaining(initialTotal, numPaid);
  const autoStatus = computeStudentStatus(initialTotal, numPaid);
  const isOverpaid = numPaid > initialTotal;

  function handleShiftChange(value: string) {
    setShift(value);
    const saved = getShiftById(value);
    setShiftTime(formatShiftTime(saved));
  }

  function resetForm() {
    setName(""); setFatherName(""); setGender(""); setShift(""); setShiftTime("");
    setPhone(""); setPhone2(""); setBankName(""); setBankAccountName(""); setBankAccountNumber(""); setCourse(""); setDateJoined("");
    setAdmissionFee(""); setMonthlyFee(""); setAmountPaid(""); setNotes(""); setErrorMessage("");
  }

  function handleSave(addAnother = false) {
    setErrorMessage(""); setSuccessMessage("");
    if (!name.trim()) return setErrorMessage("Student Name is required.");
    if (numAdmission < 0 || numMonthly < 0) return setErrorMessage("Fee amounts cannot be negative.");
    if (initialTotal <= 0) return setErrorMessage("Please enter an Admission Fee and/or Monthly Fee.");
    if (numPaid > initialTotal) return setErrorMessage(`Amount Paid (${formatCurrency(numPaid)}) cannot be greater than Admission + first Monthly Fee (${formatCurrency(initialTotal)}).`);

    setIsSubmitting(true);
    const result = addStudent({
      name: name.trim(), fatherName: fatherName.trim() || undefined,
      gender: gender || undefined,
      shift: shift === "morning" ? "Morning" : shift === "evening" ? "Evening" : undefined,
      shiftTime: shiftTime || undefined,
      phone: phone.trim() || undefined, phone2: phone2.trim() || undefined,
      bankName: bankName.trim() || undefined, bankAccountName: bankAccountName.trim() || undefined, bankAccountNumber: bankAccountNumber.trim() || undefined,
      course: course.trim() || undefined, dateJoined: dateJoined.trim() || undefined,
      admissionFee: numAdmission, monthlyFee: numMonthly, amountPaid: numPaid,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);
    if (!result.success) return setErrorMessage(result.error || "Failed to register student.");
    if (addAnother) {
      setSuccessMessage(`${name.trim()} successfully saved.`);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate({ to: "/students" });
    }
  }

  return (
    <AppShell title="Add Student" subtitle="Enroll a new student and establish their admission and monthly fee structure." showAddStudent={false}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Link to="/students"><ArrowLeft className="size-3.5" />Back to Students</Link>
          </Button>
        </div>
        {successMessage && <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400"><CheckCircle2 className="size-4" />{successMessage}</div>}
        {errorMessage && <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">{errorMessage}</div>}

        <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-sm font-semibold tracking-wide text-cyan-400 uppercase">Student Information</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-xs font-medium">Student Name *</label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Abdullah Khan" className={inputClass} /></div>
              <div><label className="text-xs font-medium">Father Name</label><input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="e.g. Muhammad Aslam" className={inputClass} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="text-xs font-medium">Contact No. 1</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300-1234567" className={inputClass} /></div>
              <div><label className="text-xs font-medium">Contact No. 2</label><input value={phone2} onChange={(e) => setPhone2(e.target.value)} placeholder="0312-7654321" className={inputClass} /></div>
              <div><label className="text-xs font-medium">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value as "" | "Male" | "Female")} className={inputClass}><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="text-xs font-medium">Bank Name</label><input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Meezan Bank" className={inputClass} /></div>
              <div><label className="text-xs font-medium">Account Name / Title</label><input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Account holder / title" className={inputClass} /></div>
              <div><label className="text-xs font-medium">Bank Account Number</label><input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Account number" className={inputClass} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-xs font-medium">Course / Class</label><input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. 1st Year / Mathematics" className={inputClass} /></div>
              <div><label className="text-xs font-medium">Date Joined</label><input type="date" value={dateJoined} onChange={(e) => setDateJoined(e.target.value)} className={`${inputClass} cursor-pointer`} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-xs font-medium">Shift</label><select value={shift} onChange={(e) => handleShiftChange(e.target.value)} className={inputClass}><option value="">Select shift</option>{shifts.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="text-xs font-medium">Class Time</label><input value={shiftTime} onChange={(e) => setShiftTime(e.target.value)} placeholder="Auto from selected shift" className={inputClass} /></div>
            </div>
          </div>

          <hr className="my-6 border-border" />
          <h2 className="font-display text-sm font-semibold tracking-wide text-cyan-400 uppercase">Fee Structure</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div><label className="text-xs font-medium">Admission Fee ({currencyLabel})</label><input type="number" min="0" step="any" value={admissionFee} onChange={(e) => setAdmissionFee(e.target.value)} placeholder="e.g. 2000" className={`${inputClass} font-mono`} /></div>
            <div><label className="text-xs font-medium">Monthly Fee ({currencyLabel})</label><input type="number" min="0" step="any" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder="e.g. 7000" className={`${inputClass} font-mono`} /><p className="mt-1 text-[11px] text-muted-foreground">Saved separately for every month.</p></div>
            <div><label className="text-xs font-medium">Amount Paid at Enrollment ({currencyLabel})</label><input type="number" min="0" step="any" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="e.g. 9000" className={`${inputClass} font-mono ${isOverpaid ? "border-destructive" : ""}`} /></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/30 p-3.5 text-xs">
            <div><p className="text-muted-foreground">Initial Total</p><p className="mt-1 font-mono font-bold">{formatCurrency(initialTotal)}</p></div>
            <div><p className="text-muted-foreground">Initial Remaining</p><p className="mt-1 font-mono font-bold">{formatCurrency(remaining)}</p></div>
            <div><p className="text-muted-foreground">Status</p><p className="mt-1 font-bold">{autoStatus}</p></div>
          </div>
          <p className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3 text-[11px] text-muted-foreground">The system keeps a separate 12-month fee schedule for this student. Future months stay hidden until their month arrives.</p>

          <hr className="my-6 border-border" />
          <label className="text-xs font-medium">Notes &amp; Remarks <span className="text-muted-foreground">(Optional)</span></label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Installment notes, concessions, or remarks..." className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm" />

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild><Link to="/students">Cancel</Link></Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => handleSave(true)}><PlusCircle className="mr-1.5 size-4" />Save &amp; Add Another</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 text-white hover:bg-cyan-500"><Save className="mr-1.5 size-4" />Save Student</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
