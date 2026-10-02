export function GlassMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.25"
      />
      <circle
        cx="16"
        cy="16"
        r="7"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1.35"
      />
      <circle cx="16" cy="16" r="2.4" fill="currentColor" />
    </svg>
  );
}
