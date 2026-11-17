#!/usr/bin/env node
/**
 * Download hero portrait + signature ability icons from deadlock-api assets.
 * Usage: node scripts/pull-ability-icons.mjs --hero 1
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = process.env.DEADLOCK_API_BASE || "https://api.deadlock-api.com";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "public", "deadlock-assets");

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "deadlock-companion-assets/0.1" },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "deadlock-companion-assets/0.1" },
  });
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  console.log("saved", path.relative(process.cwd(), dest), buf.length);
}

const heroId = Number(argValue("--hero"));
if (!Number.isFinite(heroId)) {
  console.error("Usage: npm run assets:pull -- --hero <id>");
  process.exit(1);
}

const hero = await getJson(`${API}/v1/assets/heroes/${heroId}`);
const items = await getJson(`${API}/v1/assets/items/by-hero-id/${heroId}`);
const byClass = new Map(items.map((it) => [it.class_name, it]));

const portrait =
  hero.images?.icon_hero_card_webp || hero.images?.icon_hero_card;
if (!portrait) throw new Error("No portrait image on hero payload");
await download(portrait, path.join(ROOT, "heroes", String(heroId), "portrait.webp"));

const slots = ["signature1", "signature2", "signature3", "signature4"];
for (const slot of slots) {
  const cn = hero.items?.[slot];
  if (!cn) continue;
  let it = byClass.get(cn);
  if (!it) {
    it = await getJson(`${API}/v1/assets/items/${cn}`);
  }
  const icon = it.image_webp || it.image;
  if (!icon) {
    console.warn("no icon for", cn);
    continue;
  }
  await download(icon, path.join(ROOT, "abilities", cn, "icon.webp"));
  console.log(`  ${slot}: ${it.name} (${cn})`);
}

console.log("Done. Update manifest.json + schematics if this is a new hero.");
