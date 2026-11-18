"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { deadlockApi } from "@/lib/deadlock-api";
import {
  badgeRangeForTier,
  formatCount,
  formatRate,
  formatWinRate,
  labelForBadge,
  PUBLIC_GAME_MODES,
} from "@/lib/game-labels";
import { loadHeroCatalog, loadRankAssets, type HeroBrief } from "@/lib/catalog";
import { isSteamParseVanity, parseSteamInput } from "@/lib/steamid";
import type { AnalyticsHeroStats, GameMode, RankAsset, SteamProfile } from "@/types/deadlock";

const FALLBACK_RANKS = [
  { tier: 1, name: "Initiate" },
  { tier: 2, name: "Seeker" },
  { tier: 3, name: "Acolyte" },
  { tier: 4, name: "Sentinel" },
  { tier: 5, name: "Mystic" },
  { tier: 6, name: "Ritualist" },
  { tier: 7, name: "Emissary" },
  { tier: 8, name: "Oracle" },
  { tier: 9, name: "Phantom" },
  { tier: 10, name: "Ascendant" },
  { tier: 11, name: "Eternus" },
] as const;

type RankFilter = "all" | number;

type SearchOption =
  | { key: string; kind: "direct"; accountId: number; title: string; detail: string }
  | { key: string; kind: "player"; accountId: number; title: string; detail: string; avatar: string | null }
  | { key: string; kind: "vanity"; vanity: string; title: string; detail: string };

