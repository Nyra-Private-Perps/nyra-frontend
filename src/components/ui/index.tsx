import { useState, useRef, type ReactNode, type CSSProperties } from "react";
import { C, type BadgeVariant, type BtnVariant, type BtnSize } from "@/lib/tokens";

// ─── GlowCard ─────────────────────────────
interface GlowCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  glow?: string;
  onClick?: () => void;
  active?: boolean;
  noPad?: boolean;
}

export function GlowCard({ children, className = "", style = {}, glow = C.primary, onClick, active, noPad }: GlowCardProps) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className={`relative overflow-hidden transition-all duration-300 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: `linear-gradient(145deg, ${C.deep}, ${C.core}30)`,
        border: `1px solid ${(h || active) ? glow + "45" : C.primary + "14"}`,
        borderRadius: 16,
        padding: noPad ? 0 : 24,
        transform: h && onClick ? "translateY(-2px)" : "none",
        boxShadow: (h || active) ? `0 20px 60px ${glow}10, inset 0 1px 0 ${glow}12` : `0 2px 12px ${C.void}60`,
        ...style,
      }}
    >
      <div
        className="absolute top-0 left-[8%] right-[8%] h-px transition-all duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${glow}${h ? "25" : "08"}, transparent)` }}
      />
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────
interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
}

const badgeColors: Record<BadgeVariant, { bg: string; bd: string; tx: string }> = {
  default: { bg: `${C.primary}15`, bd: `${C.primary}30`, tx: C.glow },
  success: { bg: `${C.success}10`, bd: `${C.success}25`, tx: C.success },
  warning: { bg: `${C.warning}10`, bd: `${C.warning}25`, tx: C.warning },
  danger: { bg: `${C.danger}10`, bd: `${C.danger}25`, tx: C.danger },
  active: { bg: `${C.accent}08`, bd: `${C.accent}20`, tx: C.accent },
  // ADD THIS LINE:
  muted: { bg: `${C.primary}08`, bd: `${C.primary}15`, tx: C.muted }, 
  secondary: { bg: `${C.primary}12`, bd: `${C.primary}25`, tx: C.accent }, 
};

export function Badge({ children, variant = "default", pulse = false }: BadgeProps) {
  const c = badgeColors[variant] || badgeColors.default; 
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase"
      style={{ padding: "4px 12px", borderRadius: 100, background: c.bg, border: `1px solid ${c.bd}`, color: c.tx }}
    >
      <span
        className={pulse ? "anim-pulse-glow" : ""}
        style={{ width: 5, height: 5, borderRadius: "50%", background: c.tx, boxShadow: `0 0 8px ${c.tx}50`, flexShrink: 0 }}
      />
      {children}
    </span>
  );
}

// ─── Btn ──────────────────────────────────
interface BtnProps {
  children: ReactNode;
  variant?: BtnVariant;
  full?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  size?: BtnSize;
}

