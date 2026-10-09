/** Two candles in brass holders. Lit for the quiet stretch from Friday evening through Saturday. */
export function Candles({ lit, className }: { lit: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 60 80"
      className={className}
      role="img"
      aria-label={lit ? "Two lit candles" : "Two candles, waiting"}
    >
      <defs>
        <radialGradient id="candle-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--gold-bright)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--gold-bright)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="candle-flame" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff6d5" />
          <stop offset="55%" stopColor="#ffd36b" />
          <stop offset="100%" stopColor="#f08a2c" />
        </linearGradient>
        <linearGradient id="candle-brass" x1="0" x2="1">
          <stop offset="0%" stopColor="#8c6a2a" />
          <stop offset="45%" stopColor="#e2bd6a" />
          <stop offset="100%" stopColor="#8c6a2a" />
        </linearGradient>
      </defs>
      {[18, 42].map((x, i) => (
        <g key={x}>
          {lit ? <circle cx={x} cy="16" r="16" fill="url(#candle-halo)" className="glow-breathe" /> : null}
          <rect x={x - 3.5} y="22" width="7" height="34" rx="1.2" fill="#f7f0e1" />
          <rect x={x - 3.5} y="22" width="2.2" height="34" fill="#ffffff" opacity="0.6" />
          <path d={`M${x},22 v-3`} stroke="#3a2e25" strokeWidth="0.9" strokeLinecap="round" />
          {lit ? (
            <path
              className={i === 0 ? "flame" : "flame flame-b"}
              d={`M${x},6 C${x + 3.6},12 ${x + 3},18 ${x},19.5 C${x - 3},18 ${x - 3.6},12 ${x},6z`}
              fill="url(#candle-flame)"
            />
          ) : null}
          <path d={`M${x - 7},56 h14 l-3,4 h-8z`} fill="url(#candle-brass)" />
          <rect x={x - 1.6} y="60" width="3.2" height="10" fill="url(#candle-brass)" />
          <ellipse cx={x} cy="73" rx="8" ry="3" fill="url(#candle-brass)" />
        </g>
      ))}
    </svg>
  );
}
