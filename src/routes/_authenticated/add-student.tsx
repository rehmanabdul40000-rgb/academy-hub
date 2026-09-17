import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createStudent } from "@/features/students/students.storage";
import { getSettings } from "@/features/settings/settings.storage";

export default function AddStudentPage() {
  const navigate = useNavigate();
  const settings = getSettings();
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"" | "Male" | "Female">("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [totalFees, setTotalFees] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const remaining = Math.max(Number(totalFees || 0) - Number(amountPaid || 0), 0);
  const status = remaining <= 0 && Number(totalFees || 0) > 0 ? "Paid" : Number(amountPaid || 0) > 0 ? "Partial" : "Pending";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gender) return;

    createStudent({
      studentId: studentId.trim(),
      name: name.trim(),
      gender,
      phone: phone.trim(),
      course: course.trim(),
      dateJoined,
      totalFees: Number(totalFees || 0),
      amountPaid: Number(amountPaid || 0),
      notes: notes.trim(),
    });
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center p-6">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <h1 className="font-display text-2xl font-bold">Student Saved</h1>
            <p className="text-sm text-muted-foreground">The student record has been added successfully.</p>
            <div className="flex gap-3">
              <Button onClick={() => navigate({ to: "/students" })}>View Students</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>Add Another</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Add Student</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enroll a new student and establish their tuition fee structure.</p>
      </div>

      <button type="button" onClick={() => navigate({ to: "/students" })} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-display text-sm font-semibold tracking-wide text-foreground uppercase text-cyan-400">Student Identification</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-foreground">
                <span>Student ID *</span>
                <span className="text-[11px] text-muted-foreground">Manual entry</span>
              </label>
              <input id="input-student-id" type="text" required placeholder="e.g. STD-2026-01" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              <p className="mt-1 text-[11px] text-muted-foreground">Choose a unique Student ID (never auto-generated).</p>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Student Full Name *</label>
              <input id="input-student-name" type="text" required placeholder="e.g. Abdullah Khan" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
            </div>

            {/* All three field labels use the exact same fixed height so every input starts on the same baseline. */}
            <div className="grid items-start gap-4 sm:grid-cols-3">
              <div>
                <label className="flex h-5 items-center justify-between text-xs font-medium text-foreground">
                  <span>Gender *</span>
                </label>
                <select id="input-student-gender" required value={gender} onChange={(e) => setGender(e.target.value as "" | "Male" | "Female")} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">
                  <option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="flex h-5 items-center justify-between text-xs font-medium text-foreground">
                  <span>Phone / WhatsApp</span>
                  <span className="text-[11px] text-muted-foreground">Optional</span>
                </label>
                <input id="input-student-phone" type="tel" placeholder="e.g. 0300-1234567" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </div>
              <div>
                <label className="flex h-5 items-center justify-between text-xs font-medium text-foreground">
                  <span>Course / Class</span>
                  <span className="text-[11px] text-muted-foreground">Optional</span>
                </label>
                <input id="input-student-course" type="text" placeholder="e.g. Mathematics" value={course} onChange={(e) => setCourse(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-medium text-foreground">
                <span>Date Joined</span><span className="text-[11px] text-muted-foreground">Optional</span>
              </label>
              <input type="date" value={dateJoined} onChange={(e) => setDateJoined(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-display text-sm font-semibold tracking-wide text-foreground uppercase text-cyan-400">Tuition Fee Structure</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-foreground">Total Fees ({settings.currencyLabel || "Rs"}) *</label>
                <input type="number" min="0" required placeholder="e.g. 25000" value={totalFees} onChange={(e) => setTotalFees(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </div>
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-foreground"><span>Amount Paid at Enrollment ({settings.currencyLabel || "Rs"})</span><span className="text-[11px] text-muted-foreground">Enter manually</span></label>
                <input type="number" min="0" placeholder="e.g. 5000" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </div>
            </div>
            <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">Calculated Remaining</p><p className="mt-1 font-mono text-sm font-semibold">{settings.currencyLabel || "Rs"} {remaining.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Automatic Payment Status</p><p className={`mt-1 text-sm font-semibold ${status === "Paid" ? "text-emerald-400" : status === "Partial" ? "text-blue-400" : "text-amber-400"}`}>{status}</p></div>
            </div>
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-foreground"><span>Notes & Remarks</span><span className="text-[11px] text-muted-foreground">Optional</span></label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Any additional notes..." className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
            </div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate({ to: "/students" })}>Cancel</Button><Button type="submit">Save Student</Button></div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
