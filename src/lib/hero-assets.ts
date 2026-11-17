/**
 * Tiny local-asset reader for Hero pages + live kits.
 * Reads /deadlock-assets/manifest.json + schematic JSON. No Steam auth.
 */

import type { AbilitySchematic } from "@/types/schematic";
import type {
  HeroAssetsManifest,
  ManifestHero,
  ResolvedAbilityAssets,
} from "@/types/hero-assets";

export type {
  AbilitySchematic,
  HeroAssetsManifest,
  ManifestHero,
  ResolvedAbilityAssets,
};

const MANIFEST_URL = "/deadlock-assets/manifest.json";

let manifestPromise: Promise<HeroAssetsManifest> | null = null;
const schematicCache = new Map<string, Promise<AbilitySchematic | null>>();

export function assetUrl(root: string, relative: string | null | undefined): string | null {
  if (!relative) return null;
  const r = relative.replace(/^\/+/, "");
  const base = root.replace(/\/+$/, "");
  return `${base}/${r}`;
}

export async function loadHeroAssetsManifest(
  fetchImpl: typeof fetch = fetch,
): Promise<HeroAssetsManifest> {
  if (!manifestPromise) {
    manifestPromise = fetchImpl(MANIFEST_URL, { cache: "force-cache" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load hero assets manifest: ${res.status}`);
        }
        return (await res.json()) as HeroAssetsManifest;
      })
      .catch((err) => {
        manifestPromise = null;
        throw err;
      });
  }
  return manifestPromise;
}

/** Drop in-memory caches (tests / after asset pull). */
export function clearHeroAssetsManifestCache(): void {
  manifestPromise = null;
  schematicCache.clear();
}

export async function listManifestHeroes(): Promise<ManifestHero[]> {
  const manifest = await loadHeroAssetsManifest();
  return Object.values(manifest.heroes).sort((a, b) => a.id - b.id);
}

export async function getManifestHero(
  heroId: number,
): Promise<ManifestHero | null> {
  const manifest = await loadHeroAssetsManifest();
  return manifest.heroes[String(heroId)] ?? null;
}

export async function resolveHeroAbilityAssets(
  heroId: number,
): Promise<ResolvedAbilityAssets[]> {
  const manifest = await loadHeroAssetsManifest();
  const hero = manifest.heroes[String(heroId)];
  if (!hero) return [];
  return hero.abilities.map((a) => {
    const clipUrl = assetUrl(manifest.root, a.clip);
    const dir = a.clip
      ? a.clip.replace(/\/[^/]+$/, "")
      : `abilities/${a.class_name}`;
    return {
      class_name: a.class_name,
      slot: a.slot,
      name: a.name,
      iconUrl: assetUrl(manifest.root, a.icon)!,
      clipUrl,
      liveClipUrl: a.clip ? assetUrl(manifest.root, `${dir}/clip-live.webm`) : null,
      posterUrl: a.clip ? assetUrl(manifest.root, `${dir}/poster.webp`) : null,
      schematicUrl: assetUrl(manifest.root, a.schematic)!,
    };
  });
}

export async function loadAbilitySchematic(
  schematicUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AbilitySchematic | null> {
  let pending = schematicCache.get(schematicUrl);
  if (!pending) {
    pending = (async () => {
      try {
        const res = await fetchImpl(schematicUrl, { cache: "force-cache" });
        if (!res.ok) return null;
        return (await res.json()) as AbilitySchematic;
      } catch {
        return null;
      }
    })();
    schematicCache.set(schematicUrl, pending);
  }
  return pending;
}

export function portraitUrl(
  manifest: HeroAssetsManifest,
  hero: ManifestHero,
): string {
  return assetUrl(manifest.root, hero.portrait)!;
}
