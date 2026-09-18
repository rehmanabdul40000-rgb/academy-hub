import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, FileSpreadsheet, GraduationCap, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, UserPlus, Users, X, UserRound, UserRoundCheck, Sun, Moon, Clock3, KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { clearAdminSession, getStoredAdminSession } from "@/features/auth/auth.session";
import { getInitials, getSettings, type AcademySettings } from "@/features/settings/settings.storage";
import { getStudents } from "@/features/students/students.storage";
import { can } from "@/features/auth/permissions";
import { getWorkspaceSections, getWorkspaceTheme, applyWorkspaceTheme, type WorkspaceSectionKey } from "@/features/workspace/workspace.storage";
import { supabase } from "@/integrations/supabase/client";
import { exportAcademyToExcel } from "@/lib/excel-export";
import { Route as RootRoute } from "@/routes/__root";

const links = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { to: "/students" as const, label: "All Students", icon: Users, permission: "studentsView" },
  { to: "/male-students" as const, label: "Male Students", icon: UserRound, permission: "studentsView" },
  { to: "/female-students" as const, label: "Female Students", icon: UserRoundCheck, permission: "studentsView" },
  { to: "/morning-students" as const, label: "Morning Shift", icon: Sun, permission: "studentsView" },
  { to: "/evening-students" as const, label: "Evening Shift", icon: Moon, permission: "studentsView" },
  { to: "/add-student" as const, label: "Add Student", icon: UserPlus, permission: "studentsSave" },
  { to: "/shifts" as const, label: "Shift Management", icon: Clock3, permission: "shiftManagement" },
  { to: "/users" as const, label: "Users & Permissions", icon: ShieldCheck, permission: "userManagement" },
  { to: "/change-password" as const, label: "Change Password", icon: KeyRound, permission: undefined },
  { to: "/settings" as const, label: "Settings", icon: Settings, permission: "settings" },
];

