"use client";

import { useEffect, useMemo, useState } from "react";

import { LiveRivalCard } from "@/components/LiveRivalCard";
import { loadHeroKit, prefetchHeroKits } from "@/lib/hero-kit-cache";
import { buildMockEnemyRoster, MOCK_MATCH } from "@/lib/live-mock";

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/** Full-roster live coaching — posters first, hover-to-play low-res clips. */
export function LiveMatchCoachView() {
  const rivals = useMemo(() => buildMockEnemyRoster(), []);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState("Warming kits…");

  useEffect(() => {
    let cancelled = false;
    const heroIds = [...new Set(rivals.map((r) => r.hero_id))];

    void (async () => {
      setProgress("Loading hero kits…");
      prefetchHeroKits(heroIds);
      const kits = await Promise.all(heroIds.map((id) => loadHeroKit(id)));
      if (cancelled) return;

      const posters = [
        ...new Set(
          kits.flatMap((k) =>
            k.abilities
              .map((a) => a.posterUrl)
              .filter((u): u is string => !!u),
          ),
        ),
      ];

      setProgress(`Caching ${posters.length} posters…`);
      // Decode posters before mounting the roster so cells never flash black.
      const batch = 4;
      for (let i = 0; i < posters.length; i += batch) {
        await Promise.all(posters.slice(i, i + batch).map(preloadImage));
        if (cancelled) return;
        setProgress(
          `Caching posters… ${Math.min(i + batch, posters.length)}/${posters.length}`,
        );
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [rivals]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-4 rounded-2xl ring-1 ring-zinc-800/80">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-200">Preparing live view</p>
          <p className="mt-1 text-xs text-zinc-500">{progress}</p>
          <p className="mt-3 max-w-sm text-[11px] leading-relaxed text-zinc-600">
            Passives stay static. Active clips use low-res files and only decode
            on hover (max 2 at a time).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2 px-0.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-400/80">
            Mock live · match {MOCK_MATCH.match_id}
          </p>
          <h2 className="text-base font-semibold tracking-tight text-zinc-50">
            Enemy team
          </h2>
        </div>
        <p className="max-w-md text-right text-[11px] leading-snug text-zinc-500">
          Hover a cell to play. Passives show a still only. Threat tags stay on
          each ability.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rivals.map((rival) => (
          <LiveRivalCard key={rival.slot} rival={rival} />
        ))}
      </div>
    </div>
  );
}
