/** Manifest DTOs for local /public/deadlock-assets. */

export type AbilitySlot =
  | "signature1"
  | "signature2"
  | "signature3"
  | "signature4";

export interface ManifestAbilityRef {
  class_name: string;
  slot: AbilitySlot;
  name: string;
  /** Path relative to manifest root, e.g. abilities/foo/icon.webp */
  icon: string;
  /** Optional local clip; null until ingested. */
  clip: string | null;
  /** Path relative to manifest root, e.g. schematics/foo.json */
  schematic: string;
}

export interface ManifestHero {
  id: number;
  name: string;
  class_name: string;
  portrait: string;
  abilities: ManifestAbilityRef[];
}

export interface HeroAssetsManifest {
  version: number;
  root: string;
  layout: Record<string, string>;
  how_to_add_hero: string[];
  heroes: Record<string, ManifestHero>;
}

export interface ResolvedAbilityAssets {
  class_name: string;
  slot: AbilitySlot;
  name: string;
  iconUrl: string;
  clipUrl: string | null;
  /** Lightweight VP9 clip for live roster (prefer over clipUrl). */
  liveClipUrl: string | null;
  /** Still frame — live cells paint this before any decode. */
  posterUrl: string | null;
  schematicUrl: string;
}
