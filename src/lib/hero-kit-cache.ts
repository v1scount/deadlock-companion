/**
 * Shared in-memory cache for live roster — Infernus/Haze appear multiple times;
 * load each hero kit once.
 */

import { deadlockApi } from "@/lib/deadlock-api";
import {
  getManifestHero,
  loadAbilitySchematic,
  loadHeroAssetsManifest,
  portraitUrl,
  resolveHeroAbilityAssets,
  type ResolvedAbilityAssets,
} from "@/lib/hero-assets";
import type { Ability } from "@/types/deadlock";
import type { AbilitySchematic } from "@/types/schematic";

export interface HeroKitBundle {
  heroId: number;
  portraitUrl: string | null;
  abilities: ResolvedAbilityAssets[];
  apiAbilities: Ability[];
  schematics: Record<string, AbilitySchematic | null>;
}

const kitPromises = new Map<number, Promise<HeroKitBundle>>();

export function loadHeroKit(heroId: number): Promise<HeroKitBundle> {
  let pending = kitPromises.get(heroId);
  if (!pending) {
    pending = (async () => {
      const [abilities, localHero, apiAbilities] = await Promise.all([
        resolveHeroAbilityAssets(heroId).catch(() => [] as ResolvedAbilityAssets[]),
        getManifestHero(heroId).catch(() => null),
        deadlockApi.getHeroAbilities(heroId).catch(() => [] as Ability[]),
      ]);

      let pic: string | null = null;
      if (localHero) {
        try {
          const manifest = await loadHeroAssetsManifest();
          pic = portraitUrl(manifest, localHero);
        } catch {
          pic = null;
        }
      }

      const schematicEntries = await Promise.all(
        abilities.map(async (a) => {
          if (!a.schematicUrl) return [a.class_name, null] as const;
          const s = await loadAbilitySchematic(a.schematicUrl);
          return [a.class_name, s] as const;
        }),
      );

      return {
        heroId,
        portraitUrl: pic,
        abilities,
        apiAbilities,
        schematics: Object.fromEntries(schematicEntries),
      };
    })().catch((err) => {
      kitPromises.delete(heroId);
      throw err;
    });
    kitPromises.set(heroId, pending);
  }
  return pending;
}

/** Warm kits used by the mock roster so the first paint is shared. */
export function prefetchHeroKits(heroIds: number[]): void {
  for (const id of heroIds) void loadHeroKit(id);
}
