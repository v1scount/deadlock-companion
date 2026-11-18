import { deadlockApi } from "@/lib/deadlock-api";
import type { RankAsset } from "@/types/deadlock";

export type HeroBrief = {
  id: number;
  name: string;
  icon: string | null;
  /** Neutral hero card. */
  card: string | null;
  /** Win portrait (`*_card_gloat`). */
  gloat: string | null;
  /** Loss portrait (`*_card_critical`). */
  critical: string | null;
};

/** Victory uses the gloat card, defeat the critical card. */
export function matchPortrait(
  hero: HeroBrief | undefined,
  outcome: number,
): string | null {
  if (!hero) return null;
  if (outcome === 1) return hero.gloat || hero.card || hero.icon;
  if (outcome === 2) return hero.critical || hero.card || hero.icon;
  return hero.card || hero.icon;
}

let heroesPromise: Promise<Map<number, HeroBrief>> | null = null;
let ranksPromise: Promise<RankAsset[]> | null = null;

export function loadHeroCatalog(): Promise<Map<number, HeroBrief>> {
  if (!heroesPromise) {
    heroesPromise = deadlockApi
      .getHeroes()
      .then((heroes) => {
        const map = new Map<number, HeroBrief>();
        for (const hero of heroes) {
          const images = hero.images;
          map.set(hero.id, {
            id: hero.id,
            name: hero.name,
            icon:
              images?.icon_image_small_webp ||
              images?.icon_hero_card_webp ||
              images?.icon_image_small ||
              null,
            card: images?.icon_hero_card_webp || images?.icon_hero_card || null,
            gloat: images?.hero_card_gloat_webp || images?.hero_card_gloat || null,
            critical:
              images?.hero_card_critical_webp || images?.hero_card_critical || null,
          });
        }
        return map;
      })
      .catch((err) => {
        heroesPromise = null;
        throw err;
      });
  }
  return heroesPromise;
}

export function loadRankAssets(): Promise<RankAsset[]> {
  if (!ranksPromise) {
    ranksPromise = deadlockApi.getRankAssets().catch((err) => {
      ranksPromise = null;
      throw err;
    });
  }
  return ranksPromise;
}
