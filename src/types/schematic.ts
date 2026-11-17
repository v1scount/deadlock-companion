/** Ability teaching schematics — local JSON under /public/deadlock-assets/schematics. */

import type { AbilityThreat } from "@/types/threat";

export type SchematicShape =
  | "circle"
  | "cone"
  | "line"
  | "projectile"
  | "dash_trail"
  | "hook"
  | "aoe_delay"
  | "passive";

export interface SchematicOverrides {
  /** Cast / travel range in meters. */
  range_m?: number;
  /** AoE / aura radius in meters. */
  radius_m?: number;
  /** Cone / trail width in meters. */
  width_m?: number;
  /** Cone opening in degrees. */
  angle_deg?: number;
  /** Ability or effect duration. */
  duration_s?: number;
  /** Fuse / explode delay (aoe_delay). */
  delay_s?: number;
}

/** Optional map from schematic fields → API `properties` keys. */
export interface SchematicApiPropertyKeys {
  range?: string;
  radius?: string;
  width?: string;
  duration?: string;
  delay?: string;
}

export interface AbilitySchematic {
  ability_class_name: string;
  shape: SchematicShape;
  overrides?: SchematicOverrides;
  api_property_keys?: SchematicApiPropertyKeys;
  beginner_hints: string[];
  watch_for: string[];
  /** Live-match callouts (stun / slow / sleep / …). */
  threats?: AbilityThreat[];
}
