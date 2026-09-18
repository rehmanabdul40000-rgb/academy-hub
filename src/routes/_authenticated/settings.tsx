import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  Coins,
  Database,
  FileSpreadsheet,
  GraduationCap,
  Eye,
  EyeOff,
  Save,
  ShieldCheck, Sun, Moon, Power, Upload , UserRound, UserRoundCheck,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/academy/app-shell";
import { can } from "@/features/auth/permissions";
import { Button } from "@/components/ui/button";
import {
  getSettings,
  saveSettings,
  type AcademySettings,
} from "@/features/settings/settings.storage";
import { getStudents, addStudent } from "@/features/students/students.storage";
import {
  getDeletedStudents,
  restoreDeletedStudent,
  type DeletedStudentRecord,
} from "@/features/students/recovery.storage";
import { exportAcademyToExcel } from "@/lib/excel-export";
import { parseStudentImportFile } from "@/lib/student-import";
import { getWorkspaceSections, saveWorkspaceSections, getWorkspaceTheme, applyWorkspaceTheme, type WorkspaceSection } from "@/features/workspace/workspace.storage";
import {
  downloadWorkspaceBackup,
  parseWorkspaceBackup,
  restoreWorkspaceBackup,
} from "@/lib/workspace-backup";

export const Route = createFileRoute("/_authenticated/settings")({
  beforeLoad: () => { if (!can("settings")) throw redirect({ to: "/dashboard" }); },
  head: () => ({
    meta: [
      { title: "Settings — Academy Hub" },
      { name: "description", content: "Configure academy preferences and administration." },
      { property: "og:title", content: "Settings — Academy Hub" },
      { property: "og:description", content: "Configure academy preferences and administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<AcademySettings>(getSettings());
  const [isExporting, setIsExporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [backupError, setBackupError] = useState("");
  const [deletedStudents, setDeletedStudents] = useState<DeletedStudentRecord[]>(getDeletedStudents());
  const [workspaceSections, setWorkspaceSections] = useState<WorkspaceSection[]>(getWorkspaceSections());
  const [theme, setTheme] = useState(getWorkspaceTheme());
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [academyName, setAcademyName] = useState(settings.academyName);
  const [adminDisplayName, setAdminDisplayName] = useState(settings.adminDisplayName);
  const [adminUsername, setAdminUsername] = useState(settings.adminUsername);
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || "");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [currencyLabel, setCurrencyLabel] = useState(settings.currencyLabel || "Rs");
  const [academicSession, setAcademicSession] = useState(settings.academicSession || "2025-2026");
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || "");
  const [address, setAddress] = useState(settings.address || "");

  const students = getStudents();

  useEffect(() => {
    const s = getSettings();
    setDeletedStudents(getDeletedStudents());
    setWorkspaceSections(getWorkspaceSections());
    setTheme(getWorkspaceTheme());
    setSettings(s);
    setAcademyName(s.academyName);
    setAdminDisplayName(s.adminDisplayName);
    setAdminUsername(s.adminUsername);
    setAdminPassword(s.adminPassword || "");
    setShowAdminPassword(false);
    setCurrencyLabel(s.currencyLabel || "Rs");
    setAcademicSession(s.academicSession || "2025-2026");
    setContactEmail(s.contactEmail || "");
    setContactPhone(s.contactPhone || "");
    setAddress(s.address || "");
    const onTheme = (e: Event) => setTheme((e as CustomEvent<"dark" | "light">).detail || getWorkspaceTheme());
    const onSections = () => setWorkspaceSections(getWorkspaceSections());
    window.addEventListener("academy-theme-updated", onTheme);
    window.addEventListener("academy-workspace-sections-updated", onSections);
    const handleRecoveryUpdate = () => setDeletedStudents(getDeletedStudents());
    window.addEventListener("academy-recovery-updated", handleRecoveryUpdate);
    return () => { window.removeEventListener("academy-recovery-updated", handleRecoveryUpdate); window.removeEventListener("academy-theme-updated", onTheme); window.removeEventListener("academy-workspace-sections-updated", onSections); };
  }, []);

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    const updated = saveSettings({
      academyName: academyName.trim() || settings.academyName,
      adminDisplayName: adminDisplayName.trim() || settings.adminDisplayName,
      adminUsername: adminUsername.trim() || settings.adminUsername,
      adminPassword: adminPassword.trim() || settings.adminPassword,
      currencyLabel: currencyLabel.trim() || settings.currencyLabel,
      academicSession: academicSession.trim() || settings.academicSession,
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      address: address.trim(),
    });

    setSettings(updated);
    setShowAdminPassword(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  }

  async function handleExport() {
    try {
      setIsExporting(true);
      await exportAcademyToExcel(students, { sections: workspaceSections });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleRestore(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const backup = parseWorkspaceBackup(await file.text());
      const confirmed = window.confirm(
        `Restore ${backup.students.length} student records and the saved workspace settings? A safety backup will be downloaded first.`,
      );
      if (!confirmed) return;
      downloadWorkspaceBackup();
      restoreWorkspaceBackup(backup);
      setSettings(backup.settings);
      setAcademyName(backup.settings.academyName);
      setAdminDisplayName(backup.settings.adminDisplayName);
      setAdminUsername(backup.settings.adminUsername);
      setAdminPassword(backup.settings.adminPassword);
      setCurrencyLabel(backup.settings.currencyLabel);
      setAcademicSession(backup.settings.academicSession);
      setContactEmail(backup.settings.contactEmail || "");
      setContactPhone(backup.settings.contactPhone || "");
      setAddress(backup.settings.address || "");
      setBackupError("");
      setSaveSuccess(true);
    } catch (error) {
      setBackupError(
        error instanceof Error ? error.message : "Unable to restore this backup file.",
      );
    }
  }

  return (
    <AppShell
      title="Settings & Workspace"
      subtitle="Configure academy branding, admin profile, tuition currency, and data backups."
    >
      <div className="max-w-4xl space-y-6">
        {saveSuccess && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>
              Settings saved successfully. All changes have been applied across your workspace.
            </span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Card 1: Academy & Institution Branding */}
          <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
                <Building2 className="size-5" />
              </span>
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  Academy &amp; Institutional Profile
                </h2>
                <p className="text-xs text-muted-foreground">
                  Branding displayed across the application, reports, and Excel sheets.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Academy / Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="e.g. Elite Academy"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Appears in header, navigation, and export documents.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Academic Session / Year
                </label>
                <input
                  type="text"
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  placeholder="e.g. 2025-2026"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Currency Symbol / Label
                </label>
                <input
                  type="text"
                  value={currencyLabel}
                  onChange={(e) => setCurrencyLabel(e.target.value)}
                  placeholder="e.g. Rs or PKR"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Prefix used in fee figures (e.g. Rs 25,000).
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="admin@academyhub.pk"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Campus / Academy Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sector F-7, Islamabad"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>
          </article>

          {/* Card 2: Administrator Security & Credentials */}
          <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  Admin Profile &amp; Authentication
                </h2>
                <p className="text-xs text-muted-foreground">
                  Custom administrator display name, username, and login access.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-foreground">Admin Display Name *</label>
                <input
                  type="text"
                  required
                  value={adminDisplayName}
                  onChange={(e) => setAdminDisplayName(e.target.value)}
                  placeholder="e.g. Principal Khan"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Displayed in sidebar and top header profile.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Admin Username *</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Used for private login authentication.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Admin Password</label>
                <div className="relative mt-1">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 font-mono text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    aria-label={showAdminPassword ? "Hide admin password" : "Show admin password"}
                    aria-pressed={showAdminPassword}
                    title={showAdminPassword ? "Hide admin password" : "Show admin password"}
                    onClick={() => setShowAdminPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                  >
                    {showAdminPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Custom password for secure sign-in.
                </p>
              </div>
            </div>
          </article>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm"
            >
              <Save className="size-4" />
              Save Workspace Settings
            </Button>
          </div>
        </form>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400"><Power className="size-5" /></span>
            <div><h2 className="font-display font-semibold text-foreground">Workspace Sections & Theme</h2><p className="text-xs text-muted-foreground">Disable any section you do not use. Disabled sections are hidden and excluded from Excel exports.</p></div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceSections.map((section) => (
              <label key={section.key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-3 text-sm">
                <span>{section.label}</span>
                <input type="checkbox" checked={section.enabled} onChange={(e) => {
                  const next = workspaceSections.map((item) => item.key === section.key ? { ...item, enabled: e.target.checked } : item);
                  setWorkspaceSections(next); saveWorkspaceSections(next);
                }} className="size-4 accent-cyan-500" />
              </label>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
            <div className="mb-3 text-sm font-semibold">Theme</div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={theme === "dark" ? "default" : "outline"} onClick={() => { setTheme("dark"); applyWorkspaceTheme("dark"); }} className="gap-2"><Moon className="size-4" />Dark</Button>
              <Button type="button" variant={theme === "light" ? "default" : "outline"} onClick={() => { setTheme("light"); applyWorkspaceTheme("light"); }} className="gap-2"><Sun className="size-4" />Light</Button>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400"><Upload className="size-5" /></span>
            <div><h2 className="font-display font-semibold text-foreground">Import Student Data</h2><p className="text-xs text-muted-foreground">Import Excel (.xlsx) or CSV files. The first worksheet is read and common Academy Hub column names are supported.</p></div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; setImportMessage(""); setIsImporting(true);
              try {
                const result = await parseStudentImportFile(file); let imported = 0; let skipped = 0;
                const existing = new Set(getStudents().map((student) => student.id.toLowerCase()));
                for (const row of result.rows) { if (existing.has(row.id.toLowerCase())) { skipped += 1; continue; } const saved = addStudent(row); if (saved.success) { imported += 1; existing.add(row.id.toLowerCase()); } else skipped += 1; }
                setImportMessage(`Import complete: ${imported} added, ${skipped} skipped, ${result.errors.length} invalid rows.`);
              } catch (error) { setImportMessage(error instanceof Error ? error.message : "Unable to import this file."); } finally { setIsImporting(false); }
            }} />
            <Button type="button" onClick={() => importInputRef.current?.click()} disabled={isImporting} className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500"><Upload className="size-4" />{isImporting ? "Importing..." : "Import Excel / CSV"}</Button>
            {importMessage && <p className="text-xs text-cyan-300">{importMessage}</p>}
          </div>
        </article>

        {/* Card 3: Data Management & Backup */}
        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <Database className="size-5" />
            </span>
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Data Management &amp; Excel Backup
              </h2>
              <p className="text-xs text-muted-foreground">
                Export comprehensive student workbooks. Records are securely stored locally.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Current Records:{" "}
                <span className="font-bold text-cyan-400">{students.length} students</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Only your manually registered students are included in exports.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="gap-1.5 border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/40 hover:text-cyan-300"
            >
              <FileSpreadsheet className="size-4" />
              {isExporting ? "Generating..." : "Download Excel Report"}
            </Button>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <Database className="size-5" />
            </span>
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Workspace Backup &amp; Restore
              </h2>
              <p className="text-xs text-muted-foreground">
                Save students, payments, settings, and fee information as a portable JSON backup.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Restore validates the file and downloads a safety backup before replacing workspace
              data.
              {backupError ? <p className="mt-1 text-destructive">{backupError}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={downloadWorkspaceBackup}>
                Download Backup
              </Button>
              <input
                ref={backupInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleRestore}
              />
              <Button type="button" size="sm" onClick={() => backupInputRef.current?.click()}>
                Restore Backup
              </Button>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Recently Deleted Students
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Deleted records remain recoverable with their original fees, notes, and payment
                history.
              </p>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
              {deletedStudents.length}
            </span>
          </div>
          {deletedStudents.length > 0 ? (
            <div className="mt-4 space-y-2">
              {deletedStudents.map((record) => (
                <div
                  key={record.recoveryId}
                  className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {record.student.name}
                    </p>
                    <p className="font-mono text-[11px] text-cyan-400">{record.student.id}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Deleted {record.deletedDate}, {record.deletedTime} · Paid{" "}
                      {record.student.amountPaid} · Remaining {record.student.remainingFees}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="shrink-0 bg-cyan-600 text-white hover:bg-cyan-500"
                    onClick={() => {
                      const result = restoreDeletedStudent(record.recoveryId);
                      if (result.success) {
                        setRecoverySuccess(true);
                        setBackupError("");
                      } else setBackupError(result.error || "Unable to restore this student.");
                    }}
                  >
                    Restore Student
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">No recently deleted students.</p>
          )}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {(["Male", "Female"] as const).map((gender) => {
              const records = deletedStudents.filter((record) => record.student.gender === gender);
              return <article key={gender} className="rounded-xl border border-border bg-background/30 p-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold">{gender === "Male" ? <UserRound className="size-4 text-cyan-400" /> : <UserRoundCheck className="size-4 text-cyan-400" />}{gender} Deleted Records</div><span className="rounded-full border border-amber-500/30 px-2 py-1 text-xs">{records.length}</span></div>
                <div className="mt-3 space-y-2">{records.length ? records.map((record) => <div key={record.recoveryId} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5"><div className="min-w-0"><p className="truncate text-xs font-semibold">{record.student.name}</p><p className="font-mono text-[10px] text-cyan-400">{record.student.id}</p></div><Button type="button" size="sm" variant="outline" onClick={() => { const result = restoreDeletedStudent(record.recoveryId); if (result.success) setRecoverySuccess(true); }}>{`Restore ${gender}`}</Button></div>) : <p className="text-xs text-muted-foreground">No deleted {gender.toLowerCase()} records.</p>}</div>
              </article>;
            })}
          </div>
          {recoverySuccess ? (
            <p className="mt-3 text-xs font-medium text-emerald-400">
              Student restored successfully and returned to the active Students list.
            </p>
          ) : null}
        </article>
      </div>
    </AppShell>
  );
}
