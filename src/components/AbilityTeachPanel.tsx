"use client";

import { AbilityGrid } from "@/components/AbilityGrid";
import type { ResolvedAbilityAssets } from "@/lib/hero-assets";
import type { Ability } from "@/types/deadlock";

interface Props {
  localAbilities: ResolvedAbilityAssets[];
  apiAbilities: Ability[];
}

/** Browse-mode ability grid (full teaching copy). Live match uses AbilityGrid variant="live". */
export function AbilityTeachPanel({ localAbilities, apiAbilities }: Props) {
  return (
    <AbilityGrid
      localAbilities={localAbilities}
      apiAbilities={apiAbilities}
      variant="browse"
    />
  );
}
