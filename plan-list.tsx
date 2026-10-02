import { Check, Circle, Loader2 } from "lucide-react";
import type { PlanEntry } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

function StatusMark({ status }: { status: PlanEntry["status"] }) {
  if (status === "completed") {
    return <Check className="size-3.5" strokeWidth={2} />;
  }
  if (status === "in_progress") {
    return <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />;
  }
  return <Circle className="size-2.5" strokeWidth={1.75} />;
}

export function PlanList({
  entries,
  compact,
}: {
  entries: PlanEntry[];
  compact?: boolean;
}) {
  if (entries.length === 0) return null;
  return (
    <ol className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
      {entries.map((entry, index) => (
        <li key={`${entry.content}-${index}`} className="flex items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
              entry.status === "completed"
                ? "bg-fog/20 text-fog"
                : entry.status === "in_progress"
                  ? "bg-tungsten/20 text-tungsten"
                  : "bg-fog/10 text-fog/55",
            )}
          >
            <StatusMark status={entry.status} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p
              className={cn(
                "text-sm leading-snug text-fog",
                entry.status === "completed" && "text-fog/60",
              )}
            >
              {entry.content}
            </p>
            <p className="mt-0.5 text-xs tracking-wide text-fog/45 uppercase">
              {entry.priority}
              {entry.status === "in_progress" ? " · live" : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
