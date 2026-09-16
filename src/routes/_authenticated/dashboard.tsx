import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit,
  Eye,
  Plus,
  Printer,
  Receipt,
  ReceiptText,
  Search,
  Trash2,
  UserCheck,
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
import { getSettings, type AcademySettings } from "@/features/settings/settings.storage";
import {
  calculateMetrics,
  computeRemaining,
  computeStudentStatus,
  formatCurrency,
  getStudentSavedAt,
  getStudents,
} from "@/features/students/students.storage";
import type { PaymentStatus, Student } from "@/types/student";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Academy Hub" },
      { name: "description", content: "Academy student and fee overview." },
      { property: "og:title", content: "Dashboard — Academy Hub" },
      { property: "og:description", content: "Academy student and fee overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function getGreeting(adminName: string): string {
  const hour = new Date().getHours();
  let salutation = "Good evening";
  if (hour >= 5 && hour < 12) {
    salutation = "Good morning";
  } else if (hour >= 12 && hour < 17) {
    salutation = "Good afternoon";
  } else if (hour >= 17 && hour < 21) {
    salutation = "Good evening";
  } else {
    salutation = "Good night";
  }
  const cleanName = adminName?.trim() || "Admin";
  return `${salutation}, ${cleanName}`;
}

function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<AcademySettings>(getSettings());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PaymentStatus>("All");
  const [currentDateStr, setCurrentDateStr] = useState(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });
  const [currentTimeStr, setCurrentTimeStr] = useState(() =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  );

  // Dialog states
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [payingStudent, setPayingStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  function refreshStudents() {
    setStudents(getStudents());
  }

  function refreshSettings() {
    setSettings(getSettings());
  }

  useEffect(() => {
    refreshStudents();
    refreshSettings();

    function handleStudentUpdate() {
      refreshStudents();
    }

    function handleSettingsUpdate() {
      refreshSettings();
    }

    window.addEventListener("academy-students-updated", handleStudentUpdate);
    window.addEventListener("academy-settings-updated", handleSettingsUpdate);

    const clockInterval = setInterval(() => {
      const now = new Date();
      setCurrentDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
      setCurrentTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    }, 1000);

    return () => {
      window.removeEventListener("academy-students-updated", handleStudentUpdate);
      window.removeEventListener("academy-settings-updated", handleSettingsUpdate);
      clearInterval(clockInterval);
    };
  }, []);

  const metrics = useMemo(() => calculateMetrics(students), [students]);
  const collectionPercentage =
    metrics.totalBilledFees > 0
      ? Math.round((metrics.totalFeesCollected / metrics.totalBilledFees) * 100)
      : 0;
  const outstandingStudents = useMemo(
    () =>
      students
        .map((student) => ({
          student,
          remaining: computeRemaining(student.totalFees, student.amountPaid),
        }))
        .filter(({ remaining }) => remaining > 0)
        .sort((left, right) => right.remaining - left.remaining),
    [students],
  );

  // Filter and search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesFilter =
        statusFilter === "All" || s.status.toLowerCase() === statusFilter.toLowerCase();
      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q))
      );
    });
  }, [students, statusFilter, searchQuery]);

  // Six statistic cards
  const statCards = [
    {
      id: "stat-total-students",
      label: "Total Students",
      value: metrics.totalStudents.toString(),
      subtext: "Enrolled student records",
      icon: Users,
      iconBg: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    },
    {
      id: "stat-paid-students",
      label: "Paid Students",
      value: metrics.paidStudents.toString(),
      subtext: `${
        metrics.totalStudents > 0
          ? Math.round((metrics.paidStudents / metrics.totalStudents) * 100)
          : 0
      }% of enrolled`,
      icon: UserCheck,
      iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
    {
      id: "stat-partial-payments",
      label: "Partial Payments",
      value: metrics.partialStudents.toString(),
      subtext: "Installments pending",
      icon: CreditCard,
      iconBg: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    },
    {
      id: "stat-pending-payments",
      label: "Pending Payments",
      value: metrics.pendingStudents.toString(),
      subtext: "No payment made",
      icon: AlertCircle,
      iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    {
      id: "stat-fees-collected",
      label: "Total Fees Collected",
      value: formatCurrency(metrics.totalFeesCollected),
      subtext: `Out of ${formatCurrency(metrics.totalBilledFees)}`,
      icon: Banknote,
      iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
    {
      id: "stat-outstanding-fees",
      label: "Outstanding Fees",
      value: formatCurrency(metrics.totalOutstandingFees),
      subtext: "Total pending receivables",
      icon: Receipt,
      iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    },
  ];

  return (
    <AppShell
      title={getGreeting(settings.adminDisplayName)}
      subtitle={`${currentDateStr} • ${currentTimeStr} • Overview of students, tuition fee collections, and receivables.`}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Six Statistic Cards */}
      <section
        id="dashboard-stats-grid"
        aria-label="Key Statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              id={card.id}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                  <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                    {card.value}
                  </p>
                </div>
                <span className={`grid size-10 place-items-center rounded-xl ${card.iconBg}`}>
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">{card.subtext}</p>
            </article>
          );
        })}
      </section>

      <section
        className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]"
        aria-label="Fee Collection Overview"
      >
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                Fee Collection Overview
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-foreground">
                Collection progress
              </h2>
            </div>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
              {collectionPercentage}% collected
            </span>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-[width] duration-500"
              style={{ width: `${Math.min(collectionPercentage, 100)}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Total Fees</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatCurrency(metrics.totalBilledFees)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Collected</p>
              <p className="mt-1 font-semibold text-emerald-400">
                {formatCurrency(metrics.totalFeesCollected)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Outstanding</p>
              <p className="mt-1 font-semibold text-amber-400">
                {formatCurrency(metrics.totalOutstandingFees)}
              </p>
            </div>
          </div>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
            Payment Status
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-foreground">
            Student distribution
          </h2>
          <div className="mt-5 space-y-3">
            {[
              ["Paid", metrics.paidStudents, "bg-emerald-400"],
              ["Partial", metrics.partialStudents, "bg-blue-400"],
              ["Unpaid", metrics.pendingStudents, "bg-amber-400"],
            ].map(([label, value, color]) => {
              const count = Number(value);
              const percentage = metrics.totalStudents
                ? Math.round((count / metrics.totalStudents) * 100)
                : 0;
              return (
                <div key={label as string}>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section
        className="mt-6 rounded-xl border border-border bg-card shadow-sm"
        aria-label="Outstanding Fees"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Fee Due</p>
            <h2 className="mt-1 font-display text-lg font-bold text-foreground">
              Outstanding students
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.print()}
              className="gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Printer className="size-3.5" /> Print
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1 text-xs text-cyan-400 hover:text-cyan-300"
            >
              <Link to="/students">
                View All <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
        {outstandingStudents.length > 0 ? (
          <div className="divide-y divide-border/60">
            {outstandingStudents.slice(0, 5).map(({ student, remaining }) => {
              const status = computeStudentStatus(student.totalFees, student.amountPaid);
              return (
                <div
                  key={student.id}
                  className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3.5 text-xs sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
                >
                  <div>
                    <p className="font-semibold text-foreground">{student.name}</p>
                    <p className="font-mono text-[11px] text-cyan-400">{student.id}</p>
                  </div>
                  <span className="hidden self-center text-muted-foreground sm:block">
                    {formatCurrency(student.totalFees)}
                  </span>
                  <span className="hidden self-center text-emerald-400 sm:block">
                    {formatCurrency(student.amountPaid)}
                  </span>
                  <span className="self-center font-semibold text-amber-400">
                    {formatCurrency(remaining)}
                  </span>
                  <span className="self-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-center text-[10px] text-amber-300">
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No outstanding balances. Every student is fully paid.
          </div>
        )}
      </section>

      {/* Recent Students Section */}
      <section id="recent-students-section" className="mt-8">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {/* Section Header with Controls */}
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-lg font-bold text-foreground">Recent Students</h2>
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                  {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Search, filter, view details, collect fees, and manage student records.
              </p>
            </div>

            {/* Actions: Search, Status Filters, View All */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1 sm:w-60 sm:flex-initial">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by ID, name, phone, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Group */}
              <div
                id="status-filter-group"
                className="flex rounded-lg border border-border bg-background/60 p-0.5"
              >
                {(["All", "Paid", "Partial", "Pending"] as const).map((filter) => {
                  const isActive = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      id={`filter-${filter.toLowerCase()}`}
                      onClick={() => setStatusFilter(filter)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
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

              {/* View All */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-9 gap-1 text-xs text-cyan-400 hover:text-cyan-300"
              >
                <Link to="/students">
                  <span>View All</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Student Table */}
          {filteredStudents.length > 0 ? (
            <div className="responsive-data-table overflow-x-auto">
              <table id="recent-students-table" className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3.5">Student ID</th>
                    <th className="px-5 py-3.5">Student Name</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Course / Class</th>
                    <th className="px-5 py-3.5 text-right">Total Fees</th>
                    <th className="px-5 py-3.5 text-right">Paid</th>
                    <th className="px-5 py-3.5 text-right">Remaining</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5">Saved At</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredStudents.slice(0, 10).map((s) => (
                    <tr
                      key={s.id}
                      id={`student-row-${s.id}`}
                      className="transition-colors hover:bg-muted/20"
                    >
                      {/* ID */}
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-semibold text-cyan-400">
                        {s.id}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="grid size-7 place-items-center rounded-full bg-cyan-500/10 text-xs font-semibold text-cyan-400">
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                          <span>{s.name}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-muted-foreground">
                        {s.phone || <span className="text-muted-foreground/40">—</span>}
                      </td>

                      {/* Course */}
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {s.course ? (
                          <span className="rounded-md border border-border/80 bg-muted/40 px-2 py-0.5">
                            {s.course}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Total Fees */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono text-xs font-semibold text-foreground">
                        {formatCurrency(s.totalFees)}
                      </td>

                      {/* Paid */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono text-xs font-semibold text-emerald-400">
                        {formatCurrency(s.amountPaid)}
                      </td>

                      {/* Remaining */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono text-xs font-semibold text-amber-400">
                        {formatCurrency(s.remainingFees)}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-center">
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

                      {/* Saved Time */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                          <Clock className="size-3 text-cyan-400 shrink-0" />
                          <span>{getStudentSavedAt(s)}</span>
                        </div>
                      </td>

                      {/* Actions for view/edit/delete/payment */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
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
                {students.length === 0 ? "No students enrolled yet" : "No matching students found"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {students.length === 0
                  ? "Your academy database is currently empty. Click 'Add Student' to register your first student."
                  : "Try adjusting your search criteria or resetting filters to see records."}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {(searchQuery || statusFilter !== "All") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("All");
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
      </section>

      {/* Modals for View, Quick Pay, Edit, Delete */}
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
