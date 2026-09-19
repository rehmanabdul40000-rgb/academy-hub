import { useEffect, useMemo, useState } from "react";
import { Bot, Mic, MicOff, Send, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { addStudent, calculateMetrics, getStudents } from "@/features/students/students.storage";
import { speakAgentMessage, startAgentListening } from "@/features/agent/agent-voice";
import { exportAcademyToExcel } from "@/lib/excel-export";
import { getWorkspaceSections } from "@/features/workspace/workspace.storage";

type AgentMessage = { id: number; role: "user" | "agent"; text: string };
type StudentDraft = { id?: string; name?: string; gender?: "Male" | "Female"; phone?: string; course?: string; shift?: "morning" | "evening"; dateJoined?: string; totalFees?: string; amountPaid?: string; notes?: string };

const MESSAGE_KEY = "academy_hub_agent_messages_v3";
const DRAFT_KEY = "academy_hub_agent_student_draft_v2";
const OPTIONAL_DONE_KEY = "academy_hub_agent_optional_done_v1";
const OPEN_KEY = "academy_hub_agent_open_v2";
const LAST_SAVE_KEY = "academy_hub_agent_last_save_v1";
const DRAFT_EVENT = "academy-agent-draft-updated";

const routes = [
  { aliases: ["dashboard", "home"], to: "/dashboard", label: "Dashboard" },
  { aliases: ["all students", "student list", "students", "student section"], to: "/students", label: "All Students" },
  { aliases: ["male students", "male section", "male"], to: "/male-students", label: "Male Students" },
  { aliases: ["female students", "female section", "female"], to: "/female-students", label: "Female Students" },
  { aliases: ["morning shift", "morning students", "morning section", "mornig", "moring"], to: "/morning-students", label: "Morning Shift" },
  { aliases: ["evening shift", "evening students", "evening section", "evning"], to: "/evening-students", label: "Evening Shift" },
  { aliases: ["add student", "new student", "student add", "enroll student"], to: "/add-student", label: "Add Student" },
  { aliases: ["shift management", "shift manage", "shifts"], to: "/shifts", label: "Shift Management" },
  { aliases: ["users and permissions", "users & permissions", "user management", "permissions", "users"], to: "/users", label: "Users & Permissions" },
  { aliases: ["change password", "password"], to: "/change-password", label: "Change Password" },
  { aliases: ["settings", "setting", "seting", "seting section"], to: "/settings", label: "Settings" },
] as const;

function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function levenshtein(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) { const cur = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  }
  return row[b.length];
}
function findRoute(command: string) {
  const q = normalize(command);
  const exact = routes.find((route) => route.aliases.some((alias) => q.includes(normalize(alias))));
  if (exact) return exact;
  let best: (typeof routes)[number] | null = null; let score = Infinity;
  for (const route of routes) for (const alias of route.aliases) { const target = normalize(alias); const distance = levenshtein(q, target); const allowed = target.length <= 5 ? 1 : target.length <= 8 ? 2 : 3; if (distance <= allowed && distance < score) { best = route; score = distance; } }
  return best;
}
function readDraft(): StudentDraft { if (typeof window === "undefined") return {}; try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}") as StudentDraft; } catch { return {}; } }
function writeDraft(draft: StudentDraft) { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); window.dispatchEvent(new CustomEvent(DRAFT_EVENT, { detail: draft })); }
function readOptionalDone() { try { return JSON.parse(sessionStorage.getItem(OPTIONAL_DONE_KEY) || "[]") as string[]; } catch { return []; } }
function markOptionalDone(field: string) { sessionStorage.setItem(OPTIONAL_DONE_KEY, JSON.stringify(Array.from(new Set([...readOptionalDone(), field])))); }
function clearAgentDraft() { sessionStorage.removeItem(DRAFT_KEY); sessionStorage.removeItem(OPTIONAL_DONE_KEY); window.dispatchEvent(new CustomEvent(DRAFT_EVENT, { detail: {} })); }
function readMessages(): AgentMessage[] { try { return JSON.parse(localStorage.getItem(MESSAGE_KEY) || "[]") as AgentMessage[]; } catch { return []; } }
function saveMessages(messages: AgentMessage[]) { localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages.slice(-60))); }
function isGreeting(q: string) { return /^(hi|hello|hey|salam|assalam o alaikum|aoa|good morning|good afternoon|good evening)$/i.test(normalize(q)); }
function isSkip(q: string) { return /^(skip|none|blank|not now|leave it|no|no thanks)$/i.test(normalize(q)); }
function isPositive(q: string) { return /^(yes|yeah|yep|ok|okay|haan|han|ji|theek|save)$/i.test(normalize(q)); }
function nextStudentField(draft: StudentDraft) {
  if (!draft.id) return "id"; if (!draft.name) return "name"; if (!draft.gender) return "gender"; if (!draft.totalFees) return "totalFees";
  const done = new Set(readOptionalDone());
  for (const field of ["phone", "course", "shift", "dateJoined", "amountPaid", "notes"]) if (!done.has(field) && !draft[field as keyof StudentDraft]) return field;
  return null;
}
function questionFor(field: string | null) {
  const questions: Record<string, string> = { id: "Student ID kya hai?", name: "Student ka full name kya hai?", gender: "Gender Male ya Female?", totalFees: "Total fees kitni hain?", phone: "Phone / WhatsApp number? Nahi dena to skip bol dein.", course: "Course / Class kya hai? Nahi hai to skip bol dein.", shift: "Shift Morning ya Evening? Nahi hai to skip bol dein.", dateJoined: "Date joined kya hai? YYYY-MM-DD ya today bol sakte hain.", amountPaid: "Enrollment par kitni amount paid hui? Kuch nahi diya to skip bol dein.", notes: "Koi notes / remarks hain? Nahi hain to skip bol dein." };
  return field ? questions[field] : "Sari details complete hain. Save student bol dein.";
}
function parseExplicit(command: string, current: StudentDraft) {
  const q = command.trim(); const lower = q.toLowerCase(); const draft = { ...current }; const changed: string[] = [];
  const id = q.match(/(?:student\s*)?(?:id|i\.d\.)\s*[:#-]?\s*([\w-]+)/i);
  const name = q.match(/(?:student\s*)?(?:full\s*)?name\s*(?:(?:is|=|:)\s*)?(.+)$/i);
  const gender = lower.match(/\b(male|female)\b/);
  const phone = q.match(/(?:phone|whatsapp|contact)\s*(?:(?:is|=|:)\s*)?([+\d][\d\s-]{6,})/i);
  const course = q.match(/(?:course|class)\s*(?:(?:is|=|:)\s*)?(.+)$/i);
  const fees = q.match(/(?:total\s*)?(?:fees|fee)\s*(?:(?:are|is|=|:)\s*)?([\d,]+(?:\.\d+)?)/i);
  const paid = q.match(/(?:amount\s*)?(?:paid|payment)\s*(?:(?:is|=|:)\s*([\d,]+(?:\.\d+)?))/i);
  const date = q.match(/(?:date\s*joined|joined)\s*(?:(?:is|=|:)\s*)?(\d{4}-\d{2}-\d{2}|today)/i);
  const notes = q.match(/(?:notes|remark|remarks)\s*(?:(?:is|=|:)\s*)?(.+)$/i);
  if (id) { draft.id = id[1]; changed.push("Student ID"); }
  if (name) { draft.name = name[1].trim(); changed.push("name"); }
  if (gender) { draft.gender = gender[1].toLowerCase() === "male" ? "Male" : "Female"; changed.push("gender"); }
  if (phone) { draft.phone = phone[1].trim(); changed.push("phone"); markOptionalDone("phone"); }
  if (course) { draft.course = course[1].trim(); changed.push("course"); markOptionalDone("course"); }
  if (fees) { draft.totalFees = fees[1].replace(/,/g, ""); changed.push("total fees"); }
  if (paid) { draft.amountPaid = paid[1].replace(/,/g, ""); changed.push("amount paid"); markOptionalDone("amountPaid"); }
  if (date) { draft.dateJoined = date[1].toLowerCase() === "today" ? new Date().toISOString().slice(0, 10) : date[1]; changed.push("date joined"); markOptionalDone("dateJoined"); }
  if (notes) { draft.notes = notes[1].trim(); changed.push("notes"); markOptionalDone("notes"); }
  if (/\bmorning\b/i.test(lower)) { draft.shift = "morning"; changed.push("Morning Shift"); markOptionalDone("shift"); }
  if (/\bevening\b/i.test(lower)) { draft.shift = "evening"; changed.push("Evening Shift"); markOptionalDone("shift"); }
  return { draft, changed };
}
function applyExpected(command: string, field: string | null, current: StudentDraft) {
  if (!field) return { draft: current, changed: [] as string[], skipped: false };
  const q = command.trim(); const lower = q.toLowerCase(); const draft = { ...current };
  if (isSkip(q) && !["id", "name", "gender", "totalFees"].includes(field)) { markOptionalDone(field); return { draft, changed: [`${field} skipped`], skipped: true }; }
  if (field === "id" && /^[\w-]{1,40}$/.test(q)) { draft.id = q; return { draft, changed: ["Student ID"], skipped: false }; }
  if (field === "name" && q) { draft.name = q.replace(/^(student\s+name|name)\s*(is|=|:)\s*/i, "").trim(); return { draft, changed: ["name"], skipped: false }; }
  if (field === "gender" && /^(male|female)$/i.test(q)) { draft.gender = /^male$/i.test(q) ? "Male" : "Female"; return { draft, changed: ["gender"], skipped: false }; }
  if (field === "totalFees") { const value = q.replace(/[^\d.]/g, ""); if (value && !Number.isNaN(Number(value))) { draft.totalFees = value; return { draft, changed: ["total fees"], skipped: false }; } }
  if (field === "phone" && /^[+\d][\d\s-]{6,}$/.test(q)) { draft.phone = q; markOptionalDone(field); return { draft, changed: ["phone"], skipped: false }; }
  if (field === "course" && q) { draft.course = q; markOptionalDone(field); return { draft, changed: ["course"], skipped: false }; }
  if (field === "shift" && /^(morning|evening)$/i.test(q)) { draft.shift = /^morning$/i.test(q) ? "morning" : "evening"; markOptionalDone(field); return { draft, changed: [draft.shift === "morning" ? "Morning Shift" : "Evening Shift"], skipped: false }; }
  if (field === "dateJoined") { const value = /^today$/i.test(q) ? new Date().toISOString().slice(0, 10) : q; if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { draft.dateJoined = value; markOptionalDone(field); return { draft, changed: ["date joined"], skipped: false }; } }
  if (field === "amountPaid") { const value = q.replace(/[^\d.]/g, ""); if (value && !Number.isNaN(Number(value))) { draft.amountPaid = value; markOptionalDone(field); return { draft, changed: ["amount paid"], skipped: false }; } }
  if (field === "notes" && q) { draft.notes = q; markOptionalDone(field); return { draft, changed: ["notes"], skipped: false }; }
  return { draft: current, changed: [] as string[], skipped: false };
}

export function AcademyAgent() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => typeof window !== "undefined" && sessionStorage.getItem(OPEN_KEY) === "true");
  const [input, setInput] = useState(""); const [listening, setListening] = useState(false); const [draft, setDraft] = useState<StudentDraft>(readDraft());
  const [messages, setMessages] = useState<AgentMessage[]>(() => { const saved = readMessages(); return saved.length ? saved : [{ id: 1, role: "agent", text: "Assalam-o-alaikum Sir. What would you like to do?" }]; });
  const students = useMemo(() => getStudents(), [messages]); const metrics = calculateMetrics(students);
  useEffect(() => { const onDraft = (e: Event) => setDraft((e as CustomEvent<StudentDraft>).detail || readDraft()); window.addEventListener(DRAFT_EVENT, onDraft); return () => window.removeEventListener(DRAFT_EVENT, onDraft); }, []);
  function setAgentOpen(value: boolean) { setOpen(value); sessionStorage.setItem(OPEN_KEY, String(value)); }
  function answer(response: string, userText: string) { const next = [...messages, { id: Date.now(), role: "user" as const, text: userText }, { id: Date.now() + 1, role: "agent" as const, text: response }].slice(-60); setMessages(next); saveMessages(next); setInput(""); speakAgentMessage(response); }
  async function saveCurrentStudent(command: string) {
    const current = readDraft();
    const missing = nextStudentField(current);
    if (missing) return answer(`Student save nahi ho sakta. Abhi ${questionFor(missing)}`, command);
    const result = addStudent({
      id: current.id!,
      name: current.name!,
      gender: current.gender!,
      shift: current.shift === "morning" ? "Morning" : current.shift === "evening" ? "Evening" : undefined,
      phone: current.phone,
      course: current.course,
      dateJoined: current.dateJoined,
      totalFees: Number(current.totalFees),
      amountPaid: Number(current.amountPaid || 0),
      notes: current.notes,
    });
    if (!result.success) return answer(result.error || "Student save nahi ho saka.", command);
    clearAgentDraft();
    setDraft({});
    sessionStorage.setItem(LAST_SAVE_KEY, "true");
    await navigate({ to: "/students" });
    answer(`Student ${result.student?.name || current.name} successfully save ho gaya. All Students mein record available hai.`, command);
  }

  async function handleCommand(raw: string) {
    const command = raw.trim(); if (!command) return; const q = normalize(command);
    if (isGreeting(command)) return answer("Wa alaikum assalam Sir. How can I help?", command);
    if (isPositive(command) && sessionStorage.getItem(LAST_SAVE_KEY) === "true") { sessionStorage.removeItem(LAST_SAVE_KEY); return answer("Ji Sir, student already successfully save ho gaya hai.", command); }
    if (isPositive(command) && draft.id && draft.name && draft.gender && draft.totalFees && nextStudentField(draft) === null) return saveCurrentStudent(command);
    if (/^(help|what can you do|commands)$/i.test(q)) return answer("I can open any section, add students step-by-step, save records, check student/fee counts, and export Excel.", command);
    if (/\b(export|download)\b.*\b(excel|report)\b|\bexcel\b.*\b(download|export)\b/i.test(command)) { try { await exportAcademyToExcel(getStudents(), { sections: getWorkspaceSections() }); answer("Excel report downloaded.", command); } catch { answer("Excel export failed. Use Export to Excel once.", command); } return; }
    const route = findRoute(command);
    if (route && !/\b(add|new|enroll)\s+student\b/i.test(command)) { await navigate({ to: route.to as never }); return answer(`${route.label} open kar diya. Agent open rahega.`, command); }
    if (/\b(add|new|enroll)\s+student\b/i.test(command)) { clearAgentDraft(); setDraft({}); await navigate({ to: "/add-student" }); return answer("Add Student open hai. Student ID kya hai?", command); }
    const expected = nextStudentField(draft); const parsed = parseExplicit(command, draft); let nextDraft = parsed.draft; let changed = parsed.changed;
    if (!changed.length) { const applied = applyExpected(command, expected, draft); nextDraft = applied.draft; changed = applied.changed; }
    if (changed.length) { setDraft(nextDraft); writeDraft(nextDraft); await navigate({ to: "/add-student" }); const next = nextStudentField(nextDraft); if (!next) return saveCurrentStudent(command); return answer(`${changed.join(", ")} set. ${questionFor(next)}`, command); }
    if (/\b(how many|total|count)\b.*\bstudents?\b/i.test(command)) return answer(`Academy mein ${metrics.totalStudents} students hain.`, command);
    if (/\bpaid\s+students\b/i.test(command)) return answer(`${metrics.paidStudents} students fully paid hain.`, command);
    if (/\bpartial\s+students\b/i.test(command)) return answer(`${metrics.partialStudents} students partial payment par hain.`, command);
    if (/\b(unpaid|pending)\s+students\b/i.test(command)) return answer(`${metrics.pendingStudents} students ki payment pending hai.`, command);
    if (/\b(save|save this student)\b/i.test(command)) return saveCurrentStudent(command);
    return answer("Samajh gaya. Section ka naam ya student ki next detail bata dein.", command);
  }
  useEffect(() => { if (!listening) return; const stop = startAgentListening((text) => { setListening(false); void handleCommand(text); }, () => setListening(false)); return () => stop(); }, [listening]);
  return <div className="fixed bottom-4 right-4 z-[70] print:hidden">
    {open && <div className="mb-3 flex w-[min(94vw,400px)] flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border bg-cyan-950/30 px-4 py-3"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400"><Bot className="size-5" /></span><div><p className="text-sm font-semibold text-foreground">Academy Hub Agent</p><p className="text-[10px] text-muted-foreground">Full software assistant</p></div></div><Button variant="ghost" size="icon" onClick={() => setAgentOpen(false)} aria-label="Close agent"><X className="size-4" /></Button></div>
      <div className="max-h-[min(55vh,420px)] space-y-3 overflow-y-auto p-3">{messages.map((message) => <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}><div className={message.role === "user" ? "max-w-[88%] rounded-xl bg-cyan-600 px-3 py-2 text-xs leading-relaxed text-white" : "max-w-[88%] rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs leading-relaxed text-foreground"}>{message.text}</div></div>)}</div>
      <div className="border-t border-border p-3"><div className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleCommand(input); }} placeholder="Ask Academy Hub..." className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-cyan-500" /><Button onClick={() => void handleCommand(input)} size="icon" className="bg-cyan-600 text-white hover:bg-cyan-500" aria-label="Send"><Send className="size-4" /></Button><Button onClick={() => setListening((value) => !value)} size="icon" variant="outline" className={listening ? "border-destructive text-destructive" : ""} aria-label={listening ? "Stop voice input" : "Voice input"}>{listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}</Button></div><p className="mt-2 text-[10px] text-muted-foreground">{listening ? "Listening..." : "Type or use the microphone. Voice replies can be toggled from the top bar."}</p></div>
    </div>}
    {!open && <Button onClick={() => setAgentOpen(true)} className="h-12 rounded-full bg-cyan-600 px-4 text-white shadow-lg hover:bg-cyan-500" aria-label="Open Academy Hub Agent"><Bot className="mr-2 size-5" />Agent</Button>}
  </div>;
}