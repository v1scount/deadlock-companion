"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useIdentity } from "@/components/identity-provider";
import { LiveMatchCoachView } from "@/components/LiveMatchCoachView";
import { deadlockApi } from "@/lib/deadlock-api";
import type { ActiveMatch } from "@/types/deadlock";

export function LiveMatchView() {
  const { accountId, hydrated } = useIdentity();
  const [matches, setMatches] = useState<ActiveMatch[]>([]);
  const [showApi, setShowApi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deadlockApi.getActiveMatches(accountId ?? undefined);
      setMatches(data);
    } catch (err) {
      setMatches([]);
      setError(err instanceof Error ? err.message : "Failed to load live matches");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (!hydrated || !showApi) return;
    void refresh();
  }, [hydrated, showApi, refresh]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col gap-4 px-3 py-3 sm:px-4 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
            Live
          </h1>
          <Link
            href="/heroes"
            className="text-xs text-zinc-500 transition-colors hover:text-amber-400"
          >
            Browse heroes
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setShowApi((v) => !v)}
          className="rounded-full border border-zinc-800 px-3 py-1 text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
        >
          {showApi ? "Hide API matches" : "API matches"}
        </button>
      </div>

      <LiveMatchCoachView />

      {showApi ? (
        <section className="mt-auto flex flex-col gap-3 border-t border-zinc-800/80 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-zinc-500">
              <code className="text-zinc-400">/v1/matches/active</code>
              {accountId != null ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-mono text-zinc-300">{accountId}</span>
                </>
              ) : null}
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-[11px] text-zinc-400 hover:text-zinc-200"
            >
              Refresh
            </button>
          </div>

          {!hydrated || loading ? (
            <p className="text-sm text-zinc-400">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-zinc-500">No active matches.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {matches.slice(0, 12).map((m) => (
                <li
                  key={String(m.match_id ?? m.lobby_id)}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-zinc-100">
                      match {m.match_id != null ? m.match_id : "?"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {m.spectators ?? 0} spectators · {m.duration_s ?? 0}s
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
