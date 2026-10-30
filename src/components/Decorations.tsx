/* Ornamental SVG pieces for the Diwali invitation.
   All drawn in code: gold filigree, paisleys, mandala flowers, a peacock feather, diyas. */

/** Shared gradients. Render once per page (EventPage does). */
export function GoldDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <linearGradient id="pp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1c4" />
          <stop offset="35%" stopColor="#e9bd62" />
          <stop offset="65%" stopColor="#b47a2a" />
          <stop offset="100%" stopColor="#f3d488" />
        </linearGradient>
        <linearGradient id="pp-gold-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c99341" />
          <stop offset="100%" stopColor="#6e4012" />
        </linearGradient>
        <radialGradient id="pp-crimson" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#b3222f" />
          <stop offset="100%" stopColor="#5c0a14" />
        </radialGradient>
        <radialGradient id="pp-gem" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff8a8a" />
          <stop offset="45%" stopColor="#c0152a" />
          <stop offset="100%" stopColor="#4a0610" />
        </radialGradient>
        <radialGradient id="pp-emerald" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#9ef0c0" />
          <stop offset="50%" stopColor="#1f8a55" />
          <stop offset="100%" stopColor="#0b3a22" />
        </radialGradient>
        <linearGradient id="pp-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e39a55" />
          <stop offset="55%" stopColor="#a64c1d" />
          <stop offset="100%" stopColor="#5a200a" />
        </linearGradient>
        <radialGradient id="pp-flame" cx="50%" cy="78%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#fff0b0" />
          <stop offset="70%" stopColor="#ffb02e" />
          <stop offset="100%" stopColor="#ff6a10" />
        </radialGradient>
        <radialGradient id="pp-halo">
          <stop offset="0%" stopColor="#ffcf73" stopOpacity="0.75" />
          <stop offset="40%" stopColor="#ff9a2e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ff9a2e" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ---------- building blocks ---------- */

function petal(outer: number, inner: number, w: number) {
  const m1 = inner + (outer - inner) * 0.7;
  const m2 = inner + (outer - inner) * 0.3;
  return `M0,${-outer} C${w},${-m1} ${w},${-m2} 0,${-inner} C${-w},${-m2} ${-w},${-m1} 0,${-outer}Z`;
}

function ring(n: number, offset = 0) {
  return Array.from({ length: n }, (_, i) => (i * 360) / n + offset);
}

/** Layered mandala flower: gold petals, crimson inner petals, dotted ring, gem center. */
export function Flower({ x, y, r, spin = false }: { x: number; y: number; r: number; spin?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={spin ? 'spin-slow' : undefined}>
        {ring(16).map((a) => (
          <g key={`o${a}`} transform={`rotate(${a})`}>
            <path d={petal(r, r * 0.5, r * 0.16)} fill="url(#pp-gold)" stroke="#7a4a16" strokeWidth={r * 0.012} />
            <path d={petal(r * 0.9, r * 0.58, r * 0.08)} fill="url(#pp-crimson)" />
          </g>
        ))}
        {ring(16, 11.25).map((a) => (
          <circle key={`t${a}`} cx={0} cy={-r * 1.04} r={r * 0.035} fill="#f3d488" transform={`rotate(${a})`} />
        ))}
        {ring(12, 15).map((a) => (
          <path key={`m${a}`} d={petal(r * 0.62, r * 0.28, r * 0.14)} transform={`rotate(${a})`} fill="url(#pp-crimson)" stroke="url(#pp-gold)" strokeWidth={r * 0.02} />
        ))}
        <circle r={r * 0.36} fill="none" stroke="#f3d488" strokeWidth={r * 0.035} strokeDasharray={`0 ${r * 0.075}`} strokeLinecap="round" />
        {ring(8).map((a) => (
          <path key={`i${a}`} d={petal(r * 0.3, r * 0.1, r * 0.09)} transform={`rotate(${a})`} fill="url(#pp-gold)" />
        ))}
      </g>
      <circle r={r * 0.11} fill="url(#pp-gem)" stroke="url(#pp-gold)" strokeWidth={r * 0.025} />
    </g>
  );
}

const PAISLEY =
  'M0,40 C-40,40 -46,-6 -20,-30 C-4,-44 22,-48 32,-72 C40,-48 42,-18 30,6 C22,26 14,40 0,40Z';

