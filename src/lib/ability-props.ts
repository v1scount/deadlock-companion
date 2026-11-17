/** Resolve schematic numeric fields from API properties + local overrides. */

import type { Ability, ItemProperty } from "@/types/deadlock";
import type {
  AbilitySchematic,
  SchematicOverrides,
} from "@/types/schematic";

function parseMeters(raw: string | number | null | undefined): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const m = String(raw).trim().match(/^(-?\d+(?:\.\d+)?)\s*m?$/i);
  if (!m) return undefined;
  return Number(m[1]);
}

function propValue(
  properties: Record<string, ItemProperty> | null | undefined,
  key: string | undefined,
): string | number | null | undefined {
  if (!key || !properties) return undefined;
  return properties[key]?.value;
}

export interface ResolvedSchematicNumbers {
  range_m?: number;
  radius_m?: number;
  width_m?: number;
  angle_deg?: number;
  duration_s?: number;
  delay_s?: number;
}

/** Prefer schematic overrides; else read named API property keys. */
export function resolveSchematicNumbers(
  schematic: AbilitySchematic,
  ability?: Ability | null,
): ResolvedSchematicNumbers {
  const o: SchematicOverrides = schematic.overrides ?? {};
  const keys = schematic.api_property_keys ?? {};
  const props = ability?.properties;

  return {
    range_m:
      o.range_m ?? parseMeters(propValue(props, keys.range)),
    radius_m:
      o.radius_m ?? parseMeters(propValue(props, keys.radius)),
    width_m:
      o.width_m ?? parseMeters(propValue(props, keys.width)),
    angle_deg: o.angle_deg,
    duration_s:
      o.duration_s ?? parseMeters(propValue(props, keys.duration)),
    delay_s:
      o.delay_s ?? parseMeters(propValue(props, keys.delay)),
  };
}

/** Strip Valve HTML/SVG crumbs from ability description text. */
export function plainAbilityText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
