# Asset ingest notes

Local assets power ability teaching without relying on the (usually null) ability `videos` field on the public API.

## Icons & portraits (easy)

API assets are solid for icons/text/numbers.

```bash
# Pull one hero's portrait + signature ability icons into public/deadlock-assets
npm run assets:pull -- --hero 1
npm run assets:pull -- --hero 13
```

What the script does:

1. `GET https://api.deadlock-api.com/v1/assets/heroes/{id}`
2. Saves `images.icon_hero_card_webp` → `heroes/{id}/portrait.webp`
3. Reads `items.signature1..4` class names
4. `GET /v1/assets/items/{class_name}` (or by-hero-id list) for `image_webp`
5. Saves → `abilities/{class_name}/icon.webp`

Then add / update the hero block in `public/deadlock-assets/manifest.json` and write a schematic JSON (copy an existing shape).

## In-game ability clips (Valve preview movies)

These are the real champ-casting-the-power previews from the client. The API `videos` field is usually `null`, but the files are on the assets CDN:

```
https://assets-bucket.deadlock-api.com/assets-api-res/videos/hero_abilities/<filename>.webm
```

Filenames come from each ability’s `m_strMoviePreviewPath` in game data (often under `videos/hero_abilities/…`). Note Valve’s typo `abilty_` on some files (e.g. Afterburn).

### Discover a filename

1. Open `https://deadworks.net/db/abilities/{ability_class_name}` and search for `videos/hero_abilities/`.
2. Or grep game VData / Deadworks dumps for `m_strMoviePreviewPath`.

### Pull + wire locally

```bash
# Example: Napalm (Infernus)
curl -L -A 'deadlock-companion' -o public/deadlock-assets/abilities/ability_incendiary_projectile/clip.webm \
  'https://assets-bucket.deadlock-api.com/assets-api-res/videos/hero_abilities/ability_inferno_incendiary.webm'
```

Set `"clip": "abilities/{class_name}/clip.webm"` in the manifest.

Also generate live-friendly derivatives next to the full clip (keeps `/live` responsive):

```bash
# poster + ~640w low-bitrate VP9 (no audio)
ffmpeg -y -ss 1.2 -i clip.webm -frames:v 1 -vf scale=640:-2 -q:v 70 poster.webp
ffmpeg -y -i clip.webm -vf scale=640:-2 -c:v libvpx-vp9 -b:v 350k -an clip-live.webm
```

Live UI prefers `clip-live.webm` + `poster.webp`, skips video for `shape: "passive"`, and only decodes on hover.

Or batch known mappings:

```bash
npm run assets:pull-clips -- --hero 1
npm run assets:pull-clips -- --hero 13
```

### Known prototype mappings (Infernus + Haze)

| Ability class | CDN file |
| --- | --- |
| `ability_incendiary_projectile` | `ability_inferno_incendiary.webm` |
| `ability_flame_dash` | `ability_inferno_flame_dash.webm` |
| `ability_afterburn` | `abilty_inferno_afterburn.webm` |
| `ability_fire_bomb` | `ability_inferno_stun_bomb.webm` |
| `ability_sleep_dagger` | `ability_haze_sleep_dagger.webm` |
| `ability_smoke_bomb` | `ability_haze_smoke_bomb.webm` |
| `ability_stacking_damage` | `ability_haze_fixation.webm` |
| `ability_bullet_flurry` | `ability_haze_bullet_flurry.webm` |

Optional later: full DepotDownloader / VPK extract if CDN coverage gaps appear. Do **not** block UI on clips — schematic + icon still work offline.

## Schematics (manual teaching shapes)

Minimal JSON under `schematics/{ability_class_name}.json`:

| Field | Notes |
| --- | --- |
| `shape` | `circle` \| `cone` \| `line` \| `projectile` \| `dash_trail` \| `hook` \| `aoe_delay` \| `passive` |
| `overrides` | Optional `range_m`, `radius_m`, `width_m`, `angle_deg`, `duration_s`, `delay_s` |
| `api_property_keys` | Map fields → API `properties` keys when overrides omitted |
| `beginner_hints` / `watch_for` | Short teaching strings |
| `threats` | Optional live tags: `stun` `slow` `sleep` `silence` `displace` `root` `invis` `dash` `burn` `damage_amp` |

## Manifest checklist

- [ ] Portrait + 4 icons on disk
- [ ] 4 schematic JSON files with shape + hints
- [ ] Optional: 4 `clip.webm` from CDN hero_abilities
- [ ] Hero entry in `manifest.json`
- [ ] Spot-check `/heroes/{id}` offline still shows icons + schematic (+ clips if present)
