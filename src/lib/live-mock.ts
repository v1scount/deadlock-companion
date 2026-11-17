/**
 * Mock live-match rivals for UI prototyping.
 * Fills a 6-enemy team by alternating prototyped heroes (Infernus + Haze).
 */

import type { AbilityThreat } from "@/types/threat";

export interface MockRival {
  slot: number;
  account_id: number;
  display_name: string;
  hero_id: number;
  hero_name: string;
  /** High-signal threats across their kit (for roster chips). */
  kit_threats: AbilityThreat[];
}

const INFERNUS_THREATS: AbilityThreat[] = ["stun", "slow", "burn", "dash"];
const HAZE_THREATS: AbilityThreat[] = ["sleep", "invis", "damage_amp"];

const MOCK_NAMES = [
  "Rival_Ash",
  "Rival_Nyx",
  "Rival_Cinder",
  "Rival_Vesper",
  "Rival_Ember",
  "Rival_Shade",
] as const;

/** Six enemy slots — odd Infernus (1), even Haze (13). */
export function buildMockEnemyRoster(): MockRival[] {
  return MOCK_NAMES.map((display_name, i) => {
    const haze = i % 2 === 1;
    return {
      slot: i + 1,
      account_id: 900_000_001 + i,
      display_name,
      hero_id: haze ? 13 : 1,
      hero_name: haze ? "Haze" : "Infernus",
      kit_threats: haze ? HAZE_THREATS : INFERNUS_THREATS,
    };
  });
}

export const MOCK_MATCH = {
  match_id: 42424242,
  duration_s: 612,
  note: "Mock lobby — abilities from local Infernus + Haze assets",
} as const;
