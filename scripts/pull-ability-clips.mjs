#!/usr/bin/env node
/**
 * Download Valve ability preview movies from the deadlock-api assets CDN.
 * API `videos` is usually null; filenames live under videos/hero_abilities/.
 *
 * Usage: node scripts/pull-ability-clips.mjs --hero 1
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CDN =
  process.env.DEADLOCK_ASSETS_CDN ||
  "https://assets-bucket.deadlock-api.com/assets-api-res/videos/hero_abilities";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "public", "deadlock-assets");
const MANIFEST = path.join(ROOT, "manifest.json");

/** class_name → CDN basename (Valve spelling, including known typos). */
const CLIP_FILES = {
  ability_incendiary_projectile: "ability_inferno_incendiary.webm",
  ability_flame_dash: "ability_inferno_flame_dash.webm",
  ability_afterburn: "abilty_inferno_afterburn.webm",
  ability_fire_bomb: "ability_inferno_stun_bomb.webm",
  ability_sleep_dagger: "ability_haze_sleep_dagger.webm",
  ability_smoke_bomb: "ability_haze_smoke_bomb.webm",
  ability_stacking_damage: "ability_haze_fixation.webm",
  ability_bullet_flurry: "ability_haze_bullet_flurry.webm",
};

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "deadlock-companion-assets/0.1" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  console.log("saved", path.relative(process.cwd(), dest), buf.length);
}

const heroId = String(argValue("--hero") ?? "");
if (!heroId) {
  console.error("Usage: npm run assets:pull-clips -- --hero <id>");
  process.exit(1);
}

const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
const hero = manifest.heroes?.[heroId];
if (!hero) {
  console.error(`Hero ${heroId} not in manifest.json — add the hero block first.`);
  process.exit(1);
}

let updated = false;
for (const ability of hero.abilities ?? []) {
  const file = CLIP_FILES[ability.class_name];
  if (!file) {
    console.warn(
      "no CDN mapping for",
      ability.class_name,
      "— look up videos/hero_abilities/ on deadworks and add to CLIP_FILES",
    );
    continue;
  }
  const rel = `abilities/${ability.class_name}/clip.webm`;
  await download(`${CDN}/${file}`, path.join(ROOT, rel));
  if (ability.clip !== rel) {
    ability.clip = rel;
    updated = true;
  }
}

if (updated) {
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("updated manifest clip paths for hero", heroId);
}

console.log("Done.");
