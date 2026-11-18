"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { deadlockApi } from "@/lib/deadlock-api";
import {
  loadHeroCatalog,
  loadRankAssets,
  matchPortrait,
  type HeroBrief,
} from "@/lib/catalog";
import {
  describeMatch,
  formatAgo,
  formatCount,
  formatDuration,
  formatRate,
  formatWinRate,
  rankImageUrl,
  rankLabel,
} from "@/lib/game-labels";
import type {
  HeroStats,
  PlayerMatchHistoryEntry,
  PlayerRank,
  RankAsset,
  SteamProfile,
} from "@/types/deadlock";

type Props = {
  accountId: number;
};

type HistoryFilter = "all" | "normal" | "street_brawl";

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "normal", label: "Normal" },
  { id: "street_brawl", label: "Street Brawl" },
];

export function PlayerProfile({ accountId }: Props) {
  const [profile, setProfile] = useState<SteamProfile | null>(null);
  const [rank, setRank] = useState<PlayerRank | null>(null);
  const [ranks, setRanks] = useState<RankAsset[]>([]);
  const [heroes, setHeroes] = useState<Map<number, HeroBrief>>(new Map());
  const [history, setHistory] = useState<PlayerMatchHistoryEntry[]>([]);
  const [historyNote, setHistoryNote] = useState<string | null>(null);
  const [heroStats, setHeroStats] = useState<HeroStats[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [live, setLive] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [seenAccount, setSeenAccount] = useState(accountId);
  if (seenAccount !== accountId) {
    setSeenAccount(accountId);
    setState("loading");
    setError(null);
    setHistoryNote(null);
    setFilter("all");
    setProfile(null);
    setRank(null);
    setHistory([]);
    setHeroStats([]);
    setLive(false);
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [steam, playerRank, matches, stats, rankAssets, heroMap] = await Promise.all([
        deadlockApi.getSteamProfile(accountId).catch(() => null),
        deadlockApi.getPlayerRank(accountId).catch(() => null),
        deadlockApi
          .getMatchHistory(accountId)
          .then((rows) => ({ ok: true as const, rows }))
          .catch((err: unknown) => ({ ok: false as const, err })),
        deadlockApi.getHeroStats({ account_ids: accountId }).catch(() => [] as HeroStats[]),
        loadRankAssets().catch(() => [] as RankAsset[]),
        loadHeroCatalog().catch(() => new Map<number, HeroBrief>()),
      ]);
      if (cancelled) return;
      setProfile(steam);
      setRank(playerRank);
      if (matches.ok) {
        setHistory([...matches.rows].sort((a, b) => b.start_time - a.start_time));
      } else {
        setHistory([]);
        setHistoryNote(
          matches.err instanceof Error ? matches.err.message : "Match history is unavailable.",
        );
      }
      setHeroStats([...stats].sort((a, b) => b.matches_played - a.matches_played));
      setRanks(rankAssets);
      setHeroes(heroMap);
      setState("ready");
    })().catch((err: unknown) => {
      if (cancelled) return;
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to load player");
    });

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const matches = await deadlockApi.getActiveMatches(accountId);
        if (!cancelled) setLive(matches.length > 0);
      } catch {
        if (!cancelled) setLive(false);
      }
    }
    void check();
    const handle = window.setInterval(() => void check(), 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [accountId]);

  const totals = useMemo(() => {
    return heroStats.reduce(
      (sum, row) => {
        sum.matches += row.matches_played;
        sum.wins += row.wins;
        sum.kills += row.kills;
        sum.deaths += row.deaths;
        sum.assists += row.assists;
        return sum;
      },
      { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0 },
    );
  }, [heroStats]);

  const recent = history.slice(0, 12);
  const filtered = history.filter((match) => matchesHistoryFilter(match, filter));
  const tier = ranks.find((item) => item.tier === (rank?.rank ?? -1));
  const badgeUrl = rank && rank.rank > 0 ? rankImageUrl(tier, rank.subrank) : null;
  const name = profile?.personaname || `Account ${accountId}`;
  const losses = Math.max(0, totals.matches - totals.wins);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:py-8">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-200">
          ← Search
        </Link>
      </p>

      <header className="panel flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          {profile?.avatarfull || profile?.avatarmedium ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarfull || profile.avatarmedium}
              alt=""
              className="h-20 w-20 shrink-0 rounded-xl bg-zinc-800 object-cover"
            />
          ) : (
            <div className="h-20 w-20 shrink-0 rounded-xl bg-zinc-800" />
          )}
          <div className="min-w-0">
            <h1 className="font-display truncate text-3xl uppercase text-[#f6efe4] sm:text-4xl">
              {state === "loading" ? "Loading player…" : name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-300">
              {badgeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={badgeUrl} alt="" className="h-7 w-7 object-contain" />
              ) : null}
              <span title={rank && rank.rank > 0 ? "From the latest ranked match" : undefined}>
                {rank ? rankLabel(ranks, rank.rank, rank.subrank) : "Rank unavailable"}
              </span>
            </div>
            {state === "ready" && totals.matches > 0 ? (
              <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-medium text-zinc-100">
                  {formatCount(totals.wins)}W {formatCount(losses)}L
                </span>
                <span className="text-lg font-semibold text-zinc-50">
                  {formatWinRate(totals.wins, totals.matches)}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatCount(totals.matches)} matches
                  {profile ? ` · ${formatCount(profile.matches_played_last_30d)} in 30 days` : ""}
                </span>
              </p>
            ) : null}
            {profile?.profileurl ? (
              <a
                href={profile.profileurl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-zinc-500 hover:text-amber-400"
              >
                Steam profile
              </a>
            ) : null}
          </div>
        </div>
        <LiveLink accountId={accountId} live={live} />
      </header>

      {state === "error" ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : state === "loading" ? (
        <p className="text-sm text-zinc-500">Loading matches and heroes…</p>
      ) : (
        <>
          {recent.length > 0 ? (
            <section aria-label="Recent games">
              <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-400">
                Last {recent.length} games
              </h2>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Stat label="Avg kills" value={formatRate(sum(recent, (m) => m.player_kills), recent.length)} />
                <Stat label="Avg deaths" value={formatRate(sum(recent, (m) => m.player_deaths), recent.length)} />
                <Stat label="Avg assists" value={formatRate(sum(recent, (m) => m.player_assists), recent.length)} />
                <Stat label="Avg souls" value={formatCount(average(recent, (m) => m.net_worth))} />
                <Stat
                  label="Win rate"
                  value={formatWinRate(
                    recent.filter((m) => m.player_match_outcome === 1).length,
                    recent.length,
                  )}
                />
              </dl>
            </section>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)]">
            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl uppercase text-[#f6efe4]">
                  Match history
                </h2>
                <div className="flex rounded-lg border border-zinc-800 p-0.5" role="group" aria-label="Match mode">
                  {FILTERS.map((item) => {
                    const selected = item.id === filter;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setFilter(item.id)}
                        className={`font-display rounded-sm px-2.5 py-1 text-xs uppercase ${
                          selected ? "bg-[#ff7a18] text-[#1a0e06]" : "text-[#cbbba6] hover:text-[#f6efe4]"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {historyNote ? <p className="mb-2 text-sm text-amber-400/90">{historyNote}</p> : null}
              <ul className="panel divide-y divide-[rgba(244,214,176,0.08)]">
                {filtered.length === 0 ? (
                  <li className="px-3 py-4 text-sm text-zinc-500">No matches stored.</li>
                ) : (
                  filtered.slice(0, 25).map((match) => {
                    const hero = heroes.get(match.hero_id);
                    const outcome = outcomeOf(match.player_match_outcome);
                    const portrait = matchPortrait(hero, match.player_match_outcome);
                    const perMin =
                      match.match_duration_s > 0
                        ? match.last_hits / (match.match_duration_s / 60)
                        : 0;
                    return (
                      <li
                        key={`${match.match_id}-${match.start_time}`}
                        className="flex items-center gap-3 px-3 py-3"
                      >
                        <Link
                          href={`/heroes/${match.hero_id}`}
                          className="relative shrink-0"
                        >
                          {portrait ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={portrait}
                              alt=""
                              className="h-[104px] w-[74px] bg-[#2a2118] object-cover object-top"
                            />
                          ) : (
                            <span className="block h-[104px] w-[74px] bg-[#2a2118]" />
                          )}
                          <span
                            className={`stamp ${
                              match.player_match_outcome === 1
                                ? "stamp-win"
                                : match.player_match_outcome === 2
                                  ? "stamp-loss"
                                  : "bg-[#2a2118] text-[#f6efe4]"
                            }`}
                          >
                            {outcome.label}
                          </span>
                        </Link>
                        <Link
                          href={`/heroes/${match.hero_id}`}
                          className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[#f6efe4] hover:text-[#ff7a18]"
                        >
                          <span className="min-w-0">
                            <span className="font-display block truncate text-xl uppercase">
                              {hero?.name ?? `Hero ${match.hero_id}`}
                            </span>
                            <span className="block truncate text-[11px] text-zinc-500">
                              {describeMatch(match.game_mode, match.match_mode)} ·{" "}
                              {formatDuration(match.match_duration_s)} · {formatAgo(match.start_time)}
                            </span>
                          </span>
                        </Link>
                        <div className="text-right">
                          <p className="font-mono text-xs text-zinc-200">
                            {match.player_kills}/{match.player_deaths}/{match.player_assists}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {kdaRatio(match.player_kills, match.player_deaths, match.player_assists)}{" "}
                            · {formatCount(match.net_worth)} · {match.last_hits} CS ({perMin.toFixed(1)}/m)
                          </p>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>

            <section>
              <h2 className="font-display mb-2 text-xl uppercase text-[#f6efe4]">
                Top heroes
              </h2>
              <ul className="panel divide-y divide-[rgba(244,214,176,0.08)]">
                {heroStats.length === 0 ? (
                  <li className="px-3 py-4 text-sm text-zinc-500">No hero stats.</li>
                ) : (
                  heroStats.slice(0, 8).map((row) => {
                    const hero = heroes.get(row.hero_id);
                    return (
                      <li key={row.hero_id} className="flex items-center gap-3 px-3 py-2.5">
                        <Link
                          href={`/heroes/${row.hero_id}`}
                          className="flex min-w-0 flex-1 items-center gap-2 text-sm text-zinc-100 hover:text-amber-400"
                        >
                        {hero?.card || hero?.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={hero.card || hero.icon || ""}
                            alt=""
                            className="h-14 w-10 bg-[#2a2118] object-cover object-top"
                          />
                        ) : null}
                        <span className="min-w-0">
                          <span className="font-display block truncate text-lg uppercase">
                            {hero?.name ?? `Hero ${row.hero_id}`}
                          </span>
                            <span className="block text-[11px] text-zinc-500">
                              {kdaRatio(row.kills, row.deaths, row.assists)} ·{" "}
                              {formatCount(row.matches_played)} games
                            </span>
                          </span>
                        </Link>
                        <span className="text-sm font-medium text-zinc-200">
                          {formatWinRate(row.wins, row.matches_played)}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function LiveLink({ accountId, live }: { accountId: number; live: boolean }) {
  return (
    <Link
      href={`/live?account=${accountId}`}
      aria-label={live ? "Match in progress. Open live." : "Open live"}
      className={`font-display inline-flex shrink-0 items-center justify-center gap-2 self-start px-4 py-2 text-sm uppercase ${
        live
          ? "bg-[#3ddc97] text-[#10261c] shadow-[0_0_24px_-8px] shadow-[#3ddc97] hover:bg-[#67e8b4]"
          : "border border-[rgba(244,214,176,0.2)] text-[#f6efe4] hover:border-[#ff7a18]"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-zinc-950" : "bg-zinc-600"}`}
        aria-hidden="true"
      />
      Live
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-zinc-100">{value}</dd>
    </div>
  );
}

function matchesHistoryFilter(match: PlayerMatchHistoryEntry, filter: HistoryFilter): boolean {
  if (filter === "normal") return match.game_mode === 1;
  if (filter === "street_brawl") return match.game_mode === 4;
  return true;
}

function outcomeOf(code: number): { label: string; className: string } {
  if (code === 1) return { label: "Victory", className: "text-emerald-400" };
  if (code === 2) return { label: "Defeat", className: "text-red-400" };
  if (code === 3 || code === 4) return { label: "Penalized", className: "text-zinc-500" };
  return { label: "Unscored", className: "text-zinc-500" };
}

function kdaRatio(kills: number, deaths: number, assists: number): string {
  const value = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  return `${value.toFixed(2)}:1`;
}

function sum(
  rows: PlayerMatchHistoryEntry[],
  pick: (row: PlayerMatchHistoryEntry) => number,
): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function average(
  rows: PlayerMatchHistoryEntry[],
  pick: (row: PlayerMatchHistoryEntry) => number,
): number {
  if (rows.length === 0) return 0;
  return sum(rows, pick) / rows.length;
}
