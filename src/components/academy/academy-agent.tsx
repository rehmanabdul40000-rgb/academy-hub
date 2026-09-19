import { useEffect, useState } from "react";
import { Bot, Send, X, Volume2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { calculateMetrics, getStudents } from "@/features/students/students.storage";
import { speakAgentMessage } from "@/features/agent/agent-voice";

type AgentMessage = { id: number; role: "user" | "agent"; text: string };
type StudentDraft = { id?: string; name?: string; gender?: "Male" | "Female"; phone?: string; course?: string; shift?: "morning" | "evening"; dateJoined?: string; totalFees?: string; amountPaid?: string; notes?: string };

const MESSAGE_KEY = "academy_hub_agent_messages_v2";
const DRAFT_KEY = "academy_hub_agent_student_draft_v1";
const DRAFT_EVENT = "academy-agent-draft-updated";

function readDraft(): StudentDraft {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}") as StudentDraft; } catch { return {}; }
}
function writeDraft(draft: StudentDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  window.dispatchEvent(new CustomEvent(DRAFT_EVENT, { detail: draft }));
}
function readMessages(): AgentMessage[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(MESSAGE_KEY) || "[]") as AgentMessage[]; } catch { return []; }
}
function saveMessages(messages: AgentMessage[]) { localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages.slice(-40))); }

function reply(text: string): string {
  const q = text.trim().toLowerCase();
  const students = getStudents();
  const metrics = calculateMetrics(students);
  if (!q) return "Sir, please tell me what you want me to do.";
  if (/^(write|enter|fill)\s+(the\s+)?student\s+name$/i.test(q) || /^student\s+name$/i.test(q)) return "Ji Sir, student ka full name bata dein. Example: student name Ali Khan.";
  if (/^(write|enter|fill)\s+(the\s+)?student\s+id$/i.test(q) || /^student\s+id$/i.test(q)) return "Ji Sir, Student ID bata dein. Example: student id 01.";
  if (q.includes("how many") || q.includes("total students") || q.includes("student count")) return `Sir, there are ${metrics.totalStudents} students in the academy records.`;
  if (q.includes("paid students")) return `Sir, ${metrics.paidStudents} students are fully paid.`;
  if (q.includes("partial students")) return `Sir, ${metrics.partialStudents} students have partial payments.`;
  if (q.includes("pending students") || q.includes("unpaid students")) return `Sir, ${metrics.pendingStudents} students are pending payment.`;
  if (q.includes("male students")) return `Sir, there are ${students.filter((s) => s.gender === "Male").length} male students.`;
  if (q.includes("female students")) return `Sir, there are ${students.filter((s) => s.gender === "Female").length} female students.`;
  return "Sir, I can open every Academy Hub section and I can also enter student data for you. For a new student say: “add student”, then “student id 01”, “student name Ali”, “gender male”, “course Mathematics”, “fees 25000”, and finally “save student”.";
}

