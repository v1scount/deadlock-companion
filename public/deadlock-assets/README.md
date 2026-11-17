# Local Deadlock assets

Preferred layout (hero ability visuals track):

```
public/deadlock-assets/
  manifest.json
  heroes/{hero_id}/portrait.webp
  abilities/{ability_class_name}/icon.webp
  abilities/{ability_class_name}/clip.webm   # optional
  schematics/{ability_class_name}.json
```

Served at `/deadlock-assets/...`.

- Reader: `@/lib/hero-assets` (Hero pages only)
- Path helpers: `@/lib/assets`
- Schematic shape model: `@/types/schematic`

Legacy empty folders `images/` and `videos/` remain for older seams.

## Add the next hero (<15 min)

See `how_to_add_hero` in [manifest.json](./manifest.json) and [docs/ASSET_INGEST.md](../../docs/ASSET_INGEST.md).
