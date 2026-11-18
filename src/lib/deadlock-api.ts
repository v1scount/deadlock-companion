/**
 * Typed fetch helpers for https://api.deadlock-api.com
 * Named helpers + `deadlockApi` object for Home / Live / Heroes tracks.
 */

import type {
  Ability,
  AccountId,
  ActiveMatch,
  AssetRef,
  AssetsHeroesQuery,
  EnemyStats,
  EnemyStatsEntry,
  EnemyStatsQuery,
  Hero,
  AnalyticsHeroStats,
  AnalyticsHeroStatsQuery,
  HeroStats,
  HeroStatsEntry,
  HeroStatsQuery,
  MatchHistoryEntry,
  PlayerMatchHistoryEntry,
  PlayerRank,
  RankAsset,
  SteamProfile,
} from "@/types/deadlock";

export const DEADLOCK_API_BASE = "https://api.deadlock-api.com";

export class DeadlockApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "DeadlockApiError";
    this.status = status;
  }
}

function toCsv(value: number | number[] | string | undefined): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.map(String).join(",");
  return String(value);
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    sp.set(key, String(value));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${DEADLOCK_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new DeadlockApiError(
      `deadlock-api ${path} failed: ${res.status}`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

/** Prefer single-player route when validating one account. */
export async function fetchSteamProfile(
  accountId: AccountId,
): Promise<SteamProfile | null> {
  try {
    return await apiGet<SteamProfile>(`/v1/players/${accountId}/steam`);
  } catch (err) {
    if (
      err instanceof DeadlockApiError &&
      (err.status === 404 || err.status === 403)
    ) {
      return null;
    }
    throw err;
  }
}

export async function fetchSteamProfiles(
  accountIds: AccountId[],
): Promise<SteamProfile[]> {
  if (accountIds.length === 0) return [];
  return apiGet<SteamProfile[]>(
    `/v1/players/steam${buildQuery({ account_ids: toCsv(accountIds) })}`,
  );
}

export async function fetchMatchHistory(
  accountId: AccountId,
): Promise<PlayerMatchHistoryEntry[]> {
  return apiGet<PlayerMatchHistoryEntry[]>(
    `/v1/players/${accountId}/match-history`,
  );
}

export async function fetchHeroStats(
  query: HeroStatsQuery,
): Promise<HeroStats[]> {
  return apiGet<HeroStats[]>(
    `/v1/players/hero-stats${buildQuery({
      account_ids: toCsv(query.account_ids),
      game_mode: query.game_mode,
      match_mode: query.match_mode,
      hero_ids: toCsv(query.hero_ids),
      min_unix_timestamp: query.min_unix_timestamp,
      max_unix_timestamp: query.max_unix_timestamp,
      min_duration_s: query.min_duration_s,
      max_duration_s: query.max_duration_s,
      min_networth: query.min_networth,
      max_networth: query.max_networth,
      min_average_badge: query.min_average_badge,
      max_average_badge: query.max_average_badge,
      min_match_id: query.min_match_id,
      max_match_id: query.max_match_id,
    })}`,
  );
}

export async function fetchAnalyticsHeroStats(
  query: AnalyticsHeroStatsQuery = {},
): Promise<AnalyticsHeroStats[]> {
  return apiGet<AnalyticsHeroStats[]>(
    `/v1/analytics/hero-stats${buildQuery({
      game_mode: query.game_mode,
      match_mode: query.match_mode,
      min_unix_timestamp: query.min_unix_timestamp,
      max_unix_timestamp: query.max_unix_timestamp,
      min_average_badge: query.min_average_badge,
      max_average_badge: query.max_average_badge,
    })}`,
  );
}

export async function fetchPlayerRank(accountId: AccountId): Promise<PlayerRank> {
  return apiGet<PlayerRank>(`/v1/players/${accountId}/rank`);
}

export async function fetchRankAssets(): Promise<RankAsset[]> {
  return apiGet<RankAsset[]>("/v1/assets/ranks");
}

export async function searchSteamProfiles(
  searchQuery: string,
  limit = 8,
): Promise<SteamProfile[]> {
  const q = searchQuery.trim();
  if (!q) return [];
  return apiGet<SteamProfile[]>(
    `/v1/players/steam-search${buildQuery({
      search_query: q,
      limit,
    })}`,
  );
}

export async function fetchEnemyStats(
  accountId: AccountId,
  query: EnemyStatsQuery = {},
): Promise<EnemyStats[]> {
  return apiGet<EnemyStats[]>(
    `/v1/players/${accountId}/enemy-stats${buildQuery({
      game_mode: query.game_mode,
      min_unix_timestamp: query.min_unix_timestamp,
      max_unix_timestamp: query.max_unix_timestamp,
      min_duration_s: query.min_duration_s,
      max_duration_s: query.max_duration_s,
      min_match_id: query.min_match_id,
      max_match_id: query.max_match_id,
      min_matches_played: query.min_matches_played,
      max_matches_played: query.max_matches_played,
    })}`,
  );
}

export async function fetchActiveMatches(
  accountId?: AccountId,
): Promise<ActiveMatch[]> {
  return apiGet<ActiveMatch[]>(
    `/v1/matches/active${buildQuery({
      account_id: accountId,
    })}`,
  );
}

/** @deprecated name — prefer fetchActiveMatches */
export async function fetchActiveMatch(
  accountId?: AccountId,
): Promise<ActiveMatch | null> {
  const list = await fetchActiveMatches(accountId);
  return list[0] ?? null;
}

export async function fetchHeroById(
  heroId: number,
  query: AssetsHeroesQuery = {},
): Promise<Hero | null> {
  try {
    return await apiGet<Hero>(
      `/v1/assets/heroes/${heroId}${buildQuery({
        language: query.language,
        client_version: query.client_version,
      })}`,
    );
  } catch (err) {
    if (err instanceof DeadlockApiError && err.status === 404) return null;
    throw err;
  }
}
export async function fetchHeroes(
  query: AssetsHeroesQuery = {},
): Promise<Hero[]> {
  return apiGet<Hero[]>(
    `/v1/assets/heroes${buildQuery({
      language: query.language,
      client_version: query.client_version,
      only_active: query.only_active,
    })}`,
  );
}

/**
 * Hero signature abilities live under items (type=ability).
 * Prefer hero.items.signature* order when the hero payload is available.
 */
export async function fetchHeroAbilities(
  heroId: number,
): Promise<Ability[]> {
  const items = await apiGet<Ability[]>(
    `/v1/assets/items/by-hero-id/${heroId}`,
  );
  const abilities = items.filter(
    (it) => (it.type ?? "ability") === "ability" && !String(it.class_name).includes("melee"),
  );

  let hero: Hero | null = null;
  try {
    hero = await fetchHeroById(heroId);
  } catch {
    hero = null;
  }

  const slots = ["signature1", "signature2", "signature3", "signature4"] as const;
  if (hero?.items) {
    const byClass = new Map(abilities.map((a) => [a.class_name, a]));
    const ordered: Ability[] = [];
    for (const slot of slots) {
      const cn = hero.items[slot];
      if (!cn) continue;
      const hit = byClass.get(cn);
      if (hit) ordered.push(hit);
    }
    if (ordered.length > 0) return ordered;
  }

  return abilities.filter((a) =>
    a.ability_type === "signature" || a.ability_type === "ultimate",
  );
}


export async function fetchAssetRef(_path: string): Promise<AssetRef | null> {
  return null;
}

export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export interface DeadlockApiMocks {
  steamProfile?: typeof fetchSteamProfile;
  matchHistory?: typeof fetchMatchHistory;
  heroStats?: typeof fetchHeroStats;
  analyticsHeroStats?: typeof fetchAnalyticsHeroStats;
  playerRank?: typeof fetchPlayerRank;
  rankAssets?: typeof fetchRankAssets;
  steamSearch?: typeof searchSteamProfiles;
  enemyStats?: typeof fetchEnemyStats;
  activeMatches?: typeof fetchActiveMatches;
  heroById?: typeof fetchHeroById;
  heroes?: typeof fetchHeroes;
  heroAbilities?: typeof fetchHeroAbilities;
  assetRef?: typeof fetchAssetRef;
}

/** Mock-friendly factory — pass `mocks` / custom `fetchImpl` in tests. */
export function createDeadlockApi(options?: {
  mocks?: DeadlockApiMocks;
}) {
  const m = options?.mocks ?? {};
  return {
    getSteamProfile: m.steamProfile ?? fetchSteamProfile,
    getSteamProfiles: fetchSteamProfiles,
    getMatchHistory: m.matchHistory ?? fetchMatchHistory,
    getHeroStats: m.heroStats ?? fetchHeroStats,
    getAnalyticsHeroStats: m.analyticsHeroStats ?? fetchAnalyticsHeroStats,
    getPlayerRank: m.playerRank ?? fetchPlayerRank,
    getRankAssets: m.rankAssets ?? fetchRankAssets,
    searchSteamProfiles: m.steamSearch ?? searchSteamProfiles,
    getEnemyStats: m.enemyStats ?? fetchEnemyStats,
    getActiveMatches: m.activeMatches ?? fetchActiveMatches,
    getActiveMatch: fetchActiveMatch,
    getHeroById: m.heroById ?? fetchHeroById,
    getHeroes: m.heroes ?? fetchHeroes,
    getHeroAbilities: m.heroAbilities ?? fetchHeroAbilities,
    getAssetRef: m.assetRef ?? fetchAssetRef,
  };
}

/** Object facade used by Home / Live / Heroes UI. */
export const deadlockApi = {
  getSteamProfile: fetchSteamProfile,
  getSteamProfiles: fetchSteamProfiles,
  getMatchHistory: fetchMatchHistory,
  getHeroStats: fetchHeroStats,
  getAnalyticsHeroStats: fetchAnalyticsHeroStats,
  getPlayerRank: fetchPlayerRank,
  getRankAssets: fetchRankAssets,
  searchSteamProfiles: searchSteamProfiles,
  getEnemyStats: fetchEnemyStats,
  getActiveMatches: fetchActiveMatches,
  getActiveMatch: fetchActiveMatch,
  getHeroById: fetchHeroById,
  getHeroes: fetchHeroes,
  getHeroAbilities: fetchHeroAbilities,
  getAssetRef: fetchAssetRef,
};

// Re-export entry aliases for tracks that imported stub names
export type { EnemyStatsEntry, HeroStatsEntry, MatchHistoryEntry };