export function Btn({ children, variant = "primary", full = false, onClick, className = "", style = {}, disabled = false, size = "md" }: BtnProps) {
  const [h, setH] = useState(false);
  const map: Record<BtnVariant, { bg: string; c: string; sh: string; bd: string }> = {
    primary: { bg: h ? C.vivid : C.primary, c: C.pure, sh: `0 8px 28px ${C.primary}${h ? "55" : "30"}`, bd: "none" },
    secondary: { bg: h ? `${C.primary}15` : "transparent", c: C.accent, sh: "none", bd: `1px solid ${h ? C.primary : C.primary + "30"}` },
    success: { bg: h ? "#00C866" : C.success, c: C.void, sh: `0 8px 28px ${C.success}${h ? "45" : "20"}`, bd: "none" },
    danger: { bg: h ? "#E04040" : C.danger, c: C.pure, sh: `0 8px 28px ${C.danger}${h ? "45" : "20"}`, bd: "none" },
    ghost: { bg: h ? `${C.primary}10` : "transparent", c: C.glow, sh: "none", bd: "1px solid transparent" },
    outline: { bg: "transparent", c: C.accent, sh: "none", bd: `1px solid ${C.accent}35` },
  };
  const b = map[variant];
  const pad = size === "sm" ? "8px 14px" : size === "lg" ? "16px 32px" : "13px 24px";
  const fs = size === "sm" ? 12 : size === "lg" ? 15 : 13;
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className={`inline-flex items-center justify-center gap-2 font-body font-semibold transition-all duration-200 ${full ? "w-full" : ""} ${className}`}
      style={{
        background: disabled ? C.core : b.bg, color: disabled ? C.muted : b.c,
        border: b.bd, boxShadow: disabled ? "none" : b.sh,
        padding: pad, borderRadius: 10, fontSize: fs,
        cursor: disabled ? "not-allowed" : "pointer",
        transform: h && !disabled ? "translateY(-1px)" : "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────
interface InputProps {
  label?: string;
  value?: string;
  onChange?: (val: string) => void;
  suffix?: string;
  placeholder?: string;
  mono?: boolean;
}

export function Input({ label, value, onChange, suffix, placeholder, mono = false }: InputProps) {
  const [f, setF] = useState(false);
  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-[7px] font-mono text-[10px] font-medium tracking-[2.5px] uppercase" style={{ color: C.muted }}>{label}</label>
      )}
      <div
        className="flex items-center transition-all duration-200"
        style={{
          background: `${C.void}CC`, borderRadius: 10,
          border: `1px solid ${f ? C.primary + "55" : C.primary + "15"}`,
          padding: "0 16px",
          boxShadow: f ? `0 0 0 3px ${C.primary}0C` : "none",
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setF(true)}
          onBlur={() => setF(false)}
          className="flex-1 py-[13px] bg-transparent border-none outline-none"
          style={{ color: C.white, fontFamily: mono ? "'JetBrains Mono', monospace" : "'Outfit', sans-serif", fontSize: 14 }}
        />
        {suffix && <span className="font-mono text-xs font-semibold" style={{ color: C.glow }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ─── FlowViz ──────────────────────────────
export function FlowViz({ steps }: { steps: string[] }) {
  return (
    <div className="flex items-center gap-0 py-3 flex-wrap">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div
            className="anim-fade-up font-mono text-[10px] font-medium whitespace-nowrap"
            style={{
              padding: "7px 14px", borderRadius: 8,
              background: `${C.primary}10`, border: `1px solid ${C.primary}20`,
              color: C.glow, animationDelay: `${i * 0.12}s`,
            }}
          >{s}</div>
          {i < steps.length - 1 && <div className="px-[5px] text-[9px]" style={{ color: C.glow + "50" }}>▸</div>}
        </div>
      ))}
    </div>
  );
}

// ─── QRCode ───────────────────────────────
export function QRCode({ size = 180 }: { size?: number }) {
  const g = 15;
  const cells = useRef(Array.from({ length: g * g }, () => Math.random() > 0.45));
  return (
    <div style={{ width: size, height: size, padding: 10, borderRadius: 14, background: C.pure, display: "grid", gridTemplateColumns: `repeat(${g}, 1fr)`, gap: 1 }}>
      {cells.current.map((f, i) => {
        const corner = (Math.floor(i / g) < 3 && (i % g) < 3) || (Math.floor(i / g) < 3 && (i % g) >= g - 3) || (Math.floor(i / g) >= g - 3 && (i % g) < 3);
        return <div key={i} className="anim-fade-up" style={{ borderRadius: 1, background: corner || f ? C.void : "transparent", animationDelay: `${(i % 20) * 0.015}s` }} />;
      })}
    </div>
  );
}

// ─── SignatureViz ──────────────────────────
export function SignatureViz({ active }: { active: boolean }) {
  return (
    <div
      className="mx-auto flex items-center justify-center transition-all duration-400"
      style={{
        width: 100, height: 100, borderRadius: 22,
        background: `linear-gradient(135deg, ${C.core}, ${C.mid}40)`,
        border: `2px solid ${active ? C.accent + "45" : C.primary + "25"}`,
        boxShadow: active ? `0 0 50px ${C.primary}25` : "none",
      }}
    >
      {active ? (
        <div className="relative w-11 h-11">
          <div className="absolute inset-0 rounded-full" style={{ border: `3px solid ${C.accent}`, borderTopColor: "transparent", borderRightColor: "transparent", animation: "spin 1s linear infinite" }} />
          <div className="absolute rounded-full" style={{ inset: 8, border: `2px solid ${C.glow}50`, borderBottomColor: "transparent", animation: "spin 1.5s linear infinite reverse" }} />
          <div className="absolute rounded-full anim-pulse-glow" style={{ inset: 16, background: `${C.accent}35` }} />
        </div>
      ) : (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.glow} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
    </div>
  );
}

// ─── MiniChart ────────────────────────────
export function MiniChart({ data, color = C.glow, w = 320, h = 140 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data?.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h * 0.85 - h * 0.075}`).join(" ");
  const area = pts + ` ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#cg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${color}40)` }} />
    </svg>
  );
}
