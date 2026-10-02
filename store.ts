import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";
import type {
  ChatMessage,
  ChatSession,
  MessageBlock,
  PlanEntry,
  SessionModeId,
  SessionUpdate,
  ToolCall,
} from "./types";

type ChatState = {
  sessions: ChatSession[];
  activeId: string | null;
  streamingId: string | null;
  newSession: (modeId?: SessionModeId) => string;
  setActive: (id: string) => void;
  deleteSession: (id: string) => void;
  setMode: (sessionId: string, modeId: SessionModeId) => void;
  appendUser: (sessionId: string, text: string) => string;
  beginAssistant: (sessionId: string) => string;
  applyUpdate: (
    sessionId: string,
    messageId: string,
    update: SessionUpdate,
  ) => void;
  setStreaming: (id: string | null) => void;
  failAssistant: (sessionId: string, messageId: string, message: string) => void;
};

function titleFrom(text: string): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (!line) return "New thread";
  return line.length > 42 ? `${line.slice(0, 41).trimEnd()}…` : line;
}

function upsertTool(blocks: MessageBlock[], tool: ToolCall): MessageBlock[] {
  const index = blocks.findIndex(
    (block) => block.type === "tool" && block.tool.toolCallId === tool.toolCallId,
  );
  if (index === -1) return [...blocks, { type: "tool", tool }];
  const next = blocks.slice();
  const current = next[index];
  if (!current || current.type !== "tool") return blocks;
  next[index] = {
    type: "tool",
    tool: { ...current.tool, ...tool },
  };
  return next;
}

function appendText(
  blocks: MessageBlock[],
  kind: "text" | "thought",
  chunk: string,
): MessageBlock[] {
  const last = blocks[blocks.length - 1];
  if (last && last.type === kind) {
    const next = blocks.slice();
    next[next.length - 1] = { type: kind, text: last.text + chunk };
    return next;
  }
  return [...blocks, { type: kind, text: chunk }];
}

function patchSession(
  sessions: ChatSession[],
  sessionId: string,
  patch: (session: ChatSession) => ChatSession,
): ChatSession[] {
  return sessions.map((session) =>
    session.id === sessionId ? patch(session) : session,
  );
}

function patchMessage(
  session: ChatSession,
  messageId: string,
  patch: (message: ChatMessage) => ChatMessage,
): ChatSession {
  return {
    ...session,
    updatedAt: Date.now(),
    messages: session.messages.map((message) =>
      message.id === messageId ? patch(message) : message,
    ),
  };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeId: null,
      streamingId: null,
      newSession: (modeId = "agent") => {
        const session: ChatSession = {
          id: uid(),
          title: "New thread",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          modeId,
          messages: [],
          plan: [],
        };
        set({
          sessions: [session, ...get().sessions],
          activeId: session.id,
        });
        return session.id;
      },
      setActive: (id) => set({ activeId: id }),
      deleteSession: (id) => {
        const sessions = get().sessions.filter((session) => session.id !== id);
        const activeId =
          get().activeId === id ? (sessions[0]?.id ?? null) : get().activeId;
        set({ sessions, activeId });
      },
      setMode: (sessionId, modeId) => {
        set({
          sessions: patchSession(get().sessions, sessionId, (session) => ({
            ...session,
            modeId,
            updatedAt: Date.now(),
          })),
        });
      },
      appendUser: (sessionId, text) => {
        const id = uid();
        const message: ChatMessage = {
          id,
          role: "user",
          createdAt: Date.now(),
          blocks: [{ type: "text", text }],
        };
        set({
          sessions: patchSession(get().sessions, sessionId, (session) => ({
            ...session,
            title:
              session.messages.length === 0 ? titleFrom(text) : session.title,
            updatedAt: Date.now(),
            messages: [...session.messages, message],
          })),
        });
        return id;
      },
      beginAssistant: (sessionId) => {
        const id = uid();
        const message: ChatMessage = {
          id,
          role: "assistant",
          createdAt: Date.now(),
          blocks: [],
        };
        set({
          streamingId: id,
          sessions: patchSession(get().sessions, sessionId, (session) => ({
            ...session,
            updatedAt: Date.now(),
            messages: [...session.messages, message],
          })),
        });
        return id;
      },
      applyUpdate: (sessionId, messageId, update) => {
        set({
          sessions: patchSession(get().sessions, sessionId, (session) => {
            if (update.sessionUpdate === "plan") {
              return patchMessage(
                { ...session, plan: update.entries },
                messageId,
                (message) => ({ ...message, plan: update.entries }),
              );
            }
            if (update.sessionUpdate === "current_mode_update") {
              return { ...session, modeId: update.currentModeId };
            }
            if (update.sessionUpdate === "session_info_update" && update.title) {
              return { ...session, title: update.title, updatedAt: Date.now() };
            }
            return patchMessage(session, messageId, (message) => {
              if (update.sessionUpdate === "agent_message_chunk") {
                return {
                  ...message,
                  blocks: appendText(message.blocks, "text", update.content.text),
                };
              }
              if (update.sessionUpdate === "agent_thought_chunk") {
                return {
                  ...message,
                  blocks: appendText(
                    message.blocks,
                    "thought",
                    update.content.text,
                  ),
                };
              }
              if (update.sessionUpdate === "tool_call") {
                const { sessionUpdate: _ignored, ...tool } = update;
                return { ...message, blocks: upsertTool(message.blocks, tool) };
              }
              if (update.sessionUpdate === "tool_call_update") {
                const { sessionUpdate: _ignored, toolCallId, ...rest } = update;
                const existing = message.blocks.find(
                  (block) =>
                    block.type === "tool" && block.tool.toolCallId === toolCallId,
                );
                const base: ToolCall =
                  existing && existing.type === "tool"
                    ? existing.tool
                    : {
                        toolCallId,
                        title: "Tool",
                        kind: "other",
                        status: "in_progress",
                      };
                return {
                  ...message,
                  blocks: upsertTool(message.blocks, { ...base, ...rest }),
                };
              }
              if (update.sessionUpdate === "error") {
                return { ...message, error: update.message };
              }
              return message;
            });
          }),
        });
      },
      setStreaming: (id) => set({ streamingId: id }),
      failAssistant: (sessionId, messageId, message) => {
        set({
          streamingId: null,
          sessions: patchSession(get().sessions, sessionId, (session) =>
            patchMessage(session, messageId, (item) => ({
              ...item,
              error: message,
            })),
          ),
        });
      },
    }),
    {
      name: "glass-acp-v1",
      skipHydration: true,
      partialize: (state) => ({
        sessions: state.sessions,
        activeId: state.activeId,
      }),
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Partial<ChatState>;
        const sessions = Array.isArray(raw.sessions)
          ? raw.sessions.map((session) => ({
              ...session,
              modeId: session.modeId ?? "agent",
              plan: session.plan ?? [],
              messages: session.messages ?? [],
            }))
          : current.sessions;
        return {
          ...current,
          ...raw,
          sessions,
          activeId: raw.activeId ?? current.activeId,
        };
      },
    },
  ),
);

export function toolsFromSession(session: ChatSession | null): ToolCall[] {
  if (!session) return [];
  const last = [...session.messages].reverse().find((m) => m.role === "assistant");
  if (!last) return [];
  return last.blocks
    .filter((block): block is { type: "tool"; tool: ToolCall } => block.type === "tool")
    .map((block) => block.tool);
}

export function planFromSession(session: ChatSession | null): PlanEntry[] {
  return session?.plan ?? [];
}
