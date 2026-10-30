import { useId } from 'react';

/* ---------- String lights with marigold clusters ---------- */

type Pt = [number, number];
const SWAGS: [Pt, Pt, Pt][] = [
  [[0, 6], [150, 78], [300, 14]],
  [[300, 14], [450, 78], [600, 14]],
  [[600, 14], [750, 78], [900, 14]],
  [[900, 14], [1050, 78], [1200, 6]],
];

function bezier([p0, p1, p2]: [Pt, Pt, Pt], t: number): Pt {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

const BULBS: Pt[] = SWAGS.flatMap((s) => Array.from({ length: 8 }, (_, i) => bezier(s, (i + 0.5) / 8)));

function Marigold({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="-12" cy="6" rx="9" ry="4" fill="#3f7d3a" transform="rotate(-25 -12 6)" />
      <ellipse cx="12" cy="6" rx="9" ry="4" fill="#3f7d3a" transform="rotate(25 12 6)" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 6} cy={Math.sin((a * Math.PI) / 180) * 6} r="5" fill="#f59e0b" />
      ))}
      <circle r="5" fill="#f97316" />
    </g>
  );
}

export function StringLights() {
  const d = SWAGS.map(([a, b, c], i) => `${i === 0 ? `M${a[0]},${a[1]}` : ''} Q${b[0]},${b[1]} ${c[0]},${c[1]}`).join(' ');
  return (
    <svg className="lights" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke="#8a6a3a" strokeWidth="1.5" />
      {BULBS.map(([x, y], i) => (
        <g key={i} className="bulb" style={{ animationDelay: `${(i * 0.37) % 3}s` }}>
          <circle cx={x} cy={y + 5} r="9" fill="#ffe7a3" opacity="0.35" />
          <circle cx={x} cy={y + 5} r="3.6" fill={i % 3 === 0 ? '#ffd27a' : '#fff4d6'} />
        </g>
      ))}
      <Marigold x={300} y={14} />
      <Marigold x={600} y={14} />
      <Marigold x={900} y={14} />
    </svg>
  );
}

/* ---------- Hanging lantern ---------- */

export function Lantern({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`lantern ${className}`} viewBox="0 0 60 150" aria-hidden>
      <defs>
        <radialGradient id={`glass-${id}`} cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="45%" stopColor="#ffd27a" />
          <stop offset="100%" stopColor="#e08a2c" />
        </radialGradient>
        <linearGradient id={`gold-${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#b9853a" />
          <stop offset="50%" stopColor="#f3d08a" />
          <stop offset="100%" stopColor="#a8762f" />
        </linearGradient>
      </defs>
      <line x1="30" y1="0" x2="30" y2="34" stroke="#b9853a" strokeWidth="1.5" />
      <circle cx="30" cy="36" r="3" fill="none" stroke={`url(#gold-${id})`} strokeWidth="2" />
      <circle cx="30" cy="72" r="30" fill="#ffcf6b" opacity="0.18" className="lantern-glow" />
      <path d="M20 48 L40 48 L35 39 L25 39 Z" fill={`url(#gold-${id})`} />
      <rect x="17" y="48" width="26" height="46" rx="5" fill={`url(#glass-${id})`} stroke={`url(#gold-${id})`} strokeWidth="2.5" />
      <line x1="25.5" y1="49" x2="25.5" y2="93" stroke="#b9853a" strokeWidth="1.2" opacity="0.8" />
      <line x1="34.5" y1="49" x2="34.5" y2="93" stroke="#b9853a" strokeWidth="1.2" opacity="0.8" />
      <path d="M17 94 L43 94 L37 103 L23 103 Z" fill={`url(#gold-${id})`} />
      <circle cx="30" cy="107" r="3" fill={`url(#gold-${id})`} />
      <line x1="30" y1="110" x2="30" y2="122" stroke="#d4a04a" strokeWidth="1.5" />
      <circle cx="30" cy="124" r="2" fill="#d4a04a" />
    </svg>
  );
}

/* ---------- Diya with flickering flame ---------- */

export function Diya({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`diya ${className}`} viewBox="0 0 200 140" aria-hidden>
      <defs>
        <radialGradient id={`halo-${id}`}>
          <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`flame-${id}`} cx="50%" cy="75%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor="#ff8a1f" />
        </radialGradient>
        <linearGradient id={`bowl-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f3d08a" />
          <stop offset="60%" stopColor="#c8913f" />
          <stop offset="100%" stopColor="#8a5a22" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="58" r="58" fill={`url(#halo-${id})`} className="diya-halo" />
      <path className="flame" d="M100 14 C113 40 118 60 100 74 C82 60 87 40 100 14 Z" fill={`url(#flame-${id})`} />
      <rect x="98.5" y="70" width="3" height="9" rx="1" fill="#4a2a10" />
      <path d="M26 80 Q100 86 174 80 Q164 128 100 130 Q36 128 26 80 Z" fill={`url(#bowl-${id})`} />
      <ellipse cx="100" cy="80" rx="74" ry="8" fill="#a8762f" />
      <ellipse cx="100" cy="79" rx="66" ry="5" fill="#5a3412" />
      {[56, 78, 100, 122, 144].map((x) => (
        <circle key={x} cx={x} cy="104" r="3" fill="#8a5a22" opacity="0.7" />
      ))}
    </svg>
  );
}

/* ---------- Rangoli / mandala (half visible) ---------- */

export function Mandala() {
  const petals = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg className="mandala" viewBox="-200 -200 400 400" aria-hidden>
      <g fill="none" stroke="#e8b75a">
        <circle r="190" strokeOpacity="0.18" strokeDasharray="2 6" />
        <circle r="160" strokeOpacity="0.25" />
        <circle r="120" strokeOpacity="0.2" strokeDasharray="10 6" />
        <circle r="80" strokeOpacity="0.28" />
        {petals.map((a) => (
          <ellipse key={a} cx="0" cy="-140" rx="10" ry="22" transform={`rotate(${a})`} strokeOpacity="0.28" />
        ))}
        {petals.map((a) => (
          <ellipse key={`i${a}`} cx="0" cy="-100" rx="6" ry="14" transform={`rotate(${a + 7.5})`} strokeOpacity="0.22" />
        ))}
      </g>
    </svg>
  );
}
