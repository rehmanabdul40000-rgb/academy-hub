import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { clearAdminSession, getStoredAdminSession } from "@/features/auth/auth.session";
import {
  getInitials,
  getSettings,
  type AcademySettings,
} from "@/features/settings/settings.storage";
import { getStudents } from "@/features/students/students.storage";
import { supabase } from "@/integrations/supabase/client";
import { exportAcademyToExcel } from "@/lib/excel-export";
import { Route as RootRoute } from "@/routes/__root";

const links = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/students" as const, label: "Students", icon: Users },
  { to: "/add-student" as const, label: "Add Student", icon: UserPlus },
  { to: "/settings" as const, label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  title,
  subtitle,
  onSearchChange,
  searchValue,
  showExport = true,
  showAddStudent = true,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  onSearchChange?: (val: string) => void;
  searchValue?: string;
  showExport?: boolean;
  showAddStudent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [settings, setSettings] = useState<AcademySettings>(getSettings());
  const navigate = useNavigate();
  const { queryClient } = RootRoute.useRouteContext();
  const session = getStoredAdminSession();

  useEffect(() => {
    setSettings(getSettings());
    function handleSettingsUpdate(e: Event) {
      const detail = (e as CustomEvent<AcademySettings>).detail;
      if (detail) {
        setSettings(detail);
      } else {
        setSettings(getSettings());
      }
    }
    window.addEventListener("academy-settings-updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("academy-settings-updated", handleSettingsUpdate);
    };
  }, []);

  const adminName = settings.adminDisplayName || session?.username || "Admin";
  const academyName = settings.academyName || "Academy Hub";

  async function handleLogout() {
    clearAdminSession();
    await queryClient.cancelQueries();
    queryClient.clear();
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignored
    }
    await navigate({ to: "/login", replace: true });
  }

  async function handleExport() {
    try {
      setIsExporting(true);
      const students = getStudents();
      await exportAcademyToExcel(students);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  }

  function handleHeaderSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(headerSearch);
    } else {
      navigate({ to: "/students" });
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar px-4 py-5 text-sidebar-foreground">
      {/* Brand */}
      <Link
        to="/dashboard"
        className="flex items-center gap-3 px-2 transition-opacity hover:opacity-90"
      >
        <div className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-sm">
          <GraduationCap className="size-5 text-cyan-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold tracking-wide text-foreground">
            {academyName}
          </p>
          <p className="text-[11px] text-cyan-400/80">Management Portal</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="mt-8 space-y-1.5" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            activeProps={{
              className:
                "bg-sidebar-accent text-cyan-400 font-semibold shadow-sm border border-cyan-500/20",
            }}
            inactiveProps={{
              className:
                "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            }}
            className="flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-colors"
          >
            <Icon className="size-[18px]" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Admin summary badge */}
      <div className="mt-auto space-y-3">
        <Link
          to="/settings"
          id="sidebar-admin-profile-card"
          className="block rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30 p-3 transition-colors hover:border-cyan-500/40"
          title={`Admin Profile: ${adminName}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-cyan-500/30 bg-cyan-950/50 text-xs font-bold text-cyan-300 shadow-sm">
              {getInitials(adminName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{adminName}</p>
              {settings.contactEmail ? (
                <p className="truncate text-[10px] text-muted-foreground">
                  {settings.contactEmail}
                </p>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-cyan-400">
                  <span className="size-1.5 rounded-full bg-cyan-400" />
                  Administrator
                </div>
              )}
            </div>
          </div>
        </Link>

        <div className="border-t border-sidebar-border pt-3">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="h-10 w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-[18px]" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border print:hidden lg:block">
        {sidebar}
      </aside>

      {/* Mobile Drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 border-r border-sidebar-border bg-sidebar shadow-2xl print:hidden">
            {sidebar}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </Button>
          </aside>
        </div>
      ) : null}

      {/* Content wrapper */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl print:hidden sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
              className="lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-cyan-400" />
              <span className="hidden font-display text-sm font-semibold tracking-wide text-foreground sm:inline">
                {academyName}
              </span>
              <span className="hidden text-muted-foreground sm:inline">•</span>
              <span className="text-xs font-medium text-muted-foreground">Workspace</span>
            </div>
          </div>

          {/* Header Actions: Search, Excel Export, Add Student, Admin Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick search input */}
            <form onSubmit={handleHeaderSearchSubmit} className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchValue !== undefined ? searchValue : headerSearch}
                onChange={(e) => {
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  } else {
                    setHeaderSearch(e.target.value);
                  }
                }}
                className="h-9 w-44 rounded-lg border border-input bg-card/60 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-muted-foreground focus:w-60 focus:border-cyan-500 focus:bg-card focus:ring-1 focus:ring-cyan-500/30"
              />
            </form>

            {/* Export to Excel */}
            {showExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                title="Export all student & fee reports to professional Excel workbook"
                className="h-9 gap-1.5 border-cyan-500/30 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/40 hover:text-cyan-300"
              >
                <FileSpreadsheet className="size-4" />
                <span className="hidden sm:inline">
                  {isExporting ? "Exporting..." : "Export to Excel"}
                </span>
                <span className="sm:hidden">Excel</span>
              </Button>
            )}

            {/* Add Student button */}
            {showAddStudent && (
              <Button
                asChild
                size="sm"
                className="h-9 gap-1.5 bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm"
              >
                <Link to="/add-student">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add Student</span>
                </Link>
              </Button>
            )}

            {/* Admin Avatar Button */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <Link
                to="/settings"
                id="header-admin-profile-btn"
                className="grid size-9 place-items-center rounded-full border border-cyan-500/40 bg-cyan-950/40 shadow-sm transition-all hover:border-cyan-400 hover:scale-105"
                title={`Admin Profile (${adminName})`}
              >
                <span className="text-xs font-bold text-cyan-300">{getInitials(adminName)}</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
