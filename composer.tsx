import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { SLASH_COMMANDS } from "@/lib/chat/acp";
import { Button } from "@/components/ui/button";

export function Composer({
  onSend,
  onStop,
  busy,
}: {
  onSend: (text: string) => void;
  onStop: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const slash = useMemo(() => {
    const match = draft.match(/^\/([a-z]*)$/i);
    if (!match) return null;
    const query = (match[1] ?? "").toLowerCase();
    return SLASH_COMMANDS.filter((command) => command.name.startsWith(query));
  }, [draft]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = draft.trim();
    if (!value || busy || value === "/") return;
    onSend(value);
    setDraft("");
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.focus();
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (slash && slash[0]) {
        applyCommand(slash[0].name);
        return;
      }
      submit();
    }
    if (event.key === "Tab" && slash && slash[0]) {
      event.preventDefault();
      applyCommand(slash[0].name);
    }
  }

  function applyCommand(name: string) {
    const command = SLASH_COMMANDS.find((item) => item.name === name);
    setDraft(command?.input ? `/${name} ` : `/${name}`);
    ref.current?.focus();
  }

  return (
    <form onSubmit={submit} className="relative">
      {slash ? (
        <div className="glass absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-[var(--radius-lg)] p-1">
          {slash.length === 0 ? (
            <p className="px-3 py-2 text-sm text-fog/55">No matching command</p>
          ) : (
            slash.map((command) => (
              <button
                key={command.name}
                type="button"
                onClick={() => applyCommand(command.name)}
                className="flex w-full items-baseline gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left hover:bg-fog/10"
              >
                <span className="font-mono text-sm text-tungsten">/{command.name}</span>
                <span className="truncate text-sm text-fog/70">{command.description}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      <div className="glass rounded-[var(--radius-xl)] p-2 md:p-2.5">
        <textarea
          ref={ref}
          rows={1}
          name="prompt"
          value={draft}
          aria-label="Message Glass"
          placeholder="Ask Glass, or type / for commands…"
          suppressHydrationWarning
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          className="block max-h-40 min-h-11 w-full resize-none bg-transparent px-3 py-2.5 text-base leading-relaxed text-fog placeholder:text-fog/45 focus:outline-none md:text-sm"
        />
        <div className="flex items-center gap-2 px-1 pb-1">
          <p className="hidden px-2 text-xs text-fog/45 sm:block">
            Enter to send · Shift+Enter for a line
          </p>
          <div className="ml-auto">
            {busy ? (
              <Button
                type="button"
                size="icon"
                variant="primary"
                aria-label="Stop"
                className="size-11"
                onClick={onStop}
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                aria-label="Send"
                className="size-11"
                disabled={!draft.trim()}
              >
                <ArrowUp className="size-4" strokeWidth={2.2} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
