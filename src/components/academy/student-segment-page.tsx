import { Link } from "@tanstack/react-router";
import { ArrowLeft, Search, Users, Eye, ReceiptText, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/academy/app-shell";
import { Button } from "@/components/ui/button";
import { ViewStudentModal, EditStudentModal, QuickPaymentModal, DeleteStudentDialog } from "@/components/academy/student-dialogs";
import { can } from "@/features/auth/permissions";
import { exportStudentSegmentToExcel } from "@/lib/excel-export";
import { calculateMetrics, formatCurrency, getStudentSavedAt, getStudents } from "@/features/students/students.storage";
import type { Student } from "@/types/student";

type Segment = "Male" | "Female" | "Morning" | "Evening";

const segmentMeta: Record<Segment, { title: string; subtitle: string; empty: string }> = {
  Male: { title: "Male Students", subtitle: "Complete records of male students.", empty: "No male students found." },
  Female: { title: "Female Students", subtitle: "Complete records of female students.", empty: "No female students found." },
  Morning: { title: "Morning Shift", subtitle: "Complete records for the Morning Shift (8:00 AM–2:00 PM).", empty: "No students assigned to Morning Shift." },
  Evening: { title: "Evening Shift", subtitle: "Complete records of students assigned to the Evening Shift.", empty: "No students assigned to Evening Shift." },
};

export function StudentSegmentPage({ segment }: { segment: Segment }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [payingStudent, setPayingStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const refresh = () => setStudents(getStudents());
    refresh();
    window.addEventListener("academy-students-updated", refresh);
    return () => window.removeEventListener("academy-students-updated", refresh);
  }, []);

  const segmentStudents = useMemo(() => students.filter((student) => segment === "Male" || segment === "Female" ? student.gender === segment : student.shift === segment), [students, segment]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return segmentStudents;
    return segmentStudents.filter((s) => [s.createdAt, s.name, s.phone, s.course, s.notes, s.gender, s.shift].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [segmentStudents, search]);
  const metrics = calculateMetrics(segmentStudents);
  const meta = segmentMeta[segment];

  return (
    <AppShell title={meta.title} subtitle={meta.subtitle}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/students"><ArrowLeft className="mr-1 size-4" />All Students</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Students</p><p className="mt-1 text-xl font-bold">{metrics.totalStudents}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Total Fees</p><p className="mt-1 text-xl font-bold">{formatCurrency(metrics.totalBilledFees)}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Paid</p><p className="mt-1 text-xl font-bold text-emerald-400">{formatCurrency(metrics.totalFeesCollected)}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Remaining</p><p className="mt-1 text-xl font-bold text-amber-400">{formatCurrency(metrics.totalOutstandingFees)}</p></div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4 text-cyan-400" />{meta.title} — {segmentStudents.length} records</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={isExporting || !can("reports")} onClick={async () => { setIsExporting(true); try { await exportStudentSegmentToExcel(segmentStudents, meta.title); } finally { setIsExporting(false); } }} className="gap-1.5"><FileSpreadsheet className="size-4" />{isExporting ? "Exporting..." : "Export This Section"}</Button>
            <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this group..." className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-xs outline-none focus:border-cyan-500" /></div>
          </div>
        </div>
        {filtered.length ? (
          <div className="responsive-data-table overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Father Name</th>
                  <th className="px-5 py-3.5">Gender</th>
                  <th className="px-5 py-3.5">Phone / WhatsApp</th>
                  <th className="px-5 py-3.5">Course / Class</th>
                  <th className="px-5 py-3.5">Date Joined</th>
                  <th className="px-5 py-3.5">Saved At</th>
                  <th className="px-5 py-3.5 text-right">Total Fees</th>
                  <th className="px-5 py-3.5 text-right">Paid</th>
                  <th className="px-5 py-3.5 text-right">Remaining</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Notes</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((s) => (
                  <tr key={s.createdAt} className="transition-colors hover:bg-muted/20">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-lg bg-cyan-500/10 text-xs font-bold text-cyan-400">{s.name.charAt(0).toUpperCase()}</span>
                        <span className="font-semibold">{s.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{s.fatherName || <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs"><span className="rounded-md border border-border/80 bg-muted/40 px-2 py-1">{s.gender || "Unspecified"}</span></td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs">
                      <div className="space-y-1">
                        {s.phone ? <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-cyan-400"><span>{s.phone}</span></a> : <span className="text-muted-foreground/40">—</span>}
                        {s.phone2 && <div className="text-[11px] text-muted-foreground">{s.phone2}</div>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{s.course ? <span className="whitespace-nowrap rounded-md border border-border/80 bg-muted/40 px-2 py-1">{s.course}</span> : <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{s.dateJoined || <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{getStudentSavedAt(s)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-xs font-semibold text-foreground">{formatCurrency(s.totalFees)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-xs font-semibold text-emerald-400">{formatCurrency(s.amountPaid)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-xs font-semibold text-amber-400">{formatCurrency(s.remainingFees)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        s.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        s.status === "Partial" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          s.status === "Paid" ? "bg-emerald-400" : s.status === "Partial" ? "bg-blue-400" : "bg-amber-400"
                        }`} />
                        {s.status}
                      </span>
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-4 text-xs text-muted-foreground" title={s.notes || ""}>{s.notes || <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="View Details" aria-label="View Details" onClick={() => setViewingStudent(s)} className="size-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><Eye className="size-4" /></Button>
                        <Button variant="ghost" size="icon" title="Collect Fee / Record Payment" aria-label="Collect Fee / Record Payment" onClick={() => setPayingStudent(s)} className="size-8 rounded-lg text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"><ReceiptText className="size-4" /></Button>
                        <Button variant="ghost" size="icon" title="Edit Student" aria-label="Edit Student" onClick={() => setEditingStudent(s)} className="size-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><Edit className="size-4" /></Button>
                        <Button variant="ghost" size="icon" title="Delete Student" aria-label="Delete Student" onClick={() => setDeletingStudent(s)} className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-12 text-center text-sm text-muted-foreground">{search ? "No matching records found." : meta.empty}</div>}
      </div>

      <ViewStudentModal
        student={viewingStudent}
        open={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        onEdit={(student) => { setViewingStudent(null); setEditingStudent(student); }}
        onQuickPayment={(student) => { setViewingStudent(null); setPayingStudent(student); }}
        onDelete={(student) => { setViewingStudent(null); setDeletingStudent(student); }}
      />
      <EditStudentModal
        student={editingStudent}
        open={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={() => { setEditingStudent(null); setStudents(getStudents()); }}
      />
      <QuickPaymentModal
        student={payingStudent}
        open={!!payingStudent}
        onClose={() => setPayingStudent(null)}
        onSuccess={() => { setPayingStudent(null); setStudents(getStudents()); }}
      />
      <DeleteStudentDialog
        student={deletingStudent}
        open={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onSuccess={() => setStudents(getStudents())}
      />
    </AppShell>
  );
}
