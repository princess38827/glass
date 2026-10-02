import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AgentMarkdown } from "@/lib/chat/markdown";
import type { ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { PlanList } from "./plan-list";
import { ToolCard } from "./tool-card";

function Thought({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-fog/60"
      >
        <span className={cn(streaming && !open && "think-shimmer")}>
          {streaming ? "Thinking" : "Thought"}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-[var(--motion-quick)]",
            open && "rotate-180",
          )}
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fog/60">
          {text}
        </p>
      ) : null}
    </div>
  );
}

export function MessageBubble({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";
  const textBlocks = message.blocks.filter((block) => block.type === "text");
  const thought = message.blocks.find((block) => block.type === "thought");
  const tools = message.blocks.filter((block) => block.type === "tool");
  const emptyAssistant =
    !isUser &&
    textBlocks.every((block) => block.type !== "text" || block.text.trim() === "") &&
    tools.length === 0 &&
    !message.error;

  return (
    <article
      className={cn(
        "enter-soft flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-xl rounded-[var(--radius-lg)] px-4 py-3",
          isUser ? "glass rounded-br-[var(--radius-xs)]" : "glass-deep",
        )}
      >
        {thought && thought.type === "thought" && thought.text ? (
          <Thought
            text={thought.text}
            streaming={Boolean(streaming && emptyAssistant)}
          />
        ) : null}

        {message.plan && message.plan.length > 0 ? (
          <div className="mb-3">
            <p className="mb-2 text-xs tracking-[0.14em] text-fog/50 uppercase">
              Plan
            </p>
            <PlanList entries={message.plan} compact />
          </div>
        ) : null}

        {tools.map((block) =>
          block.type === "tool" ? (
            <div key={block.tool.toolCallId} className="mb-2 last:mb-0">
              <ToolCard tool={block.tool} />
            </div>
          ) : null,
        )}

        {emptyAssistant && streaming ? (
          <p className="think-shimmer text-sm font-medium">Working</p>
        ) : null}

        {textBlocks.map((block, index) =>
          block.type === "text" && block.text ? (
            <div key={index} className="md-body">
              {isUser ? (
                <p className="whitespace-pre-wrap">{block.text}</p>
              ) : (
                <AgentMarkdown text={block.text} />
              )}
            </div>
          ) : null,
        )}

        {message.error ? (
          <p className="mt-1 text-sm leading-relaxed text-tungsten">
            {message.error}
          </p>
        ) : null}
      </div>
    </article>
  );
}
