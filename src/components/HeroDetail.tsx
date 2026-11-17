"use client";

import { useEffect, useState } from "react";

import { AbilityTeachPanel } from "@/components/AbilityTeachPanel";
import { deadlockApi } from "@/lib/deadlock-api";
import {
  getManifestHero,
  loadHeroAssetsManifest,
  portraitUrl,
  resolveHeroAbilityAssets,
  type ResolvedAbilityAssets,
} from "@/lib/hero-assets";
import type { Ability, Hero } from "@/types/deadlock";

export function HeroDetail({ heroId }: { heroId: number }) {
  const [hero, setHero] = useState<Hero | null>(null);
  const [apiAbilities, setApiAbilities] = useState<Ability[]>([]);
  const [localAbilities, setLocalAbilities] = useState<ResolvedAbilityAssets[]>([]);
  const [localPortrait, setLocalPortrait] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineNote, setOfflineNote] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const localHero = await getManifestHero(heroId).catch(() => null);
      const locals = await resolveHeroAbilityAssets(heroId).catch(() => []);
      let portrait: string | null = null;
      if (localHero) {
        try {
          const manifest = await loadHeroAssetsManifest();
          portrait = portraitUrl(manifest, localHero);
        } catch {
          portrait = null;
        }
      }

      let apiHero: Hero | null = null;
      let abilities: Ability[] = [];
      try {
        apiHero = await deadlockApi.getHeroById(heroId, { only_active: true });
        abilities = await deadlockApi.getHeroAbilities(heroId);
      } catch {
        if (!cancelled) setOfflineNote(true);
      }

      if (cancelled) return;

      if (apiHero) {
        setHero(apiHero);
      } else if (localHero) {
        setHero({
          id: localHero.id,
          name: localHero.name,
          class_name: localHero.class_name,
          description: { role: "Local prototype", playstyle: null, lore: null },
          images: {},
          disabled: false,
          in_development: false,
          limited_testing: false,
          player_selectable: true,
          complexity: 0,
          tags: [],
        });
      } else {
        setHero(null);
        setError(`Hero ${heroId} not found (API + local manifest).`);
      }

      setLocalAbilities(locals);
      setLocalPortrait(portrait);
      setApiAbilities(abilities);
      setLoading(false);
    }

    void run().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Failed to load hero");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [heroId]);

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading hero…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }
  if (!hero) {
    return <p className="text-sm text-zinc-500">Hero {heroId} not found.</p>;
  }

  const remoteIcon =
    hero.images?.icon_hero_card_webp ||
    hero.images?.icon_hero_card ||
    hero.images?.icon_image_small_webp ||
    hero.images?.icon_image_small ||
    null;
  const icon = localPortrait || remoteIcon;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        {icon ? (
          // Local portrait preferred; CDN fallback
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={icon}
            alt={hero.name}
            className="h-28 w-28 rounded-lg border border-zinc-800 object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-zinc-700 text-xs text-zinc-600">
            no art
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">{hero.name}</h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">
            id {hero.id} · {hero.class_name}
          </p>
          {hero.description?.role ? (
            <p className="mt-2 text-sm text-zinc-300">{hero.description.role}</p>
          ) : null}
          {hero.description?.playstyle ? (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
              {hero.description.playstyle}
            </p>
          ) : null}
          {offlineNote ? (
            <p className="mt-2 text-xs text-amber-400/90">
              API unreachable — showing local icons + schematics from the manifest.
            </p>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-200">Abilities</h2>
        <AbilityTeachPanel
          localAbilities={localAbilities}
          apiAbilities={apiAbilities}
        />
      </section>
    </div>
  );
}
