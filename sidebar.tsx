import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/chat/store";
import { cn } from "@/lib/utils";
import { GlassMark } from "./mark";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const sessions = useChatStore((state) => state.sessions);
  const activeId = useChatStore((state) => state.activeId);
  const newSession = useChatStore((state) => state.newSession);
  const setActive = useChatStore((state) => state.setActive);
  const deleteSession = useChatStore((state) => state.deleteSession);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <GlassMark className="size-7 text-fog" />
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight tracking-[-0.03em] text-fog">
            Glass
          </p>
          <p className="text-xs tracking-[0.14em] text-fog/55 uppercase">
            ACP workbench
          </p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <Button
          type="button"
          variant="primary"
          className="w-full"
          onClick={() => {
            newSession();
            onNavigate?.();
          }}
        >
          <Plus className="size-4" strokeWidth={1.75} />
          New thread
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
        {sessions.length === 0 ? (
          <p className="px-3 py-6 text-sm text-fog/55">No threads yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <div
                  className={cn(
                    "group flex items-center rounded-[var(--radius-sm)] pr-1",
                    session.id === activeId ? "bg-fog/16" : "hover:bg-fog/10",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActive(session.id);
                      onNavigate?.();
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
                  >
                    <MessageSquare
                      className="size-3.5 shrink-0 text-fog/55"
                      strokeWidth={1.75}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-fog">
                        {session.title}
                      </span>
                      <span className="block text-xs tracking-wide text-fog/45 uppercase">
                        {session.modeId}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${session.title}`}
                    onClick={() => deleteSession(session.id)}
                    className="grid size-9 place-items-center rounded-[10px] text-fog/45 opacity-70 hover:bg-fog/10 hover:text-fog md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
