import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/academy/app-shell";
import {
  DeleteStudentDialog,
  EditStudentModal,
  QuickPaymentModal,
  ViewStudentModal,
} from "@/components/academy/student-dialogs";
import { Button } from "@/components/ui/button";
import {
  calculateMetrics,
  formatCurrency,
  getStudentSavedAt,
  getStudents,
} from "@/features/students/students.storage";
import { exportAcademyToExcel } from "@/lib/excel-export";
import type { PaymentStatus, Student, StudentGender } from "@/types/student";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({
    meta: [
      { title: "Students Directory — Academy Hub" },
      { name: "description", content: "Manage academy student records and tuition fees." },
      { property: "og:title", content: "Students Directory — Academy Hub" },
      { property: "og:description", content: "Manage academy student records and tuition fees." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PaymentStatus>("All");
  const [genderFilter, setGenderFilter] = useState<"All" | StudentGender>("All");
  const [isExporting, setIsExporting] = useState(false);

  // Dialog states
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [payingStudent, setPayingStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  function refreshStudents() {
    setStudents(getStudents());
  }

  useEffect(() => {
    refreshStudents();

    function handleUpdate() {
      refreshStudents();
    }

    window.addEventListener("academy-students-updated", handleUpdate);
    return () => {
      window.removeEventListener("academy-students-updated", handleUpdate);
    };
  }, []);

  const metrics = useMemo(() => calculateMetrics(students), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesFilter =
        statusFilter === "All" || s.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesGender = genderFilter === "All" || (s.gender || "Unspecified") === genderFilter;
      if (!matchesFilter || !matchesGender) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    });
  }, [students, statusFilter, genderFilter, searchQuery]);

  async function handleExport() {
    try {
      setIsExporting(true);
      await exportAcademyToExcel(students);
    } catch (err) {
      console.error("Failed to export Excel:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AppShell
      title="Students Directory"
      subtitle="Complete database of enrolled academy students, tuition balances, and payment statuses."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Quick summary metrics banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Enrolled</p>
          <p className="mt-1 font-display text-xl font-bold text-foreground">
            {metrics.totalStudents}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Fully Paid</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-400">
            {metrics.paidStudents}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Partial Paid</p>
          <p className="mt-1 font-display text-xl font-bold text-blue-400">
            {metrics.partialStudents}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pending Clearance</p>
          <p className="mt-1 font-display text-xl font-bold text-amber-400">
            {metrics.pendingStudents}
          </p>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        {/* Controls Bar */}
        <div
          id="students-controls"
          className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between"
        >
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by ID, name, phone, course, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-xs outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter Tabs & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Tabs */}
            <div className="flex rounded-lg border border-border bg-background/60 p-0.5">
              {(["All", "Paid", "Partial", "Pending"] as const).map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-card text-cyan-400 font-semibold shadow-sm border border-cyan-500/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            <div className="flex rounded-lg border border-border bg-background/60 p-0.5">
              {(["All", "Male", "Female"] as const).map((filter) => (
                <button key={filter} onClick={() => setGenderFilter(filter)} className={`rounded-md px-3 py-1.5 text-xs ${genderFilter === filter ? "bg-card text-cyan-400 font-semibold" : "text-muted-foreground"}`}>{filter === "All" ? "All Gender" : filter}</button>
              ))}
            </div>

            {/* Export Excel */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-9 gap-1.5 border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300"
            >
              <FileSpreadsheet className="size-4" />
              <span>{isExporting ? "Exporting..." : "Export"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-9 gap-1.5"
            >
              <Printer className="size-4" />
              <span>Print</span>
            </Button>

            {/* Add Student */}
            <Button
              asChild
              size="sm"
              className="h-9 gap-1.5 bg-cyan-600 text-white hover:bg-cyan-500"
            >
              <Link to="/add-student">
                <Plus className="size-4" />
                <span>Add Student</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Table Content */}
        {filteredStudents.length > 0 ? (
          <div className="responsive-data-table overflow-x-auto">
            <table id="students-directory-table" className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5">Student ID</th>
                  <th className="px-5 py-3.5">Student Name</th>
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
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    id={`student-row-${s.id}`}
                    className="transition-colors hover:bg-muted/20"
                  >
                    {/* ID */}
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-cyan-400">
                      {s.id}
                    </td>

                    {/* Name */}
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-lg bg-cyan-500/10 text-xs font-bold text-cyan-400">
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{s.name}</p>
                          {s.phone && (
                            <p className="text-[11px] text-muted-foreground sm:hidden">{s.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="whitespace-nowrap px-5 py-4 text-xs"><span className="rounded-md border border-border/80 bg-muted/40 px-2 py-1">{s.gender || "Unspecified"}</span></td>

                    {/* Phone */}
                    <td className="whitespace-nowrap px-5 py-4 text-xs">
                      {s.phone ? (
                        <a
                          href={`tel:${s.phone}`}
                          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-cyan-400"
                        >
                          <Phone className="size-3 text-muted-foreground/60" />
                          <span>{s.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Course */}
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {s.course ? (
                        <span className="whitespace-nowrap rounded-md border border-border/80 bg-muted/40 px-2 py-1">
                          {s.course}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Date Joined */}
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                      {s.dateJoined || <span className="text-muted-foreground/40">—</span>}
                    </td>

                    {/* Saved At */}
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                      {getStudentSavedAt(s)}
                    </td>

                    {/* Total Fees */}
                    <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-xs font-semibold text-foreground">
                      {formatCurrency(s.totalFees)}
                    </td>

                    {/* Paid */}
                    <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-xs font-semibold text-emerald-400">
                      {formatCurrency(s.amountPaid)}
                    </td>

                    {/* Remaining */}
                    <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-xs font-semibold text-amber-400">
                      {formatCurrency(s.remainingFees)}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          s.status === "Paid"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : s.status === "Partial"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            s.status === "Paid"
                              ? "bg-emerald-400"
                              : s.status === "Partial"
                                ? "bg-blue-400"
                                : "bg-amber-400"
                          }`}
                        />
                        {s.status}
                      </span>
                    </td>

                    {/* Notes */}
                    <td
                      className="max-w-[180px] truncate px-5 py-4 text-xs text-muted-foreground"
                      title={s.notes || ""}
                    >
                      {s.notes || <span className="text-muted-foreground/40">—</span>}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Details"
                          aria-label="View Details"
                          onClick={() => setViewingStudent(s)}
                          className="size-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Eye className="size-4" />
                        </Button>

                        {/* Collect Fee / Record Payment */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Collect Fee / Record Payment"
                          aria-label="Collect Fee / Record Payment"
                          onClick={() => setPayingStudent(s)}
                          className="size-8 rounded-lg text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        >
                          <ReceiptText className="size-4" />
                        </Button>

                        {/* Edit Student */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Student"
                          aria-label="Edit Student"
                          onClick={() => setEditingStudent(s)}
                          className="size-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Edit className="size-4" />
                        </Button>

                        {/* Delete Student */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Student"
                          aria-label="Delete Student"
                          onClick={() => setDeletingStudent(s)}
                          className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="mx-auto size-10 text-muted-foreground/40" />
            <h3 className="mt-4 font-display font-semibold text-foreground">
              {students.length === 0 ? "No students in directory" : "No matching records found"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {students.length === 0
                ? "Your academy database has zero enrolled students. Click 'Add Student' to get started."
                : "No students match the current filter and search query."}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              {(searchQuery || statusFilter !== "All" || genderFilter !== "All") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("All");
                    setGenderFilter("All");
                  }}
                >
                  Reset Filters
                </Button>
              )}
              <Button size="sm" asChild className="bg-cyan-600 text-white hover:bg-cyan-500">
                <Link to="/add-student">
                  <UserPlus className="mr-1.5 size-4" />
                  Add Student
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewStudentModal
        student={viewingStudent}
        open={viewingStudent !== null}
        onClose={() => setViewingStudent(null)}
        onEdit={(st) => setEditingStudent(st)}
        onQuickPayment={(st) => setPayingStudent(st)}
        onDelete={(st) => setDeletingStudent(st)}
      />

      <QuickPaymentModal
        student={payingStudent}
        open={payingStudent !== null}
        onClose={() => setPayingStudent(null)}
        onSuccess={refreshStudents}
      />

      <EditStudentModal
        student={editingStudent}
        open={editingStudent !== null}
        onClose={() => setEditingStudent(null)}
        onSuccess={refreshStudents}
      />

      <DeleteStudentDialog
        student={deletingStudent}
        open={deletingStudent !== null}
        onClose={() => setDeletingStudent(null)}
        onSuccess={refreshStudents}
      />
    </AppShell>
  );
}