export function SearchHome() {
  const router = useRouter();
  const listId = useId();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SteamProfile[]>([]);
  const [resultQuery, setResultQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [optionTrack, setOptionTrack] = useState("");
  const [resolving, setResolving] = useState(false);

  const [mode, setMode] = useState<GameMode>("normal");
  const [rankTier, setRankTier] = useState<RankFilter>("all");
  const [ranks, setRanks] = useState<RankAsset[]>([]);
  const [heroes, setHeroes] = useState<Map<number, HeroBrief>>(new Map());
  const [stats, setStats] = useState<AnalyticsHeroStats[]>([]);
  const [statsState, setStatsState] = useState<"loading" | "ready" | "error">("loading");

  const modeMeta = PUBLIC_GAME_MODES.find((m) => m.id === mode) ?? PUBLIC_GAME_MODES[0];
  const rankEnabled = modeMeta.ranked;

  useEffect(() => {
    let cancelled = false;
    void loadRankAssets()
      .then((rows) => {
        if (!cancelled) setRanks(rows);
      })
      .catch(() => {
        if (!cancelled) setRanks([]);
      });
    void loadHeroCatalog()
      .then((map) => {
        if (!cancelled) setHeroes(map);
      })
      .catch(() => {
        if (!cancelled) setHeroes(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      void deadlockApi
        .searchSteamProfiles(q, 8)
        .then((rows) => {
          if (cancelled) return;
          setResults(rows);
          setResultQuery(q);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setResults([]);
          setSearchError(err instanceof Error ? err.message : "Search failed");
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const badge =
      rankEnabled && typeof rankTier === "number" ? badgeRangeForTier(rankTier) : null;
    const minUnix = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    void deadlockApi
      .getAnalyticsHeroStats({
        game_mode: mode,
        match_mode: badge ? "ranked" : undefined,
        min_unix_timestamp: minUnix,
        min_average_badge: badge?.min,
        max_average_badge: badge?.max,
      })
      .then((rows) => {
        if (cancelled) return;
        setStats(rows);
        setStatsState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStats([]);
        setStatsState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [mode, rankEnabled, rankTier]);

  const trimmedQuery = query.trim();
  const options = useMemo(
    () =>
      buildOptions(
        query,
        trimmedQuery.length >= 2 && resultQuery === trimmedQuery ? results : [],
        ranks,
        searching && trimmedQuery.length >= 2,
      ),
    [query, trimmedQuery, resultQuery, results, ranks, searching],
  );
  const optionKey = options.map((option) => option.key).join("\n");
  if (optionTrack !== optionKey) {
    setOptionTrack(optionKey);
    setActive(options.length > 0 ? 0 : -1);
  }

  const top = useMemo(() => {
    const played = stats.filter((row) => row.matches > 0);
    const floor =
      [200, 50, 1].find(
        (min) => played.filter((row) => row.matches >= min).length >= 10,
      ) ?? 1;
    return played
      .filter((row) => row.matches >= floor)
      .sort((a, b) => {
        const rate = b.wins / b.matches - a.wins / a.matches;
        if (rate !== 0) return rate;
        return b.matches - a.matches;
      })
      .slice(0, 10);
  }, [stats]);

  const playedMatches = useMemo(
    () => stats.reduce((sum, row) => sum + row.matches, 0),
    [stats],
  );

  async function openAccount(accountId: number) {
    setOpen(false);
    router.push(`/player/${accountId}`);
  }

  async function openVanity(vanity: string) {
    setResolving(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/steam/resolve-vanity?vanity=${encodeURIComponent(vanity)}`,
      );
      const body = (await res.json().catch(() => null)) as {
        accountId?: number;
        error?: string;
      } | null;
      if (!res.ok || body?.accountId == null) {
        setSearchError(body?.error ?? "Could not resolve that Steam name.");
        return;
      }
      await openAccount(body.accountId);
    } catch {
      setSearchError("Could not resolve that Steam name.");
    } finally {
      setResolving(false);
    }
  }

  async function choose(option: SearchOption) {
    if (option.kind === "vanity") {
      await openVanity(option.vanity);
      return;
    }
    await openAccount(option.accountId);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    const picked = active >= 0 ? options[active] : options[0];
    if (picked) {
      await choose(picked);
      return;
    }
    const parsed = parseSteamInput(query);
    if (!parsed.ok) {
      setSearchError(query.trim() ? parsed.error : null);
      return;
    }
    if (isSteamParseVanity(parsed)) {
      await openVanity(parsed.vanity);
      return;
    }
    await openAccount(parsed.accountId);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (options.length === 0 ? -1 : (index + 1) % options.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((index) =>
        options.length === 0 ? -1 : (index - 1 + options.length) % options.length,
      );
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const rankName =
    typeof rankTier === "number"
      ? (ranks.find((rank) => rank.tier === rankTier)?.name ?? `Tier ${rankTier}`)
      : "All ranks";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:py-8">
      <form onSubmit={(event) => void onSubmit(event)} className="relative">
        <p className="font-display text-3xl uppercase text-[#f6efe4] sm:text-4xl">Find a player</p>
        <label htmlFor={inputId} className="sr-only">
          Find player
        </label>
        <div className="mt-3 flex items-center gap-3 border border-[#ff7a18]/80 bg-[#1a120c]/90 px-4 py-3 focus-within:border-[#ff7a18]">
          <SearchIcon />
          <input
            id={inputId}
            role="combobox"
            aria-expanded={open && options.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            value={query}
            placeholder="Name, account ID, Steam64 or profile URL"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setSearchError(null);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent text-base text-zinc-50 outline-none placeholder:text-zinc-500 sm:text-lg"
          />
          {searching || resolving ? (
            <span className="shrink-0 text-xs text-zinc-500">Searching…</span>
          ) : null}
        </div>
        {open && query.trim() && (options.length > 0 || searchError) ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-xl"
          >
            {options.map((option, index) => (
              <li key={option.key} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => void choose(option)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                    index === active ? "bg-zinc-800" : "hover:bg-zinc-900"
                  }`}
                >
                  {option.kind === "player" && option.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={option.avatar} alt="" className="h-8 w-8 rounded bg-zinc-800" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500">
                      {option.kind === "direct" ? "#" : "?"}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-zinc-100">{option.title}</span>
                    <span className="block truncate text-xs text-zinc-500">{option.detail}</span>
                  </span>
                </button>
              </li>
            ))}
            {searchError ? (
              <li className="px-3 py-2 text-sm text-red-400">{searchError}</li>
            ) : null}
          </ul>
        ) : null}
        {searchError && !open ? (
          <p role="alert" className="mt-2 text-sm text-red-400">
            {searchError}
          </p>
        ) : null}
      </form>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl uppercase tracking-wide text-[#f6efe4]">
              Highest win rate
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Last 30 days · {modeMeta.label}
              {rankEnabled ? ` · ${rankName}` : ""} · top 10
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-zinc-800 p-0.5" role="group" aria-label="Game mode">
              {PUBLIC_GAME_MODES.map((item) => {
                const selected = item.id === mode;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      if (item.id === mode) return;
                      setStatsState("loading");
                      setMode(item.id);
                    }}
                    className={`font-display rounded-sm px-2.5 py-1 text-xs uppercase ${
                      selected
                        ? "bg-[#ff7a18] text-[#1a0e06]"
                        : "text-[#cbbba6] hover:text-[#f6efe4]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {rankEnabled ? (
              <label className="flex items-center gap-2 text-xs text-zinc-500">
                Rank
                <select
                  value={rankTier === "all" ? "all" : String(rankTier)}
                  onChange={(event) => {
                    const value = event.target.value;
                    const next = value === "all" ? "all" : Number(value);
                    if (next === rankTier) return;
                    setStatsState("loading");
                    setRankTier(next);
                  }}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100"
                >
                  <option value="all">All ranks</option>
                  {(ranks.some((rank) => rank.tier > 0)
                    ? ranks.filter((rank) => rank.tier > 0)
                    : FALLBACK_RANKS
                  ).map((rank) => (
                    <option key={rank.tier} value={rank.tier}>
                      {rank.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </div>

        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="bg-zinc-900/60 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="w-10 px-3 py-2 font-medium">
                  #
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Hero
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Win rate
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Pick rate
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  K / D / A
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Souls
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Damage
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Matches
                </th>
              </tr>
            </thead>
            <tbody>
              {statsState === "loading" ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-zinc-500">
                    Loading hero win rates…
                  </td>
                </tr>
              ) : statsState === "error" ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-red-400">
                    Could not load hero stats.
                  </td>
                </tr>
              ) : top.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-zinc-500">
                    No hero stats for this filter.
                  </td>
                </tr>
              ) : (
                top.map((row, index) => {
                  const hero = heroes.get(row.hero_id);
                  const portrait = hero?.card || hero?.icon;
                  const rate = row.wins / row.matches;
                  return (
                    <tr key={row.hero_id} className="border-t border-[rgba(244,214,176,0.08)]">
                      <td className="px-3 py-2 font-display text-[#cbbba6]">{index + 1}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/heroes/${row.hero_id}`}
                          className="flex items-center gap-3 text-[#f6efe4] hover:text-[#ff7a18]"
                        >
                          {portrait ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={portrait}
                              alt=""
                              className="h-14 w-10 bg-[#2a2118] object-cover object-top"
                            />
                          ) : (
                            <span className="h-14 w-10 bg-[#2a2118]" />
                          )}
                          <span className="font-display text-lg uppercase">
                            {hero?.name ?? `Hero ${row.hero_id}`}
                          </span>
                        </Link>
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${
                          rate >= 0.52
                            ? "text-emerald-400"
                            : rate <= 0.48
                              ? "text-red-400"
                              : "text-zinc-200"
                        }`}
                      >
                        {formatWinRate(row.wins, row.matches)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-400">
                        {formatWinRate(row.matches, playedMatches)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-400">
                        {formatRate(row.total_kills, row.matches)}
                        <span className="text-zinc-600"> / </span>
                        {formatRate(row.total_deaths, row.matches)}
                        <span className="text-zinc-600"> / </span>
                        {formatRate(row.total_assists, row.matches)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-400">
                        {formatCount(row.total_net_worth / row.matches)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-400">
                        {formatCount(row.total_player_damage / row.matches)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-400">
                        {formatCount(row.matches)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function buildOptions(
  query: string,
  results: SteamProfile[],
  ranks: RankAsset[],
  searching: boolean,
): SearchOption[] {
  const options: SearchOption[] = [];
  const trimmed = query.trim();
  if (!trimmed) return options;

  const parsed = parseSteamInput(trimmed);
  if (parsed.ok && !isSteamParseVanity(parsed)) {
    options.push({
      key: `direct-${parsed.accountId}`,
      kind: "direct",
      accountId: parsed.accountId,
      title: `Open account ${parsed.accountId}`,
      detail:
        parsed.source === "steamid64" || parsed.source === "profile_url"
          ? "SteamID64"
          : "Account ID",
    });
  }

  const seen = new Set(options.flatMap((option) => (option.kind === "vanity" ? [] : [option.accountId])));
  for (const profile of results) {
    if (seen.has(profile.account_id)) continue;
    seen.add(profile.account_id);
    const rank = labelForBadge(ranks, profile.last_team_avg_badge);
    const parts = [`${formatCount(profile.matches_played_last_30d)} matches in 30d`];
    if (rank) parts.push(rank);
    options.push({
      key: `player-${profile.account_id}`,
      kind: "player",
      accountId: profile.account_id,
      title: profile.personaname || `Account ${profile.account_id}`,
      detail: parts.join(" · "),
      avatar: profile.avatar || null,
    });
  }

  if (parsed.ok && isSteamParseVanity(parsed) && results.length === 0 && !searching) {
    options.push({
      key: `vanity-${parsed.vanity}`,
      kind: "vanity",
      vanity: parsed.vanity,
      title: `Look up Steam name “${parsed.vanity}”`,
      detail: "Resolve a custom profile URL",
    });
  }

  return options;
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-zinc-500">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-5.2-5.2"
      />
    </svg>
  );
}
