import { useEffect, useRef } from 'react';

interface P {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  a: number;
  tw: number;
  hue: number;
}

/** Golden sparkles and soft bokeh drifting upward, drawn on a canvas that fills its parent. */
export default function Sparkles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let particles: P[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const spawn = (anywhere: boolean): P => {
      const big = Math.random() < 0.14;
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        r: big ? 3 + Math.random() * 5 : 0.6 + Math.random() * 1.8,
        vy: -(0.15 + Math.random() * 0.55),
        vx: (Math.random() - 0.5) * 0.25,
        a: big ? 0.18 + Math.random() * 0.2 : 0.5 + Math.random() * 0.5,
        tw: Math.random() * Math.PI * 2,
        hue: 32 + Math.random() * 18,
      };
    };

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, (w * h) / 9000));
      particles = Array.from({ length: count }, () => spawn(true));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        if (!reduced) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(t / 1400 + p.tw) * 0.12;
          if (p.y < -10) Object.assign(p, spawn(false));
        }
        const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin(t / 380 + p.tw * 3);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, `hsla(${p.hue}, 100%, 82%, ${p.a * twinkle})`);
        g.addColorStop(0.35, `hsla(${p.hue}, 95%, 60%, ${p.a * twinkle * 0.5})`);
        g.addColorStop(1, `hsla(${p.hue}, 90%, 50%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="sparkles" aria-hidden />;
}
