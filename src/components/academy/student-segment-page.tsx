import { Link } from "@tanstack/react-router";
import { ArrowLeft, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/academy/app-shell";
import { Button } from "@/components/ui/button";
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
    return segmentStudents.filter((s) => [s.id, s.name, s.phone, s.course, s.notes, s.gender, s.shift].some((value) => String(value || "").toLowerCase().includes(q)));
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
          <div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this group..." className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-xs outline-none focus:border-cyan-500" /></div>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-sm">
              <thead><tr className="border-b border-border bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-center">Student ID</th><th className="px-4 py-3 text-center">Student Name</th><th className="px-4 py-3 text-center">Gender</th><th className="px-4 py-3 text-center">Shift</th><th className="px-4 py-3 text-center">Class Time</th><th className="px-4 py-3 text-center">Phone / WhatsApp</th><th className="px-4 py-3 text-center">Course / Class</th><th className="px-4 py-3 text-center">Date Joined</th><th className="px-4 py-3 text-center">Saved At</th><th className="px-4 py-3 text-center">Total Fees</th><th className="px-4 py-3 text-center">Paid</th><th className="px-4 py-3 text-center">Remaining</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Notes</th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">{filtered.map((s) => <tr key={s.id} className="hover:bg-muted/20">
                <td className="whitespace-nowrap px-4 py-4 text-center font-mono text-xs font-semibold text-cyan-400">{s.id}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center font-semibold">{s.name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center text-xs">{s.gender || "Unspecified"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center text-xs">{s.shift || "Unspecified"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center text-xs">{s.shiftTime || "—"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center text-xs">{s.phone || "—"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center text-xs">{s.course || "—"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center text-xs">{s.dateJoined || "—"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center text-xs">{getStudentSavedAt(s)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center font-mono text-xs font-semibold">{formatCurrency(s.totalFees)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center font-mono text-xs font-semibold text-emerald-400">{formatCurrency(s.amountPaid)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center font-mono text-xs font-semibold text-amber-400">{formatCurrency(s.remainingFees)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-center text-xs">{s.status}</td>
                <td className="max-w-[220px] truncate px-4 py-4 text-center text-xs text-muted-foreground" title={s.notes || ""}>{s.notes || "—"}</td>
              </tr>)}</tbody>
            </table>
          </div>
        ) : <div className="p-12 text-center text-sm text-muted-foreground">{search ? "No matching records found." : meta.empty}</div>}
      </div>
    </AppShell>
  );
}
