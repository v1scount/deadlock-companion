import { LOCAL_ASSET_ROOT, localAssetPaths } from "@/types/deadlock";

/** Local public asset helpers for images / videos / schematics. */
export { LOCAL_ASSET_ROOT, localAssetPaths };

export function localImagePath(...segments: string[]): string {
  return join(localAssetPaths.images, ...segments);
}

export function localVideoPath(...segments: string[]): string {
  return join(localAssetPaths.videos, ...segments);
}

export function localSchematicPath(...segments: string[]): string {
  return join(localAssetPaths.schematics, ...segments);
}

export function localHeroPortraitPath(heroId: number | string): string {
  return join(localAssetPaths.heroes, String(heroId), "portrait.webp");
}

export function localAbilityIconPath(abilityClassName: string): string {
  return join(localAssetPaths.abilities, abilityClassName, "icon.webp");
}

export function localAbilityClipPath(abilityClassName: string): string {
  return join(localAssetPaths.abilities, abilityClassName, "clip.webm");
}

function join(base: string, ...segments: string[]): string {
  const rest = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return rest ? `${base}/${rest}` : base;
}
