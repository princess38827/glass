import { SESSION_MODES } from "@/lib/chat/acp";
import type { SessionModeId } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

export function ModeSwitch({
  value,
  onChange,
  disabled,
}: {
  value: SessionModeId;
  onChange: (mode: SessionModeId) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Session mode"
      className="glass-soft grid grid-cols-3 gap-1 rounded-[var(--radius-md)] p-1"
    >
      {SESSION_MODES.map((mode) => {
        const active = mode.id === value;
        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            title={mode.description}
            onClick={() => onChange(mode.id)}
            className={cn(
              "h-9 rounded-[10px] text-xs font-medium tracking-wide transition-[background-color,color,transform] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
              active
                ? "bg-fog/20 text-fog"
                : "text-fog/55 hover:bg-fog/10 hover:text-fog",
            )}
          >
            {mode.name}
          </button>
        );
      })}
    </div>
  );
}
