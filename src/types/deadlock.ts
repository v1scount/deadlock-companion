/** Shared Deadlock API DTOs. Keep mock-friendly and additive. */

/** SteamID3 / account_id used by deadlock-api. */
export type AccountId = number;

export type GameMode =
  | "normal"
  | "street_brawl"
  | "explore_n_y_c"
  | "internal"
  | "internal02";

export interface SteamFriend {
  account_id: AccountId;
  friend_since: string;
}

/** `GET /v1/players/steam` / steam profile payloads */
export interface SteamProfile {
  account_id: AccountId;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  realname?: string | null;
  countrycode?: string | null;
  last_updated: string;
  friends: SteamFriend[];
  matches_played_last_30d: number;
  last_team_avg_badge?: number | null;
}

/** `GET /v1/players/{account_id}/match-history` row */
export interface PlayerMatchHistoryEntry {
  account_id: number;
  match_id: number;
  hero_id: number;
  hero_level: number;
  start_time: number;
  match_duration_s: number;
  game_mode: number;
  match_mode: number;
  match_result: number;
  player_team: number;
  player_match_outcome: number;
  player_kills: number;
  player_deaths: number;
  player_assists: number;
  net_worth: number;
  last_hits: number;
  denies: number;
  objectives_mask_team0: number;
  objectives_mask_team1: number;
  abandoned_time_s?: number | null;
  team_abandoned?: boolean | null;
  ranked_display_badge?: number | null;
  ranked_delta?: number | null;
  ranked_calibration_match?: number | null;
  ranked_used_demotion_protection?: boolean | null;
  brawl_score_team0?: number | null;
  brawl_score_team1?: number | null;
  brawl_avg_round_time_s?: number | null;
  low_pri_pool?: boolean | null;
}

/** Alias for parallel tracks that used the stub name. */
export type MatchHistoryEntry = PlayerMatchHistoryEntry;

/** `GET /v1/players/hero-stats` row */
export interface HeroStats {
  account_id: number;
  hero_id: number;
  matches_played: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  time_played: number;
  last_played: number;
  matches: number[];
  ending_level: number;
  accuracy: number;
  crit_shot_rate: number;
  kills_per_min: number;
  deaths_per_min: number;
  assists_per_min: number;
  creeps_per_min: number;
  last_hits_per_min: number;
  denies_per_match: number;
  denies_per_min: number;
  networth_per_min: number;
  damage_per_min: number;
  damage_per_soul: number;
  damage_taken_per_min: number;
  damage_taken_per_soul: number;
  damage_mitigated_per_min: number;
  obj_damage_per_min: number;
  obj_damage_per_soul: number;
  total_player_damage: number;
  total_player_damage_taken: number;
  total_creep_damage: number;
  total_neutral_damage: number;
  total_boss_damage: number;
  mvp_rated_matches?: number;
  mvp_rank_counts?: number[];
  permanent_buffs?: number;
  permanent_buff_matches?: number;
  permanent_buffs_per_min?: number | null;
  avg_first_permanent_buff_time_s?: number | null;
}

/** Alias for parallel-track stub name. */
export type HeroStatsEntry = HeroStats;

/** `GET /v1/players/{account_id}/enemy-stats` row */
export interface EnemyStats {
  enemy_id: number;
  matches: number[];
  matches_played: number;
  wins: number;
}

/** Alias for parallel-track stub name (`account_id` ≈ enemy_id). */
export type EnemyStatsEntry = EnemyStats & { account_id?: AccountId };

export interface ActiveMatchPlayer {
  account_id?: number | null;
  hero_id?: number | null;
  team?: number | null;
  team_parsed?: string | null;
  abandoned?: boolean | null;
}

/** `GET /v1/matches/active` */
export interface ActiveMatch {
  match_id?: number | null;
  start_time?: number | null;
  duration_s?: number | null;
  game_mode?: number | null;
  match_mode?: number | null;
  region_mode?: number | null;
  spectators?: number | null;
  open_spectator_slots?: number | null;
  net_worth_team_0?: number | null;
  net_worth_team_1?: number | null;
  objectives_mask_team0?: number | null;
  objectives_mask_team1?: number | null;
  winning_team?: number | null;
  lobby_id?: number | null;
  match_score?: number | null;
  players: ActiveMatchPlayer[];
  team_stats?: unknown[];
}

export interface HeroImages {
  icon_hero_card?: string | null;
  icon_hero_card_webp?: string | null;
  /** Hurt portrait used for a loss. */
  hero_card_critical?: string | null;
  hero_card_critical_webp?: string | null;
  /** Celebrating portrait used for a win. */
  hero_card_gloat?: string | null;
  hero_card_gloat_webp?: string | null;
  icon_image_small?: string | null;
  icon_image_small_webp?: string | null;
  minimap_image?: string | null;
  minimap_image_webp?: string | null;
  background_image?: string | null;
  background_image_webp?: string | null;
  top_bar_vertical_image?: string | null;
  top_bar_vertical_image_webp?: string | null;
  name_image?: string | null;
  weapon_image?: string | null;
  weapon_image_webp?: string | null;
}