function parseStudentCommand(command: string, current: StudentDraft): { draft: StudentDraft; changed: string[] } {
  const q = command.trim();
  const lower = q.toLowerCase();
  const draft: StudentDraft = { ...current };
  const changed: string[] = [];
  const id = q.match(/(?:student\s*)?(?:id|i\.d\.)\s*[:#-]?\s*([\w-]+)/i);
  const name = q.match(/(?:student\s*)?(?:full\s*)?name\s*(?:(?:is|=|:)\s*)?(.+)$/i);
  const gender = lower.match(/\b(male|female)\b/);
  const phone = q.match(/(?:phone|whatsapp|contact)\s*(?:(?:is|=|:)\s*)?([+\d][\d\s-]{6,})/i);
  const course = q.match(/(?:course|class)\s*(?:is|=|:)\s*(.+)$/i) || q.match(/^course\s+(.+)$/i);
  const fees = q.match(/(?:total\s*)?(?:fees|fee)\s*(?:are|is|=|:)\s*([\d,]+(?:\.\d+)?)/i);
  const paid = q.match(/(?:amount\s*)?(?:paid|payment)\s*(?:is|=|:)\s*([\d,]+(?:\.\d+)?)/i);
  const date = q.match(/(?:date\s*joined|joined)\s*(?:is|=|:)\s*(\d{4}-\d{2}-\d{2})/i);
  const notes = q.match(/(?:notes|remark|remarks)\s*(?:is|=|:)\s*(.+)$/i);
  if (id) { draft.id = id[1]; changed.push(`Student ID ${id[1]}`); }
  if (name) { draft.name = name[1].trim(); changed.push(`name ${draft.name}`); }
  if (gender) { draft.gender = gender[1].toLowerCase() === "male" ? "Male" : "Female"; changed.push(`gender ${draft.gender}`); }
  if (phone) { draft.phone = phone[1].trim(); changed.push("phone"); }
  if (course) { draft.course = course[1].trim(); changed.push(`course ${draft.course}`); }
  if (fees) { draft.totalFees = fees[1].replace(/,/g, ""); changed.push(`total fees ${draft.totalFees}`); }
  if (paid) { draft.amountPaid = paid[1].replace(/,/g, ""); changed.push(`paid ${draft.amountPaid}`); }
  if (date) { draft.dateJoined = date[1]; changed.push(`date joined ${draft.dateJoined}`); }
  if (notes) { draft.notes = notes[1].trim(); changed.push("notes"); }
  if (/\bmorning\b/i.test(lower)) { draft.shift = "morning"; changed.push("Morning Shift"); }
  if (/\bevening\b/i.test(lower)) { draft.shift = "evening"; changed.push("Evening Shift"); }
  return { draft, changed };
}

export function AcademyAgent() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<StudentDraft>(readDraft());
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    const saved = readMessages();
    return saved.length ? saved : [{ id: 1, role: "agent", text: "Assalam-o-alaikum Sir. Academy Hub Agent is ready. Tell me what you want to do." }];
  });

  useEffect(() => {
    const onDraft = (e: Event) => setDraft((e as CustomEvent<StudentDraft>).detail || readDraft());
    window.addEventListener(DRAFT_EVENT, onDraft);
    return () => window.removeEventListener(DRAFT_EVENT, onDraft);
  }, []);

  function addMessages(items: AgentMessage[]) {
    setMessages((current) => {
      const next = [...current, ...items].slice(-40);
      saveMessages(next);
      return next;
    });
  }

  function navigateCommand(command: string): string | null {
    const q = command.toLowerCase();
    const routes: Array<[string, string, string]> = [
      ["dashboard", "/dashboard", "Dashboard"], ["all students", "/students", "All Students"], ["student list", "/students", "All Students"], ["students", "/students", "All Students"],
      ["male", "/male-students", "Male Students"], ["female", "/female-students", "Female Students"], ["morning", "/morning-students", "Morning Shift"], ["evening", "/evening-students", "Evening Shift"],
      ["add student", "/add-student", "Add Student"], ["new student", "/add-student", "Add Student"], ["shift management", "/shifts", "Shift Management"], ["shifts", "/shifts", "Shift Management"],
      ["users", "/users", "Users & Permissions"], ["permissions", "/users", "Users & Permissions"], ["change password", "/change-password", "Change Password"], ["settings", "/settings", "Settings"],
    ];
    const found = routes.find(([phrase]) => q.includes(phrase));
    if (!found) return null;
    void navigate({ to: found[1] as never });
    return found[2];
  }

  function submit() {
    const command = input.trim();
    if (!command) return;
    const userMessage: AgentMessage = { id: Date.now(), role: "user", text: command };
    const lower = command.toLowerCase();
    let response = "";
    const section = navigateCommand(command);

    if (section) {
      response = section === "Add Student"
        ? "Sir, Add Student is open. Ab aap student ki details mujhe ek ek karke bol sakte hain — for example “student id 01”, “student name Ali”, “gender male”, “fees 25000”. Jab complete ho to “save student” bolna."
        : `Sir, ${section} is open for you.`;
    }

    const { draft: parsedDraft, changed } = parseStudentCommand(command, draft);
    if (changed.length) {
      setDraft(parsedDraft);
      writeDraft(parsedDraft);
      response = `Sir, ${changed.join(", ")} set kar diya. ${parsedDraft.id && parsedDraft.name ? "Student details are coming together. " : ""}Next detail bata dein, ya “save student” bol dein jab form complete ho.`;
      if (!section) void navigate({ to: "/add-student" });
    }

    if (lower.includes("save student") || lower.includes("save this student") || lower === "save") {
      const finalDraft = readDraft();
      if (!finalDraft.id || !finalDraft.name || !finalDraft.totalFees) {
        response = "Sir, save karne se pehle Student ID, Student Name aur Total Fees chahiye. Jo missing hai woh bata dein.";
      } else {
        writeDraft(finalDraft);
        void navigate({ to: "/add-student" });
        sessionStorage.setItem("academy_hub_agent_save_requested_v1", "true");
        window.dispatchEvent(new CustomEvent("academy-agent-save-student"));
        response = "Sir, complete student data form mein load kar diya hai aur Save Student action start kar diya hai.";
      }
    }

    if (!section && !changed.length && !lower.includes("save")) response = reply(command);
    addMessages([userMessage, { id: Date.now() + 1, role: "agent", text: response }]);
    setInput("");
    speakAgentMessage(response);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {open && (
        <div className="mb-3 flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-cyan-950/30 px-4 py-3">
            <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400"><Bot className="size-5" /></span><div><p className="text-sm font-semibold text-foreground">Academy Hub Agent</p><p className="text-[10px] text-muted-foreground">Navigation + student form assistant</p></div></div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close agent"><X className="size-4" /></Button>
          </div>
          <div className="max-h-80 space-y-3 overflow-y-auto p-3">
            {messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${message.role === "user" ? "bg-cyan-600 text-white" : "border border-border bg-muted/30 text-foreground"}`}>{message.text}</div></div>)}
          </div>
          <div className="border-t border-border p-3"><div className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="e.g. student id 01" className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-cyan-500" /><Button onClick={submit} size="icon" className="bg-cyan-600 text-white hover:bg-cyan-500" aria-label="Send agent command"><Send className="size-4" /></Button></div><p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><Volume2 className="size-3" /> Voice replies use your browser speech engine.</p></div>
        </div>
      )}
      <Button onClick={() => setOpen((value) => !value)} className="h-12 rounded-full bg-cyan-600 px-4 text-white shadow-lg hover:bg-cyan-500" aria-label="Open Academy Hub Agent"><Bot className="mr-2 size-5" />Agent</Button>
    </div>
  );
}
