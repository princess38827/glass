import { useState } from "react";
import {
  Check,
  ChevronDown,
  Code2,
  FileText,
  Globe,
  Loader2,
  Pencil,
  Search,
  Wrench,
} from "lucide-react";
import type { ToolCall, ToolKind } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

function KindIcon({ kind }: { kind: ToolKind }) {
  const cls = "size-3.5";
  if (kind === "search" || kind === "fetch") {
    return <Globe className={cls} strokeWidth={1.75} />;
  }
  if (kind === "execute") return <Code2 className={cls} strokeWidth={1.75} />;
  if (kind === "read") return <FileText className={cls} strokeWidth={1.75} />;
  if (kind === "edit") return <Pencil className={cls} strokeWidth={1.75} />;
  if (kind === "think") return <Search className={cls} strokeWidth={1.75} />;
  return <Wrench className={cls} strokeWidth={1.75} />;
}

function asPreview(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function detailFor(tool: ToolCall): string {
  const first = tool.content?.find((item) => item.type === "content");
  if (first && first.type === "content") return first.content.text;
  if (tool.status === "in_progress" || tool.status === "pending") return "Working";
  if (tool.status === "completed") return "Done";
  if (tool.status === "failed") return "Failed";
  return tool.kind;
}

export function ToolCard({ tool }: { tool: ToolCall }) {
  const running = tool.status === "in_progress" || tool.status === "pending";
  const input = asPreview(tool.rawInput);
  const output = asPreview(tool.rawOutput);
  const expandable = Boolean(input || output);
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-soft rounded-[var(--radius-md)] px-3 py-2.5">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 text-left"
        onClick={() => expandable && setOpen((value) => !value)}
        disabled={!expandable}
      >
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-[10px] bg-ink/25 text-fog",
            running && "text-tungsten",
          )}
        >
          {running ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
          ) : tool.status === "completed" ? (
            <Check className="size-3.5" strokeWidth={2} />
          ) : (
            <KindIcon kind={tool.kind} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium tracking-tight text-fog">{tool.title}</p>
          <p className="truncate text-xs text-fog/65">{detailFor(tool)}</p>
        </div>
        {expandable ? (
          <ChevronDown
            className={cn(
              "size-4 text-fog/50 transition-transform duration-[var(--motion-quick)]",
              open && "rotate-180",
            )}
            strokeWidth={1.75}
          />
        ) : null}
      </button>
      {open && input ? (
        <pre className="mt-2 max-h-32 overflow-auto rounded-[10px] bg-ink/35 px-2.5 py-2 font-mono text-xs leading-5 text-fog/80">
          {input}
        </pre>
      ) : null}
      {open && output ? (
        <pre className="mt-2 max-h-32 overflow-auto rounded-[10px] bg-ink/35 px-2.5 py-2 font-mono text-xs leading-5 text-fog/80">
          {output}
        </pre>
      ) : null}
    </div>
  );
}
