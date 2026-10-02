import { useEffect, useRef } from "react";
import type { ChatMessage, ChatSession } from "@/lib/chat/types";
import { GlassMark } from "./mark";
import { MessageBubble } from "./message-bubble";

const STARTERS = [
  "Brief me on a story that broke today.",
  "Plan a three-day Kyoto trip with one quiet morning.",
  "Write Python to sample a sine wave, then explain the result.",
  "Compare ACP and MCP in a tight brief.",
];

export function Thread({
  session,
  streamingId,
  onPrompt,
}: {
  session: ChatSession | null;
  streamingId: string | null;
  onPrompt: (text: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const messages = session?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingId]);

  if (!session || messages.length === 0) {
    return <EmptyState onPrompt={onPrompt} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-1 pb-4">
      {messages.map((message: ChatMessage) => (
        <MessageBubble
          key={message.id}
          message={message}
          streaming={message.id === streamingId}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-2 py-8">
      <div className="enter-soft">
        <GlassMark className="mb-5 size-10 text-fog/80" />
        <h1 className="font-display text-4xl leading-tight tracking-[-0.03em] text-fog md:text-5xl">
          Light through the pane.
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-fog/70">
          Glass is an ACP workbench. It thinks, searches the live web, and runs
          code — then shows every session update in glass.
        </p>
      </div>
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {STARTERS.map((prompt, index) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="enter-soft glass-soft rounded-[var(--radius-md)] px-4 py-3.5 text-left text-sm leading-snug text-fog/90 transition-colors duration-[var(--motion-quick)] hover:bg-white/20"
            style={{ animationDelay: `${80 + index * 40}ms` }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
