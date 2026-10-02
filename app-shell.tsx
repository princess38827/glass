import { useEffect, useState } from "react";
import { Menu, PanelRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/chat/store";
import { useAgentChat } from "@/lib/chat/use-agent-chat";
import { Composer } from "./composer";
import { Inspector } from "./inspector";
import { GlassMark } from "./mark";
import { Sidebar } from "./sidebar";
import { Thread } from "./thread";

export function AppShell() {
  const sessions = useChatStore((state) => state.sessions);
  const activeId = useChatStore((state) => state.activeId);
  const streamingId = useChatStore((state) => state.streamingId);
  const setMode = useChatStore((state) => state.setMode);
  const newSession = useChatStore((state) => state.newSession);
  const { send, stop, busy } = useAgentChat();
  const [navOpen, setNavOpen] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);

  useEffect(() => {
    void useChatStore.persist.rehydrate();
  }, []);

  const session = sessions.find((item) => item.id === activeId) ?? null;
  const streaming = Boolean(streamingId) || busy;
  const modeLabel = session?.modeId ?? "agent";

  return (
    <div className="atmosphere relative min-h-dvh overflow-hidden">
      <div className="relative mx-auto flex min-h-dvh max-w-screen-2xl flex-col p-3 md:p-4">
        <div className="flex min-h-0 flex-1 gap-3">
          <aside className="glass hidden w-72 shrink-0 overflow-hidden rounded-[var(--radius-xl)] md:flex md:flex-col">
            <Sidebar />
          </aside>

          <section className="glass-deep relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)]">
            <header className="flex items-center gap-2 px-3 py-2.5 xl:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={navOpen ? "Close threads" : "Open threads"}
                className="size-11 text-fog md:hidden"
                onClick={() => setNavOpen(true)}
              >
                <Menu className="size-5" strokeWidth={1.75} />
              </Button>
              <GlassMark className="size-6 text-fog md:hidden" />
              <span className="font-display text-lg tracking-[-0.03em] md:hidden">
                Glass
              </span>
              <span className="ml-auto text-xs tracking-[0.14em] text-fog/55 uppercase">
                {modeLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={inspectOpen ? "Close inspector" : "Open inspector"}
                className="size-11 text-fog"
                onClick={() => setInspectOpen(true)}
              >
                <PanelRight className="size-5" strokeWidth={1.75} />
              </Button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scrollbar-thin md:px-6 md:py-5">
              <Thread
                session={session}
                streamingId={streamingId}
                onPrompt={send}
              />
            </div>

            <div className="px-3 pb-3 md:px-6 md:pb-4">
              <div className="mx-auto max-w-3xl">
                <Composer onSend={send} onStop={stop} busy={streaming} />
                <p className="mt-2 px-1 text-center text-xs tracking-wide text-fog/45">
                  {streaming
                    ? "Running an agent turn"
                    : `Grok · ${modeLabel} · ACP 1`}
                </p>
              </div>
            </div>
          </section>

          <aside className="glass hidden w-80 shrink-0 overflow-hidden rounded-[var(--radius-xl)] xl:flex xl:flex-col">
            <Inspector
              session={session}
              streaming={streaming}
              onMode={(mode) => {
                if (session) setMode(session.id, mode);
                else newSession(mode);
              }}
            />
          </aside>
        </div>
      </div>

      {navOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close threads"
            className="absolute inset-0 bg-ink/45"
            onClick={() => setNavOpen(false)}
          />
          <div className="glass absolute inset-y-0 left-0 flex w-80 flex-col rounded-r-[var(--radius-xl)]">
            <div className="flex justify-end p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={() => setNavOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      ) : null}

      {inspectOpen ? (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            type="button"
            aria-label="Close inspector"
            className="absolute inset-0 bg-ink/45"
            onClick={() => setInspectOpen(false)}
          />
          <div className="glass absolute inset-y-0 right-0 flex w-80 flex-col rounded-l-[var(--radius-xl)]">
            <div className="flex justify-end p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={() => setInspectOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <Inspector
              session={session}
              streaming={streaming}
              onMode={(mode) => {
                if (session) setMode(session.id, mode);
                else newSession(mode);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