/** Paisley (mango) motif with dotted outline, crimson core and a small flower inside. */
export function Paisley({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  const about = (k: number) => `translate(-2 -10) scale(${k}) translate(2 10)`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={PAISLEY} transform={about(1.16)} fill="none" stroke="#f3d488" strokeWidth="3.2" strokeDasharray="0 7" strokeLinecap="round" />
      <path d={PAISLEY} fill="url(#pp-gold-dark)" stroke="url(#pp-gold)" strokeWidth="2.5" />
      <path d={PAISLEY} transform={about(0.74)} fill="url(#pp-crimson)" stroke="url(#pp-gold)" strokeWidth="1.6" />
      <path d={PAISLEY} transform={about(0.46)} fill="none" stroke="#f3d488" strokeWidth="1.4" strokeDasharray="5 3" />
      {ring(8).map((a) => (
        <path key={a} d={petal(11, 3, 3.2)} transform={`translate(-1 10) rotate(${a})`} fill="url(#pp-gold)" />
      ))}
      <circle cx="-1" cy="10" r="3" fill="url(#pp-gem)" />
      <circle cx="31" cy="-70" r="3.5" fill="url(#pp-gem)" />
    </g>
  );
}

/** Peacock feather. */
export function Feather({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  const barbs = Array.from({ length: 18 }, (_, i) => i);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0,110 C2,70 -2,40 0,0" stroke="#d9b25e" strokeWidth="2" fill="none" />
      {barbs.map((i) => {
        const yy = 100 - i * 5;
        const len = 10 + Math.sin((i / 17) * Math.PI) * 14;
        return (
          <g key={i} stroke="#4f8a3a" strokeWidth="0.9" opacity="0.85">
            <path d={`M0,${yy} q${-len * 0.6},-4 ${-len},-10`} fill="none" />
            <path d={`M0,${yy} q${len * 0.6},-4 ${len},-10`} fill="none" />
          </g>
        );
      })}
      <ellipse cx="0" cy="-6" rx="17" ry="22" fill="#8a9a2a" />
      <ellipse cx="0" cy="-4" rx="12.5" ry="16.5" fill="#1a9e9a" />
      <ellipse cx="0" cy="-2" rx="8" ry="10.5" fill="#1d3f94" />
      <ellipse cx="0" cy="0" rx="3.6" ry="5" fill="#0a1433" />
    </g>
  );
}

function Vine({ d, leaves }: { d: string; leaves: [number, number, number][] }) {
  return (
    <g>
      <path d={d} fill="none" stroke="url(#pp-gold)" strokeWidth="2.6" strokeLinecap="round" />
      {leaves.map(([lx, ly, a], i) => (
        <path key={i} d="M0,0 C6,-6 16,-6 22,0 C16,6 6,6 0,0Z" transform={`translate(${lx} ${ly}) rotate(${a})`} fill="url(#pp-gold)" stroke="#7a4a16" strokeWidth="0.6" />
      ))}
    </g>
  );
}

function Gem({ x, y, r = 4, green = false }: { x: number; y: number; r?: number; green?: boolean }) {
  return <circle cx={x} cy={y} r={r} fill={green ? 'url(#pp-emerald)' : 'url(#pp-gem)'} stroke="#f3d488" strokeWidth="0.8" />;
}

/* ---------- compositions ---------- */

/** Top-left corner cluster. Mirror with CSS for the other corners. */
export function CornerOrnament() {
  return (
    <svg viewBox="0 0 340 340" className="orn-svg" aria-hidden>
      <Vine d="M0,175 C70,165 120,130 150,75 C170,38 205,12 260,0" leaves={[[60, 168, -20], [118, 128, -55], [178, 40, -40], [222, 14, -25]]} />
      <Vine d="M175,0 C160,60 120,95 70,120 C40,135 18,160 0,200" leaves={[[150, 52, 120], [100, 102, 150], [38, 140, 120]]} />
      <Flower x={28} y={28} r={128} spin />
      <Paisley x={226} y={112} s={1.05} rot={118} />
      <Paisley x={108} y={232} s={1.0} rot={-28} />
      <Flower x={292} y={36} r={30} />
      <Flower x={40} y={300} r={30} />
      <Flower x={196} y={198} r={20} />
      <Gem x={262} y={170} r={5} />
      <Gem x={168} y={262} r={5} green />
      <Gem x={300} y={96} r={3.5} green />
      <Gem x={96} y={306} r={3.5} />
    </svg>
  );
}

