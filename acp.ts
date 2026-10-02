import type {
  AvailableCommand,
  PlanEntry,
  PlanEntryPriority,
  PlanEntryStatus,
  SessionMode,
  SessionModeId,
  ToolCallStatus,
  ToolKind,
} from "./types";

export const PROTOCOL_VERSION = 1 as const;
export const AGENT_NAME = "Glass";
export const MODEL_NAME = "grok-4.5";

export const SESSION_MODES: SessionMode[] = [
  {
    id: "ask",
    name: "Ask",
    description: "Read-only answers. Search the web when facts may have moved.",
  },
  {
    id: "plan",
    name: "Plan",
    description: "Research and stage work. No code execution.",
  },
  {
    id: "agent",
    name: "Agent",
    description: "Search, reason, and run Python to verify.",
  },
];

export const SLASH_COMMANDS: AvailableCommand[] = [
  {
    name: "search",
    description: "Search the live web",
    input: { hint: "query" },
  },
  {
    name: "plan",
    description: "Draft a multi-step plan",
    input: { hint: "goal" },
  },
  {
    name: "code",
    description: "Think with Python",
    input: { hint: "task" },
  },
  {
    name: "ask",
    description: "Answer without running code",
  },
];

export function isModeId(value: string): value is SessionModeId {
  return value === "ask" || value === "plan" || value === "agent";
}

export function kindFromName(name: string): ToolKind {
  const n = name.toLowerCase();
  if (n.includes("web") || n.includes("search") || n.includes("browse")) {
    return "search";
  }
  if (n.includes("fetch") || n.includes("http")) return "fetch";
  if (n.includes("code") || n.includes("python") || n.includes("interpreter")) {
    return "execute";
  }
  if (n.includes("plan") || n.includes("think") || n.includes("reason")) {
    return "think";
  }
  if (n.includes("read") || n.includes("open") || n.includes("file")) return "read";
  if (n.includes("edit") || n.includes("write") || n.includes("patch")) return "edit";
  if (n.includes("mode")) return "switch_mode";
  return "other";
}

export function titleFor(kind: ToolKind, name: string): string {
  if (kind === "search") return "Web search";
  if (kind === "fetch") return "Fetch";
  if (kind === "execute") return "Code execution";
  if (kind === "think") return "Plan";
  if (kind === "read") return "Read";
  if (kind === "edit") return "Edit";
  if (kind === "switch_mode") return "Switch mode";
  return name || "Tool";
}

export function statusFromEvent(event: string): ToolCallStatus {
  if (event.includes("failed") || event.includes("error")) return "failed";
  if (event.includes("completed") || event.includes("done")) return "completed";
  if (event.includes("pending") || event.includes("in_progress")) {
    return event.includes("pending") ? "pending" : "in_progress";
  }
  return "in_progress";
}

function asPriority(value: string): PlanEntryPriority {
  const v = value.toLowerCase();
  if (v === "high" || v === "medium" || v === "low") return v;
  return "medium";
}

function asStatus(value: string): PlanEntryStatus {
  const v = value.toLowerCase().replace("-", "_");
  if (v === "pending" || v === "in_progress" || v === "completed") return v;
  if (v === "done" || v === "complete") return "completed";
  if (v === "doing" || v === "active") return "in_progress";
  return "pending";
}

export function parsePlanBody(body: string): PlanEntry[] {
  const entries: PlanEntry[] = [];
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim().replace(/^[-*]\s*/, "");
    if (!line) continue;
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length >= 3) {
      const [priority, status, ...rest] = parts;
      const content = rest.join("|").trim();
      if (!content) continue;
      entries.push({
        priority: asPriority(priority ?? "medium"),
        status: asStatus(status ?? "pending"),
        content,
      });
      continue;
    }
    entries.push({
      content: line,
      priority: "medium",
      status: "pending",
    });
  }
  return entries.slice(0, 12);
}

const PLAN_FENCE = /```plan\s*\n([\s\S]*?)```/;

export function splitPlanFence(raw: string): {
  text: string;
  plan?: PlanEntry[];
} {
  const match = raw.match(PLAN_FENCE);
  if (!match || match.index === undefined) {
    const incomplete = raw.search(/```plan\b/);
    if (incomplete !== -1) return { text: raw.slice(0, incomplete) };
    return { text: raw };
  }
  const plan = parsePlanBody(match[1] ?? "");
  const text = `${raw.slice(0, match.index)}${raw.slice(match.index + match[0].length)}`;
  return {
    text: text.replace(/^\n+/, ""),
    plan: plan.length ? plan : undefined,
  };
}

export function interpretPrompt(
  text: string,
  currentMode: SessionModeId,
): { text: string; mode: SessionModeId } {
  const match = text.match(/^\/([a-z]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return { text, mode: currentMode };
  const name = (match[1] ?? "").toLowerCase();
  const rest = (match[2] ?? "").trim();
  if (name === "ask") {
    return {
      text: rest || "Answer in Ask mode — no code execution.",
      mode: "ask",
    };
  }
  if (name === "plan") {
    return {
      text: rest || "Draft a clear multi-step plan for what I should do next.",
      mode: "plan",
    };
  }
  if (name === "search") {
    return {
      text: rest
        ? `Search the live web and brief me: ${rest}`
        : "Search the live web for the most important story today and brief me.",
      mode: "ask",
    };
  }
  if (name === "code") {
    return {
      text: rest
        ? `Use code execution if it helps: ${rest}`
        : "Run a small Python example that illustrates a useful numerical trick, then explain it.",
      mode: "agent",
    };
  }
  return { text, mode: currentMode };
}
