import { useCallback, useRef, useState } from "react";
import { interpretPrompt } from "./acp";
import { useChatStore } from "./store";
import type { SessionUpdate } from "./types";

function flattenAssistant(blocks: { type: string; text?: string }[]): string {
  return blocks
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("\n")
    .trim();
}

async function readEvents(
  res: Response,
  onEvent: (update: SessionUpdate) => void,
) {
  if (!res.body) {
    onEvent({
      sessionUpdate: "error",
      message: "Empty response from the agent.",
    });
    onEvent({ sessionUpdate: "done", stopReason: "end_turn" });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    buf = buf.replace(/\r\n/g, "\n");
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const dataLines: string[] = [];
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      const data = dataLines.join("\n");
      if (!data) continue;
      try {
        onEvent(JSON.parse(data) as SessionUpdate);
      } catch {
        /* ignore malformed */
      }
    }
  }
}

export function useAgentChat() {
  const abortRef = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const store = useChatStore.getState();
    if (store.streamingId) return;

    let sessionId = store.activeId;
    if (!sessionId) sessionId = store.newSession();

    const session = store.sessions.find((item) => item.id === sessionId);
    const interpreted = interpretPrompt(trimmed, session?.modeId ?? "agent");
    if (interpreted.mode !== session?.modeId) {
      store.setMode(sessionId, interpreted.mode);
    }

    store.appendUser(sessionId, interpreted.text);
    const assistantId = store.beginAssistant(sessionId);
    setBusy(true);

    const next = useChatStore.getState().sessions.find((item) => item.id === sessionId);
    const history =
      next?.messages
        .filter((message) => message.id !== assistantId)
        .map((message) => ({
          role: message.role,
          content:
            message.role === "user"
              ? message.blocks
                  .filter((block) => block.type === "text")
                  .map((block) => (block.type === "text" ? block.text : ""))
                  .join("\n")
              : flattenAssistant(message.blocks),
        }))
        .filter((message) => message.content) ?? [];

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages: history,
          mode: interpreted.mode,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok && !res.headers.get("content-type")?.includes("event-stream")) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        store.failAssistant(
          sessionId,
          assistantId,
          payload?.error ?? "Couldn’t start the agent turn.",
        );
        return;
      }

      await readEvents(res, (update) => {
        if (update.sessionUpdate === "done") {
          useChatStore.getState().setStreaming(null);
          return;
        }
        useChatStore.getState().applyUpdate(sessionId, assistantId, update);
      });
      useChatStore.getState().setStreaming(null);
    } catch (err) {
      if ((err as { name?: string } | null)?.name === "AbortError") {
        useChatStore.getState().setStreaming(null);
        return;
      }
      store.failAssistant(
        sessionId,
        assistantId,
        "Couldn’t reach the agent. Try again.",
      );
    } finally {
      abortRef.current = null;
      setBusy(false);
      useChatStore.getState().setStreaming(null);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    useChatStore.getState().setStreaming(null);
    setBusy(false);
  }, []);

  return { send, stop, busy };
}
