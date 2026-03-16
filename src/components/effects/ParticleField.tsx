import { useRef, useEffect } from "react";

interface Particle {
  x: number; y: number; vx: number; vy: number; r: number; o: number;
}

export default function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let id: number;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => { W = window.innerWidth; H = window.innerHeight; cv.width = W; cv.height = H; };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(50, Math.floor((W * H) / 30000));
    const pts: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.8 + 0.4, o: Math.random() * 0.3 + 0.08,
    }));

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(199,125,255,${p.o})`; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(107,47,160,${0.06 * (1 - d / 130)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      id = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-50" />;
}
