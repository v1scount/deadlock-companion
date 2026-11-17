/** Live-match threat tags shown over ability clips. */

export type AbilityThreat =
  | "stun"
  | "slow"
  | "sleep"
  | "silence"
  | "displace"
  | "root"
  | "invis"
  | "dash"
  | "burn"
  | "damage_amp";

export interface ThreatMeta {
  id: AbilityThreat;
  label: string;
  /** Short glyph for dense overlays (SVG-free text). */
  mark: string;
  /** Tailwind classes for the badge chip. */
  className: string;
}

export const THREAT_META: Record<AbilityThreat, ThreatMeta> = {
  stun: {
    id: "stun",
    label: "Stun",
    mark: "Stun",
    className: "border-rose-500/50 bg-rose-950/90 text-rose-100",
  },
  slow: {
    id: "slow",
    label: "Slow",
    mark: "Slow",
    className: "border-sky-500/50 bg-sky-950/90 text-sky-100",
  },
  sleep: {
    id: "sleep",
    label: "Sleep",
    mark: "Sleep",
    className: "border-violet-500/50 bg-violet-950/90 text-violet-100",
  },
  silence: {
    id: "silence",
    label: "Silence",
    mark: "Mute",
    className: "border-fuchsia-500/50 bg-fuchsia-950/90 text-fuchsia-100",
  },
  displace: {
    id: "displace",
    label: "Displace",
    mark: "Move",
    className: "border-orange-500/50 bg-orange-950/90 text-orange-100",
  },
  root: {
    id: "root",
    label: "Root",
    mark: "Root",
    className: "border-amber-500/50 bg-amber-950/90 text-amber-100",
  },
  invis: {
    id: "invis",
    label: "Invis",
    mark: "Invis",
    className: "border-zinc-400/40 bg-zinc-900/90 text-zinc-100",
  },
  dash: {
    id: "dash",
    label: "Dash",
    mark: "Dash",
    className: "border-emerald-500/50 bg-emerald-950/90 text-emerald-100",
  },
  burn: {
    id: "burn",
    label: "Burn",
    mark: "Burn",
    className: "border-red-500/50 bg-red-950/90 text-red-100",
  },
  damage_amp: {
    id: "damage_amp",
    label: "Amp",
    mark: "Amp",
    className: "border-yellow-500/50 bg-yellow-950/90 text-yellow-100",
  },
};
