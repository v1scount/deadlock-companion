"use client";

import type { SchematicShape } from "@/types/schematic";
import type { ResolvedSchematicNumbers } from "@/lib/ability-props";

interface Props {
  shape: SchematicShape;
  numbers: ResolvedSchematicNumbers;
  label?: string;
}

/** Lightweight SVG/CSS teaching animation — no remote videos required. */
export function AbilitySchematicView({ shape, numbers, label }: Props) {
  const caption = formatCaption(shape, numbers);

  return (
    <div className="schematic-stage relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <svg
        viewBox="0 0 320 200"
        className="h-56 w-full"
        role="img"
        aria-label={label ?? `${shape} schematic`}
      >
        <defs>
          <radialGradient id="floor" cx="50%" cy="70%" r="55%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#09090b" />
          </radialGradient>
        </defs>
        <rect width="320" height="200" fill="url(#floor)" />
        {/* lane guides */}
        <line x1="20" y1="160" x2="300" y2="160" stroke="#3f3f46" strokeWidth="1" />
        <circle cx="80" cy="160" r="7" fill="#fafafa" opacity="0.9" />
        <text x="80" y="182" textAnchor="middle" fill="#71717a" fontSize="10">
          you
        </text>
        {renderShape(shape, numbers)}
      </svg>
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
        <span className="rounded bg-zinc-900/80 px-2 py-0.5 font-mono uppercase tracking-wide text-zinc-300">
          {shape}
        </span>
        {caption ? <span className="rounded bg-zinc-900/80 px-2 py-0.5">{caption}</span> : null}
      </div>
    </div>
  );
}

function formatCaption(shape: SchematicShape, n: ResolvedSchematicNumbers): string {
  const bits: string[] = [];
  if (n.range_m != null) bits.push(`${n.range_m}m range`);
  if (n.radius_m != null) bits.push(`${n.radius_m}m radius`);
  if (n.width_m != null) bits.push(`${n.width_m}m width`);
  if (n.angle_deg != null) bits.push(`${n.angle_deg}°`);
  if (n.delay_s != null) bits.push(`${n.delay_s}s delay`);
  if (n.duration_s != null && shape !== "aoe_delay") bits.push(`${n.duration_s}s`);
  return bits.join(" · ");
}

function renderShape(shape: SchematicShape, n: ResolvedSchematicNumbers) {
  switch (shape) {
    case "cone":
      return (
        <g className="schematic-cone">
          <path
            d="M80 160 L250 110 L250 190 Z"
            fill="#f97316"
            fillOpacity="0.25"
            stroke="#fb923c"
            strokeWidth="2"
          />
          <path
            d="M80 160 L220 125 L220 175 Z"
            fill="#fdba74"
            fillOpacity="0.35"
            className="schematic-pulse"
          />
        </g>
      );
    case "circle":
      return (
        <g>
          <circle
            cx="180"
            cy="130"
            r={scaleRadius(n.radius_m, 55)}
            fill="#38bdf8"
            fillOpacity="0.15"
            stroke="#7dd3fc"
            strokeWidth="2"
            className="schematic-ring"
          />
          <circle cx="180" cy="130" r="4" fill="#e0f2fe" />
        </g>
      );
    case "line":
      return (
        <g className="schematic-line">
          <line
            x1="90"
            y1="160"
            x2="280"
            y2="90"
            stroke="#a78bfa"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="280" cy="90" r="5" fill="#ddd6fe" />
        </g>
      );
    case "projectile":
      return (
        <g>
          <line
            x1="90"
            y1="150"
            x2="270"
            y2="90"
            stroke="#52525b"
            strokeDasharray="4 6"
            strokeWidth="1.5"
          />
          <circle cx="90" cy="150" r="5" fill="#fbbf24" className="schematic-projectile" />
        </g>
      );
    case "dash_trail":
      return (
        <g>
          <path
            d="M80 160 C120 140, 160 120, 240 100"
            fill="none"
            stroke="#f97316"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.35"
            className="schematic-trail"
          />
          <circle cx="80" cy="160" r="6" fill="#fdba74" className="schematic-dasher" />
        </g>
      );
    case "hook":
      return (
        <g>
          <path
            d="M90 155 Q180 40 260 120"
            fill="none"
            stroke="#34d399"
            strokeWidth="3"
            className="schematic-hook"
          />
          <circle cx="260" cy="120" r="6" fill="#6ee7b7" />
        </g>
      );
    case "aoe_delay":
      return (
        <g>
          <circle
            cx="170"
            cy="130"
            r={scaleRadius(n.radius_m, 60)}
            fill="#ef4444"
            fillOpacity="0.12"
            stroke="#f87171"
            strokeWidth="2"
            strokeDasharray="6 4"
            className="schematic-fuse"
          />
          <text x="170" y="134" textAnchor="middle" fill="#fecaca" fontSize="14" fontFamily="monospace">
            {n.delay_s != null ? `${n.delay_s}s` : "…"}
          </text>
        </g>
      );
    case "passive":
    default:
      return (
        <g>
          <rect
            x="130"
            y="70"
            width="100"
            height="70"
            rx="10"
            fill="#27272a"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            className="schematic-passive"
          />
          <text x="180" y="110" textAnchor="middle" fill="#e4e4e7" fontSize="12">
            passive
          </text>
          <circle cx="150" cy="95" r="4" fill="#fbbf24" className="schematic-stack" />
          <circle cx="170" cy="95" r="4" fill="#fbbf24" className="schematic-stack" />
          <circle cx="190" cy="95" r="4" fill="#fbbf24" className="schematic-stack" />
        </g>
      );
  }
}

function scaleRadius(meters: number | undefined, fallback: number): number {
  if (meters == null) return fallback;
  return Math.max(24, Math.min(70, meters * 3.2));
}
