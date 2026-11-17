"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  listManifestHeroes,
  loadHeroAssetsManifest,
  portraitUrl,
  type ManifestHero,
} from "@/lib/hero-assets";
import { deadlockApi } from "@/lib/deadlock-api";
import type { Hero } from "@/types/deadlock";

type Card = {
  id: number;
  name: string;
  class_name: string;
  portrait: string | null;
  prototyped: boolean;
};

export function HeroesIndex() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const manifestHeroes = await listManifestHeroes().catch(() => [] as ManifestHero[]);
      let manifestRootPortrait: Record<number, string> = {};
      try {
        const manifest = await loadHeroAssetsManifest();
        manifestRootPortrait = Object.fromEntries(
          Object.values(manifest.heroes).map((h) => [h.id, portraitUrl(manifest, h)]),
        );
      } catch {
        /* ignore */
      }

      let apiHeroes: Hero[] = [];
      try {
        apiHeroes = await deadlockApi.getHeroes({ only_active: true });
      } catch {
        if (!cancelled) {
          setNote("API unreachable — listing prototyped heroes from the local manifest.");
        }
      }

      const protoIds = new Set(manifestHeroes.map((h) => h.id));
      const byId = new Map<number, Card>();

      for (const h of manifestHeroes) {
        byId.set(h.id, {
          id: h.id,
          name: h.name,
          class_name: h.class_name,
          portrait: manifestRootPortrait[h.id] ?? null,
          prototyped: true,
        });
      }

      for (const h of apiHeroes) {
        if (h.disabled || !h.player_selectable) continue;
        const existing = byId.get(h.id);
        const remote =
          h.images?.icon_hero_card_webp ||
          h.images?.icon_hero_card ||
          h.images?.icon_image_small_webp ||
          null;
        byId.set(h.id, {
          id: h.id,
          name: h.name,
          class_name: h.class_name,
          portrait: existing?.portrait || remote,
          prototyped: protoIds.has(h.id),
        });
      }

      const list = [...byId.values()].sort((a, b) => {
        if (a.prototyped !== b.prototyped) return a.prototyped ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      if (!cancelled) {
        setCards(list);
        setLoading(false);
      }
    }
    void run().catch(() => {
      if (!cancelled) {
        setNote("Failed to load heroes.");
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-sm text-zinc-400">Loading heroes…</p>;

  return (
    <div className="flex flex-col gap-4">
      {note ? <p className="text-sm text-amber-400/90">{note}</p> : null}
      <p className="text-sm text-zinc-500">
        Prototyped teaching pages ship local icons, in-game clips, and schematics (Infernus, Haze). Other
        heroes open with API text when online.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {cards.map((c) => (
          <li key={c.id}>
            <Link
              href={`/heroes/${c.id}`}
              className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 transition-colors hover:border-zinc-600"
            >
              {c.portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.portrait}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-zinc-700 text-xs text-zinc-600">
                  {c.id}
                </div>
              )}
              <div>
                <p className="font-medium text-zinc-100">{c.name}</p>
                <p className="font-mono text-[10px] text-zinc-500">#{c.id}</p>
                {c.prototyped ? (
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-amber-400/80">
                    local schematics
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
