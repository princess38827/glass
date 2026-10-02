import { SESSION_MODES } from "@/lib/chat/acp";
import { planFromSession, toolsFromSession } from "@/lib/chat/store";
import type { ChatSession, SessionModeId } from "@/lib/chat/types";
import { ModeSwitch } from "./mode-switch";
import { PlanList } from "./plan-list";
import { ToolCard } from "./tool-card";

export function Inspector({
  session,
  streaming,
  onMode,
}: {
  session: ChatSession | null;
  streaming: boolean;
  onMode: (mode: SessionModeId) => void;
}) {
  const mode = SESSION_MODES.find((item) => item.id === (session?.modeId ?? "agent"));
  const plan = planFromSession(session);
  const tools = toolsFromSession(session);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs tracking-[0.14em] text-fog/55 uppercase">Session</p>
        <h2 className="mt-1 font-display text-xl tracking-[-0.03em] text-fog">
          Inspector
        </h2>
      </div>

      <div className="px-3 pb-3">
        <ModeSwitch
          value={session?.modeId ?? "agent"}
          onChange={onMode}
        />
        <p className="mt-2 px-1 text-xs leading-relaxed text-fog/55">
          {mode?.description}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <section className="glass-soft rounded-[var(--radius-lg)] p-3">
          <p className="mb-2 text-xs tracking-[0.14em] text-fog/55 uppercase">
            Plan
          </p>
          {plan.length ? (
            <PlanList entries={plan} />
          ) : (
            <p className="text-sm leading-relaxed text-fog/55">
              Multi-step turns land a live plan here — pending, in progress, done.
            </p>
          )}
        </section>

        <section className="glass-soft rounded-[var(--radius-lg)] p-3">
          <p className="mb-2 text-xs tracking-[0.14em] text-fog/55 uppercase">
            Tools
          </p>
          {tools.length ? (
            <div className="flex flex-col gap-2">
              {tools.map((tool) => (
                <ToolCard key={tool.toolCallId} tool={tool} />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-fog/55">
              Search and code calls appear as ACP tool cards while the agent works.
            </p>
          )}
        </section>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs tracking-[0.14em] text-fog/40 uppercase">
          ACP 1 · session/update
        </p>
      </div>
    </div>
  );
}
