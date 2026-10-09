/** The app's mark: a small clay vessel held together by a gold seam. */
export function Mark({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id="mark-glow" cx="50%" cy="58%" r="50%">
          <stop offset="0%" stopColor="var(--gold-bright)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--gold-bright)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mark-clay" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--clay-light)" />
          <stop offset="100%" stopColor="var(--clay-dark)" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="38" r="26" fill="url(#mark-glow)" />
      <path
        d="M26 8h12v3l-2 1v7c9 3 15 10 15 20 0 10-8 17-19 17S13 49 13 39c0-10 6-17 15-20v-7l-2-1z"
        fill="url(#mark-clay)"
      />
      <path
        d="M17 31l9 4 4-5 6 7 5-3 6 4M21 47l8-3 5 4 7-3"
        fill="none"
        stroke="var(--gold-bright)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
