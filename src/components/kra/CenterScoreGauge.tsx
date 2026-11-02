import { useEffect, useMemo, useState } from "react";
import { NumberTicker } from "./NumberTicker";

interface CenterScoreGaugeProps {
  score: number | null;
}

const CX = 180;
const CY = 168;
const RADIUS = 132;
const STROKE = 22;

const DOTS = Array.from({ length: 18 }, (_, i) => 0.045 + i * (0.91 / 17));

export function CenterScoreGauge({ score }: CenterScoreGaugeProps) {
  const value = score === null || score === undefined ? null : Math.max(0, Math.min(100, Math.round(score)));
  const shown = value ?? 0;
  const [drawn, setDrawn] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || shown === 0) {
      setDrawn(shown);
      return;
    }

    let frame = 0;
    const duration = 1100;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setDrawn(shown * ease(t));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, 140);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [shown]);

  const arc = `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;
  const drawnClamped = Math.max(0, Math.min(100, drawn));
  const tipAngle = Math.PI * (1 - drawnClamped / 100);
  const tipX = CX + RADIUS * Math.cos(tipAngle);
  const tipY = CY - RADIUS * Math.sin(tipAngle);

  const dots = useMemo(() => {
    const dotRadius = RADIUS - STROKE * 0.95;
    return DOTS.map((frac) => {
      const angle = Math.PI * (1 - frac);
      return {
        x: CX + dotRadius * Math.cos(angle),
        y: CY - dotRadius * Math.sin(angle),
      };
    });
  }, []);

  const title = value === null ? "No score yet" : "Center score";

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <svg viewBox="0 0 360 196" className="h-auto w-full overflow-visible" aria-hidden="true">
        <path
          d={arc}
          fill="none"
          stroke="#e4e6eb"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {drawnClamped > 0 && (
          <path
            d={arc}
            fill="none"
            stroke="#98f000"
            strokeWidth={STROKE}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - drawnClamped}
          />
        )}
        {dots.map((dot) => (
          <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r="2.15" fill="#2a2d32" />
        ))}
        {drawnClamped > 0.5 && (
          <g>
            <circle cx={tipX} cy={tipY} r={STROKE / 2 + 3.5} fill="#ffffff" />
            <circle cx={tipX} cy={tipY} r={STROKE / 2 - 0.5} fill="#0A2214" />
          </g>
        )}
      </svg>

      <div className="pointer-events-none absolute bottom-5 left-1/2 flex w-max max-w-full -translate-x-1/2 flex-col items-center text-center">
        <p className="flex items-baseline justify-center font-sans text-[52px] font-bold leading-none tracking-[-0.05em] text-[#0A2214] tabular-nums">
          {value !== null ? (
            <>
              <NumberTicker value={value} />
              <span className="ml-0.5 text-[30px] font-bold opacity-60">%</span>
            </>
          ) : (
            "—"
          )}
        </p>
        <p className="mt-1.5 font-sans text-[11px] font-medium uppercase leading-none tracking-[0.18em] text-[#8b8e94]">
          {title}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-1">
        <span className="font-sans text-[13px] font-medium text-[#8b8e94]">0</span>
        <span className="font-sans text-[13px] font-medium tabular-nums text-[#8b8e94]">100</span>
      </div>
    </div>
  );
}
