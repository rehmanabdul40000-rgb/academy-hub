import { createFileRoute, redirect } from "@tanstack/react-router";
import { Clock3, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/academy/app-shell";
import { can } from "@/features/auth/permissions";
import { isWorkspaceSectionEnabled } from "@/features/workspace/workspace.storage";
import { Button } from "@/components/ui/button";
import { getShifts, saveShifts, type AcademyShift } from "@/features/shifts/shifts.storage";

export const Route = createFileRoute("/_authenticated/shifts")({ beforeLoad: () => { if (!isWorkspaceSectionEnabled("shiftManagement") || !can("shiftManagement")) throw redirect({ to: "/dashboard" }); }, component: ShiftsPage });

function ShiftsPage() {
  const [shifts, setShifts] = useState<AcademyShift[]>(getShifts());
  const [draftName, setDraftName] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { const fn = () => setShifts(getShifts()); window.addEventListener("academy-shifts-updated", fn); return () => window.removeEventListener("academy-shifts-updated", fn); }, []);

  function addShift() {
    if (!draftName.trim() || !draftFrom || !draftTo) return;
    const next = [...shifts, { id: crypto.randomUUID(), name: draftName.trim(), fromTime: draftFrom, toTime: draftTo, active: true, updatedAt: new Date().toISOString() }];
    setShifts(saveShifts(next)); setDraftName(""); setDraftFrom(""); setDraftTo(""); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }
  function updateShift(id: string, field: keyof Pick<AcademyShift, "name" | "fromTime" | "toTime">, value: string) { setShifts((current) => current.map((s) => s.id === id ? { ...s, [field]: value } : s)); }
  function saveAll() { setShifts(saveShifts(shifts)); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  function removeShift(id: string) { if (shifts.length <= 1) return; setShifts(saveShifts(shifts.filter((s) => s.id !== id))); }

  return <AppShell title="Shift Management" subtitle="Define academy shifts once. Student entry will use the saved shift times automatically.">
    <div className="max-w-5xl space-y-6">
      {saved && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">Shift settings saved successfully.</div>}
      <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4"><span className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400"><Clock3 className="size-5" /></span><div><h2 className="font-display font-semibold">Create a Shift</h2><p className="text-xs text-muted-foreground">Enter the shift name and its fixed start/end time.</p></div></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_180px_180px_auto] sm:items-end">
          <label className="text-xs font-medium">Shift Name<input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Morning Shift" className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500" /></label>
          <label className="text-xs font-medium">From Time<input type="time" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500" /></label>
          <label className="text-xs font-medium">To Time<input type="time" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500" /></label>
          <Button onClick={addShift} className="h-10 bg-cyan-600 text-white hover:bg-cyan-500"><Plus className="mr-1.5 size-4" />Add Shift</Button>
        </div>
      </article>
      <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="font-display font-semibold">Saved Shifts</h2><p className="text-xs text-muted-foreground">These values are reused automatically when assigning a student.</p></div><Button onClick={saveAll} variant="outline" className="gap-2"><Save className="size-4" />Save Changes</Button></div>
        <div className="space-y-3">{shifts.map((shift) => <div key={shift.id} className="grid gap-3 rounded-xl border border-border bg-background/40 p-4 sm:grid-cols-[1fr_180px_180px_auto] sm:items-end">
          <label className="text-xs font-medium">Shift Name<input value={shift.name} onChange={(e) => updateShift(shift.id, "name", e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500" /></label>
          <label className="text-xs font-medium">From Time<input type="time" value={shift.fromTime} onChange={(e) => updateShift(shift.id, "fromTime", e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500" /></label>
          <label className="text-xs font-medium">To Time<input type="time" value={shift.toTime} onChange={(e) => updateShift(shift.id, "toTime", e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-cyan-500" /></label>
          <Button variant="ghost" size="icon" onClick={() => removeShift(shift.id)} title="Delete shift" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button>
        </div>)}</div>
      </article>
    </div>
  </AppShell>;
}