export interface HeroDescription {
  lore?: string | null;
  playstyle?: string | null;
  role?: string | null;
}

/** Hero.items maps slots → ability/weapon class_name. */
export interface HeroItems {
  weapon_primary?: string;
  weapon_melee?: string;
  signature1?: string;
  signature2?: string;
  signature3?: string;
  signature4?: string;
  [slot: string]: string | undefined;
}

/** Subset of `/v1/assets/heroes` */
export interface Hero {
  id: number;
  name: string;
  class_name: string;
  description: HeroDescription;
  images: HeroImages;
  disabled: boolean;
  in_development: boolean;
  limited_testing: boolean;
  player_selectable: boolean;
  complexity: number;
  tags: string[];
  /** Present on full assets payloads; optional for mocks. */
  items?: HeroItems;
}

export interface AbilityDescription {
  desc?: string | null;
  quip?: string | null;
  active?: string | null;
  passive?: string | null;
  t1_desc?: string | null;
  t2_desc?: string | null;
  t3_desc?: string | null;
}

export interface AbilityVideos {
  mp4?: string | null;
  webm?: string | null;
}

export interface ItemProperty {
  value?: string | number | null;
  label?: string | null;
  postfix?: string | null;
  css_class?: string | null;
  icon?: string | null;
  display_units?: string | null;
  [key: string]: unknown;
}

/** Ability rows from `/v1/assets/items` (type=ability). */
export interface Ability {
  id: number;
  class_name: string;
  name: string;
  type?: string;
  ability_type?: string | null;
  behaviours?: string[] | null;
  description: AbilityDescription;
  image?: string | null;
  image_webp?: string | null;
  videos?: AbilityVideos | null;
  properties?: Record<string, ItemProperty> | null;
  hero?: number | null;
  heroes?: number[] | null;
  start_trained?: boolean | null;
}

/** Local / CDN asset pointer for hero visuals track. */
export interface AssetRef {
  path: string;
  url?: string;
}

/** `GET /v1/analytics/hero-stats` row. Extra fields from the API are ignored. */
export interface AnalyticsHeroStats {
  hero_id: number;
  wins: number;
  losses: number;
  matches: number;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  total_net_worth: number;
  total_player_damage: number;
}

export interface AnalyticsHeroStatsQuery {
  game_mode?: GameMode;
  match_mode?: string;
  min_unix_timestamp?: number;
  max_unix_timestamp?: number;
  min_average_badge?: number;
  max_average_badge?: number;
}

/** `GET /v1/players/{account_id}/rank` */
export interface PlayerRank {
  /** `tier * 10 + subrank`. `0` when no recent ranked match reports a rank. */
  badge: number;
  rank: number;
  subrank: number;
}

/** `GET /v1/assets/ranks` */
export interface RankAsset {
  tier: number;
  name: string;
  color?: string;
  images: {
    large?: string | null;
    large_webp?: string | null;
    small?: string | null;
    small_webp?: string | null;
    [key: string]: string | null | undefined;
  };
}

export interface HeroStatsQuery {
  account_ids: number | number[];
  game_mode?: GameMode;
  match_mode?: string;
  hero_ids?: number | number[] | string;
  min_unix_timestamp?: number;
  max_unix_timestamp?: number;
  min_duration_s?: number;
  max_duration_s?: number;
  min_networth?: number;
  max_networth?: number;
  min_average_badge?: number;
  max_average_badge?: number;
  min_match_id?: number;
  max_match_id?: number;
}

export interface EnemyStatsQuery {
  game_mode?: GameMode;
  min_unix_timestamp?: number;
  max_unix_timestamp?: number;
  min_duration_s?: number;
  max_duration_s?: number;
  min_match_id?: number;
  max_match_id?: number;
  min_matches_played?: number;
  max_matches_played?: number;
}

export interface AssetsHeroesQuery {
  language?: string;
  client_version?: number;
  only_active?: boolean;
}

export interface LocalAssetPaths {
  /** @deprecated prefer heroes/ / abilities/ layout */
  images: string;
  /** @deprecated prefer abilities/{class}/clip.webm */
  videos: string;
  schematics: string;
  heroes: string;
  abilities: string;
  manifest: string;
}

export const LOCAL_ASSET_ROOT = "/deadlock-assets" as const;

export const localAssetPaths: LocalAssetPaths = {
  images: `${LOCAL_ASSET_ROOT}/images`,
  videos: `${LOCAL_ASSET_ROOT}/videos`,
  schematics: `${LOCAL_ASSET_ROOT}/schematics`,
  heroes: `${LOCAL_ASSET_ROOT}/heroes`,
  abilities: `${LOCAL_ASSET_ROOT}/abilities`,
  manifest: `${LOCAL_ASSET_ROOT}/manifest.json`,
};
