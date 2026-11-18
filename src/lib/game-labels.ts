import type { GameMode, RankAsset } from "@/types/deadlock";

/** Public modes. Ranked badges exist on standard matches only. */
export const PUBLIC_GAME_MODES: {
  id: GameMode;
  label: string;
  ranked: boolean;
}[] = [
  { id: "normal", label: "Normal", ranked: true },
  { id: "street_brawl", label: "Street Brawl", ranked: false },
];

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI"] as const;

/** Badge filter bounds for one tier: `tier * 10 + subrank`, subranks 1–6. */
export function badgeRangeForTier(tier: number): { min: number; max: number } {
  return { min: tier * 10 + 1, max: tier * 10 + 6 };
}

export function rankImageUrl(
  rank: RankAsset | undefined,
  subrank: number,
): string | null {
  if (!rank) return null;
  if (subrank > 0) {
    const specific =
      rank.images[`large_subrank${subrank}_webp`] ??
      rank.images[`large_subrank${subrank}`];
    if (specific) return specific;
  }
  return rank.images.large_webp ?? rank.images.large ?? null;
}

/** `Obscurus` with no badge reads as unranked. */
export function rankLabel(
  ranks: RankAsset[],
  tier: number,
  subrank: number,
): string {
  if (tier <= 0) return "Unranked";
  const name = ranks.find((r) => r.tier === tier)?.name ?? `Rank ${tier}`;
  if (subrank <= 0) return name;
  const division = ROMAN[subrank] ?? String(subrank);
  return `${name} ${division}`;
}

export function labelForBadge(ranks: RankAsset[], badge: number | null | undefined): string | null {
  if (badge == null || badge <= 0) return null;
  const tier = Math.floor(badge / 10);
  const subrank = badge % 10;
  return rankLabel(ranks, tier, subrank);
}

/** Citadel game_mode / match_mode integers on match history rows. */
export function describeMatch(gameMode: number, matchMode: number): string {
  if (gameMode === 4) return "Street Brawl";
  if (gameMode === 5) return "Explore NYC";
  const matchModeLabel: Record<number, string> = {
    1: "Unranked",
    2: "Private",
    3: "Co-op",
    4: "Ranked",
    6: "Tutorial",
    7: "Hero Labs",
    8: "Placement",
  };
  if (gameMode === 1) return matchModeLabel[matchMode] ?? "Standard";
  return matchModeLabel[matchMode] ?? "Match";
}

export function formatWinRate(wins: number, matches: number): string {
  if (!matches) return "—";
  return `${((wins / matches) * 100).toFixed(1)}%`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatRate(total: number, matches: number): string {
  if (!matches) return "0";
  const n = total / matches;
  return n >= 100 ? n.toFixed(0) : n.toFixed(1);
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function formatAgo(unixSeconds: number, now = Date.now()): string {
  const delta = Math.max(0, Math.floor(now / 1000 - unixSeconds));
  if (delta < 60) return "just now";
  const minutes = Math.floor(delta / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString();
}