/** Tall ornament for the left/right edges: paisley, feather, flower. */
export function SideOrnament() {
  return (
    <svg viewBox="0 0 170 380" className="orn-svg" aria-hidden>
      <Vine d="M20,0 C70,60 30,130 60,190 C90,250 40,310 70,380" leaves={[[52, 50, 60], [44, 140, 110], [74, 230, 70], [50, 320, 110]]} />
      <Flower x={30} y={70} r={34} />
      <Paisley x={58} y={200} s={1.25} rot={12} />
      <Feather x={110} y={300} s={0.95} rot={-18} />
      <Gem x={100} y={120} r={4} />
      <Gem x={20} y={290} r={4} green />
    </svg>
  );
}

/** Clay diya with flickering flame. */
export function Diya({ delay = 0 }: { delay?: number }) {
  return (
    <svg viewBox="0 0 140 120" className="diya" style={{ ['--d' as string]: `${delay}s` }} aria-hidden>
      <circle cx="70" cy="50" r="52" fill="url(#pp-halo)" className="diya-halo" />
      <g className="flame">
        <path d="M70 10 C82 34 87 52 70 66 C53 52 58 34 70 10 Z" fill="url(#pp-flame)" />
        <path d="M70 34 C75 45 76 54 70 60 C64 54 65 45 70 34 Z" fill="#fffdf2" opacity="0.9" />
      </g>
      <rect x="68.5" y="62" width="3" height="8" rx="1" fill="#3a1a08" />
      <path d="M14 72 Q70 78 126 72 Q118 112 70 114 Q22 112 14 72 Z" fill="url(#pp-clay)" />
      <path d="M20 86 Q70 96 120 86" fill="none" stroke="#f3d488" strokeWidth="1.6" strokeDasharray="0 6" strokeLinecap="round" />
      <path d="M26 96 Q70 106 114 96" fill="none" stroke="#e9bd62" strokeWidth="1.2" opacity="0.7" />
      <ellipse cx="70" cy="72" rx="56" ry="8" fill="#c27a3a" stroke="#f3d488" strokeWidth="1" />
      <ellipse cx="70" cy="71.5" rx="48" ry="5" fill="#3a1606" />
    </svg>
  );
}

/** Symmetric flourish divider (above/below the date). */
export function Flourish({ className = '' }: { className?: string }) {
  const half = (
    <g fill="none" stroke="url(#pp-gold)" strokeLinecap="round">
      <path d="M8,14 L82,14" strokeWidth="1.2" />
      <path d="M82,14 C90,4 104,4 104,12 C104,18 96,19 94,14" strokeWidth="1.8" />
      <path d="M96,14 C102,22 112,22 116,14" strokeWidth="1.5" />
      <circle cx="68" cy="14" r="1.8" fill="#f3d488" stroke="none" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 28" className={`flourish ${className}`} aria-hidden>
      {half}
      <g transform="translate(260 0) scale(-1 1)">{half}</g>
      {ring(6).map((a) => (
        <path key={a} d={petal(9, 1, 3)} transform={`translate(130 14) rotate(${a})`} fill="url(#pp-gold)" />
      ))}
      <circle cx="130" cy="14" r="2.6" fill="url(#pp-gem)" />
    </svg>
  );
}

/** Small scroll curl used beside the date and BYOB. */
export function Curl({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 70 40" className={`curl${flip ? ' flip' : ''}`} aria-hidden>
      <g fill="none" stroke="url(#pp-gold)" strokeLinecap="round">
        <path d="M68,20 L40,20" strokeWidth="1.3" />
        <path d="M40,20 C30,6 12,8 12,20 C12,29 24,30 26,22" strokeWidth="2" />
        <path d="M40,20 C32,32 20,34 14,30" strokeWidth="1.4" />
      </g>
      <circle cx="20" cy="20" r="3" fill="url(#pp-gem)" />
      <circle cx="52" cy="20" r="1.6" fill="#f3d488" />
    </svg>
  );
}

export const DIYAS: { x: number; s: number; y: number }[] = [
  { x: 4, s: 1.0, y: 0 },
  { x: 17, s: 0.78, y: 14 },
  { x: 31, s: 0.6, y: 26 },
  { x: 50, s: 0.52, y: 30 },
  { x: 69, s: 0.6, y: 26 },
  { x: 83, s: 0.78, y: 14 },
  { x: 96, s: 1.0, y: 0 },
];

