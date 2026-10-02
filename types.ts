export type ProtocolVersion = 1;

export type ToolKind =
  | "read"
  | "edit"
  | "delete"
  | "move"
  | "search"
  | "execute"
  | "think"
  | "fetch"
  | "switch_mode"
  | "other";

export type ToolCallStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed";

export type PlanEntryPriority = "high" | "medium" | "low";
export type PlanEntryStatus = "pending" | "in_progress" | "completed";

export type PlanEntry = {
  content: string;
  priority: PlanEntryPriority;
  status: PlanEntryStatus;
};

export type ToolCallContent =
  | { type: "content"; content: { type: "text"; text: string } }
  | { type: "diff"; path: string; oldText?: string; newText?: string };

export type ToolCallLocation = {
  path: string;
  line?: number;
};

export type ToolCall = {
  toolCallId: string;
  name?: string;
  title: string;
  kind: ToolKind;
  status: ToolCallStatus;
  content?: ToolCallContent[];
  locations?: ToolCallLocation[];
  rawInput?: unknown;
  rawOutput?: unknown;
};

export type SessionModeId = "ask" | "plan" | "agent";

export type SessionMode = {
  id: SessionModeId;
  name: string;
  description: string;
};

export type AvailableCommand = {
  name: string;
  description: string;
  input?: { hint: string };
};

export type ChatRole = "user" | "assistant";

export type MessageBlock =
  | { type: "thought"; text: string }
  | { type: "text"; text: string }
  | { type: "tool"; tool: ToolCall };

export type ChatMessage = {
  id: string;
  role: ChatRole;
  createdAt: number;
  blocks: MessageBlock[];
  plan?: PlanEntry[];
  error?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modeId: SessionModeId;
  messages: ChatMessage[];
  plan: PlanEntry[];
};

export type SessionUpdate =
  | {
      sessionUpdate: "agent_message_chunk";
      content: { type: "text"; text: string };
    }
  | {
      sessionUpdate: "agent_thought_chunk";
      content: { type: "text"; text: string };
    }
  | ({ sessionUpdate: "tool_call" } & ToolCall)
  | ({ sessionUpdate: "tool_call_update" } & Partial<Omit<ToolCall, "toolCallId">> & {
      toolCallId: string;
    })
  | { sessionUpdate: "plan"; entries: PlanEntry[] }
  | {
      sessionUpdate: "available_commands_update";
      availableCommands: AvailableCommand[];
    }
  | { sessionUpdate: "current_mode_update"; currentModeId: SessionModeId }
  | { sessionUpdate: "session_info_update"; title?: string }
  | { sessionUpdate: "error"; message: string }
  | {
      sessionUpdate: "done";
      stopReason?: "end_turn" | "cancelled" | "max_tokens";
    };

export type ChatRequestBody = {
  sessionId: string;
  messages: Array<{ role: ChatRole; content: string }>;
  mode: SessionModeId;
};

export type AgentMeta = {
  protocolVersion: ProtocolVersion;
  ready: boolean;
  model: string;
  agentName: string;
  modes: SessionMode[];
  commands: AvailableCommand[];
};
