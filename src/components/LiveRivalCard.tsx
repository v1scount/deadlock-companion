"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AbilityGrid } from "@/components/AbilityGrid";
import {
  loadHeroKit,
  type HeroKitBundle,
} from "@/lib/hero-kit-cache";
import type { MockRival } from "@/lib/live-mock";

interface Props {
  rival: MockRival;
}

export function LiveRivalCard({ rival }: Props) {
  const [kit, setKit] = useState<HeroKitBundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadHeroKit(rival.hero_id).then((bundle) => {
      if (!cancelled) setKit(bundle);
    });
    return () => {
      cancelled = true;
    };
  }, [rival.hero_id]);

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 ring-1 ring-zinc-800/70">
      <header className="flex items-center gap-2.5 px-3 py-2">
        {kit?.portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={kit.portraitUrl}
            alt=""
            className="h-9 w-9 rounded-lg object-cover ring-1 ring-zinc-700/80"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-[10px] text-zinc-600 ring-1 ring-zinc-800">
            …
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-sm font-semibold tracking-tight text-zinc-50">
              {rival.hero_name}
            </h3>
            <span className="truncate font-mono text-[10px] text-zinc-500">
              {rival.display_name}
            </span>
          </div>
          <Link
            href={`/heroes/${rival.hero_id}`}
            className="text-[10px] text-amber-500/90 hover:text-amber-400"
          >
            Teach page →
          </Link>
        </div>
      </header>

      <div className="min-h-0 flex-1 px-2 pb-2">
        {kit ? (
          <AbilityGrid
            localAbilities={kit.abilities}
            apiAbilities={kit.apiAbilities}
            schematics={kit.schematics}
            variant="live"
          />
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-lg bg-zinc-900/80"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