export function AppShell({ children, title, subtitle, onSearchChange, searchValue, showExport = true, showAddStudent = true }: { children: ReactNode; title: string; subtitle: string; onSearchChange?: (val: string) => void; searchValue?: string; showExport?: boolean; showAddStudent?: boolean; }) {
  const [open, setOpen] = useState(false); const [headerSearch, setHeaderSearch] = useState(""); const [isExporting, setIsExporting] = useState(false); const [settings, setSettings] = useState<AcademySettings>(getSettings());
  const [theme, setTheme] = useState(getWorkspaceTheme());
  const [sections, setSections] = useState(getWorkspaceSections());
  const navigate = useNavigate(); const { queryClient } = RootRoute.useRouteContext(); const session = getStoredAdminSession();
  useEffect(() => {
    setSettings(getSettings());
    setTheme(getWorkspaceTheme());
    applyWorkspaceTheme(getWorkspaceTheme());
    setSections(getWorkspaceSections());
    function handleSettingsUpdate(e: Event) { const detail = (e as CustomEvent<AcademySettings>).detail; setSettings(detail || getSettings()); }
    const onTheme = (e: Event) => setTheme((e as CustomEvent<"dark" | "light">).detail || getWorkspaceTheme());
    const onSections = () => setSections(getWorkspaceSections());
    window.addEventListener("academy-settings-updated", handleSettingsUpdate);
    window.addEventListener("academy-theme-updated", onTheme);
    window.addEventListener("academy-workspace-sections-updated", onSections);
    return () => {
      window.removeEventListener("academy-settings-updated", handleSettingsUpdate);
      window.removeEventListener("academy-theme-updated", onTheme);
      window.removeEventListener("academy-workspace-sections-updated", onSections);
    };
  }, []);
  const adminName = settings.adminDisplayName || session?.displayName || session?.username || "Admin"; const academyName = settings.academyName || "Academy Hub";
  const isAdmin = session?.id === "admin-workspace-session" || session?.role === "admin" || session?.role === "Admin";
  const sectionMap = new Map(sections.map((section) => [section.key, section.enabled]));
  const linkSection: Record<string, WorkspaceSectionKey> = { "/dashboard": "dashboard", "/students": "students", "/male-students": "maleStudents", "/female-students": "femaleStudents", "/morning-students": "morningShift", "/evening-students": "eveningShift", "/add-student": "addStudent", "/shifts": "shiftManagement", "/users": "userManagement", "/change-password": "changePassword", "/settings": "settings" };
  const visibleLinks = links.filter((link) => (sectionMap.get(linkSection[link.to]!) ?? true) && (isAdmin || !link.permission || session?.permissions?.[link.permission]));
  async function handleLogout() { clearAdminSession(); await queryClient.cancelQueries(); queryClient.clear(); try { await supabase.auth.signOut(); } catch {} await navigate({ to: "/login", replace: true }); }
  async function handleExport() { try { setIsExporting(true); await exportAcademyToExcel(getStudents(), { sections }); } catch (err) { console.error("Export error:", err); } finally { setIsExporting(false); } }
  function handleHeaderSearchSubmit(e: React.FormEvent) { e.preventDefault(); if (onSearchChange) onSearchChange(headerSearch); else navigate({ to: "/students" }); }
  const sidebar = <div className="flex h-full flex-col bg-sidebar px-4 py-5 text-sidebar-foreground">
    <Link to="/dashboard" className="flex items-center gap-3 px-2 transition-opacity hover:opacity-90"><div className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400"><GraduationCap className="size-5" /></div><div className="min-w-0"><p className="truncate font-display text-sm font-semibold tracking-wide text-foreground">{academyName}</p><p className="text-[11px] text-cyan-400/80">Management Portal</p></div></Link>
    <nav className="mt-8 flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Main navigation">{visibleLinks.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} activeProps={{ className: "bg-sidebar-accent text-cyan-400 font-semibold shadow-sm border border-cyan-500/20" }} inactiveProps={{ className: "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground" }} className="flex h-10 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-colors"><Icon className="size-[17px]" /><span>{label}</span></Link>)}</nav>
    <div className="mt-4 space-y-3"><Link to="/settings" className="block rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30 p-3"><div className="flex items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-cyan-500/30 bg-cyan-950/50 text-xs font-bold text-cyan-300">{getInitials(adminName)}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{adminName}</p><p className="text-[10px] text-cyan-400">{isAdmin ? "Administrator" : session?.role || "User"}</p></div></div></Link><div className="border-t border-sidebar-border pt-3"><Button variant="ghost" onClick={handleLogout} className="h-10 w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><LogOut className="size-[18px]" />Logout</Button></div></div>
  </div>;
  return <div className={`${theme} min-h-dvh bg-background text-foreground`}><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border print:hidden lg:block">{sidebar}</aside>{open ? <div className="fixed inset-0 z-40 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} /><aside className="relative h-full w-72 border-r border-sidebar-border bg-sidebar shadow-2xl print:hidden">{sidebar}<Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="size-5" /></Button></aside></div> : null}<div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl print:hidden sm:px-6 lg:px-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="lg:hidden"><Menu className="size-5" /></Button><div className="flex items-center gap-2"><BookOpen className="size-4 text-cyan-400" /><span className="hidden font-display text-sm font-semibold tracking-wide text-foreground sm:inline">{academyName}</span><span className="hidden text-muted-foreground sm:inline">•</span><span className="text-xs font-medium text-muted-foreground">Workspace</span></div></div><div className="flex items-center gap-2.5 sm:gap-3"><form onSubmit={handleHeaderSearchSubmit} className="relative hidden md:block"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Search students..." value={searchValue !== undefined ? searchValue : headerSearch} onChange={(e) => onSearchChange ? onSearchChange(e.target.value) : setHeaderSearch(e.target.value)} className="h-9 w-44 rounded-lg border border-input bg-card/60 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-muted-foreground focus:w-60 focus:border-cyan-500" /></form>{showExport && can("reports") && <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="h-9 gap-1.5 border-cyan-500/30 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/40"><FileSpreadsheet className="size-4" /><span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export to Excel"}</span><span className="sm:hidden">Excel</span></Button>}{showAddStudent && (isAdmin || session?.permissions?.studentsSave) && <Button asChild size="sm" className="h-9 gap-1.5 bg-cyan-600 text-white hover:bg-cyan-500"><Link to="/add-student"><Plus className="size-4" /><span className="hidden sm:inline">Add Student</span></Link></Button>}<Link to="/settings" className="grid size-9 place-items-center rounded-full border border-cyan-500/40 bg-cyan-950/40"><span className="text-xs font-bold text-cyan-300">{getInitials(adminName)}</span></Link></div></header><main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="mb-6"><h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>{children}</main></div></div>;
}
