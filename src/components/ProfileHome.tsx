"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountSettings } from "@/components/account-settings";
import { useIdentity } from "@/components/identity-provider";
import { deadlockApi } from "@/lib/deadlock-api";
import type { HeroStats, PlayerMatchHistoryEntry } from "@/types/deadlock";

export function ProfileHome() {
  const { accountId, hydrated } = useIdentity();
  const [history, setHistory] = useState<PlayerMatchHistoryEntry[]>([]);
  const [heroStats, setHeroStats] = useState<HeroStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || accountId == null) {
      setHistory([]);
      setHeroStats([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void Promise.all([
      deadlockApi.getMatchHistory(accountId),
      deadlockApi.getHeroStats({ account_ids: accountId }),
    ])
      .then(([matches, stats]) => {
        if (cancelled) return;
        setHistory(matches.slice(0, 20));
        setHeroStats(
          [...stats]
            .sort((a, b) => b.matches_played - a.matches_played)
            .slice(0, 12),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setHistory([]);
        setHeroStats([]);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, hydrated]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Profile
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Match history and hero stats from deadlock-api.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <AccountSettings variant="panel" />
      </section>

      {!hydrated ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : accountId == null ? (
        <p className="text-sm text-zinc-500">Bind an account to load data.</p>
      ) : loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-400">
              Recent matches
            </h2>
            <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
              {history.length === 0 ? (
                <li className="px-3 py-4 text-sm text-zinc-500">No matches.</li>
              ) : (
                history.map((m) => (
                  <li
                    key={`${m.match_id}-${m.start_time}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/heroes/${m.hero_id}`}
                      className="font-mono text-amber-500 hover:text-amber-400"
                    >
                      hero {m.hero_id}
                    </Link>
                    <span className="font-mono text-zinc-300">
                      {m.player_kills}/{m.player_deaths}/{m.player_assists}
                    </span>
                    <span className="text-zinc-500">
                      {m.player_match_outcome === 1 ? "Win" : "Loss"}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-400">
              Hero stats
            </h2>
            <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
              {heroStats.length === 0 ? (
                <li className="px-3 py-4 text-sm text-zinc-500">No hero stats.</li>
              ) : (
                heroStats.map((h) => (
                  <li
                    key={h.hero_id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/heroes/${h.hero_id}`}
                      className="font-mono text-amber-500 hover:text-amber-400"
                    >
                      hero {h.hero_id}
                    </Link>
                    <span className="text-zinc-300">
                      {h.wins}W / {h.matches_played}g
                    </span>
                    <span className="font-mono text-zinc-500">
                      {h.kills}/{h.deaths}/{h.assists}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
