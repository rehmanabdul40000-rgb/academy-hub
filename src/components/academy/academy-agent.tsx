import { useState } from "react";
import { Bot, Send, X, Volume2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { calculateMetrics, getStudents } from "@/features/students/students.storage";
import { speakAgentMessage } from "@/features/agent/agent-voice";

type AgentMessage = {
  id: number;
  role: "user" | "agent";
  text: string;
};

function reply(text: string): string {
  const q = text.trim().toLowerCase();
  const students = getStudents();
  const metrics = calculateMetrics(students);

  if (!q) return "Sir, please tell me what you want me to do.";

  if (q.includes("how many") || q.includes("total students") || q.includes("student count")) {
    return `Sir, there are ${metrics.totalStudents} students in the academy records.`;
  }

  if (q.includes("paid students")) {
    return `Sir, ${metrics.paidStudents} students are fully paid.`;
  }

  if (q.includes("partial students")) {
    return `Sir, ${metrics.partialStudents} students have partial payments.`;
  }

  if (q.includes("pending students") || q.includes("unpaid students")) {
    return `Sir, ${metrics.pendingStudents} students are pending payment.`;
  }

  if (q.includes("male students")) {
    const count = students.filter((s) => s.gender === "Male").length;
    return `Sir, there are ${count} male students.`;
  }

  if (q.includes("female students")) {
    const count = students.filter((s) => s.gender === "Female").length;
    return `Sir, there are ${count} female students.`;
  }

  return "Sir, I can currently help with student counts, payment counts, gender counts, and navigation. Tell me for example: open students, add student, open settings, or how many students.";
}

export function AcademyAgent() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 1,
      role: "agent",
      text: "Assalam-o-alaikum Sir. Academy Hub Agent is ready. Tell me what you want to do.",
    },
  ]);

  function navigateCommand(command: string): boolean {
    const q = command.toLowerCase();

    if (q.includes("dashboard")) {
      void navigate({ to: "/dashboard" });
      return true;
    }
    if (q.includes("add student") || q.includes("new student")) {
      void navigate({ to: "/add-student" });
      return true;
    }
    if (q.includes("students") || q.includes("student list")) {
      void navigate({ to: "/students" });
      return true;
    }
    if (q.includes("settings")) {
      void navigate({ to: "/settings" });
      return true;
    }
    if (q.includes("male")) {
      void navigate({ to: "/male-students" });
      return true;
    }
    if (q.includes("female")) {
      void navigate({ to: "/female-students" });
      return true;
    }
    if (q.includes("morning")) {
      void navigate({ to: "/morning-students" });
      return true;
    }
    if (q.includes("evening")) {
      void navigate({ to: "/evening-students" });
      return true;
    }
    return false;
  }

  function submit() {
    const command = input.trim();
    if (!command) return;

    const userMessage: AgentMessage = { id: Date.now(), role: "user", text: command };
    let response: string;

    if (navigateCommand(command)) {
      if (command.toLowerCase().includes("dashboard")) response = "Sir, I am opening the Dashboard for you.";
      else if (command.toLowerCase().includes("settings")) response = "Sir, I am opening Settings for you.";
      else if (command.toLowerCase().includes("add student") || command.toLowerCase().includes("new student")) response = "Sir, I am opening Add Student for you.";
      else if (command.toLowerCase().includes("male")) response = "Sir, I am opening Male Students for you.";
      else if (command.toLowerCase().includes("female")) response = "Sir, I am opening Female Students for you.";
      else if (command.toLowerCase().includes("morning")) response = "Sir, I am opening Morning Shift for you.";
      else response = "Sir, I am opening Evening Shift for you.";
    } else {
      response = reply(command);
    }

    setMessages((current) => [
      ...current,
      userMessage,
      { id: Date.now() + 1, role: "agent", text: response },
    ]);
    setInput("");
    speakAgentMessage(response);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {open && (
        <div className="mb-3 flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-cyan-950/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Bot className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Academy Hub Agent</p>
                <p className="text-[10px] text-muted-foreground">Text + voice responses</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close agent">
              <X className="size-4" />
            </Button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto p-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    message.role === "user"
                      ? "bg-cyan-600 text-white"
                      : "border border-border bg-muted/30 text-foreground"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder="e.g. how many students?"
                className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-cyan-500"
              />
              <Button onClick={submit} size="icon" className="bg-cyan-600 text-white hover:bg-cyan-500" aria-label="Send agent command">
                <Send className="size-4" />
              </Button>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Volume2 className="size-3" /> Voice replies use your browser's speech engine.
            </p>
          </div>
        </div>
      )}

      <Button
        onClick={() => setOpen((value) => !value)}
        className="h-12 rounded-full bg-cyan-600 px-4 text-white shadow-lg hover:bg-cyan-500"
        aria-label="Open Academy Hub Agent"
      >
        <Bot className="mr-2 size-5" />
        Agent
      </Button>
    </div>
  );
}
