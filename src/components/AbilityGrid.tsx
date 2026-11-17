"use client";

import { useEffect, useMemo, useState } from "react";

import { AbilitySchematicView } from "@/components/AbilitySchematicView";
import { AbilityThreatBadges } from "@/components/AbilityThreatBadges";
import { LiveAbilityMedia } from "@/components/LiveAbilityMedia";
import {
  plainAbilityText,
  resolveSchematicNumbers,
} from "@/lib/ability-props";
import type { ResolvedAbilityAssets } from "@/lib/hero-assets";
import type { Ability } from "@/types/deadlock";
import type { AbilitySchematic } from "@/types/schematic";
import { THREAT_META, type AbilityThreat } from "@/types/threat";

export type AbilityGridVariant = "browse" | "live";

interface Props {
  localAbilities: ResolvedAbilityAssets[];
  apiAbilities?: Ability[];
  /** Preloaded schematics (live kit cache). */
  schematics?: Record<string, AbilitySchematic | null>;
  variant?: AbilityGridVariant;
}

const STAT_KEYS = [
  "AbilityCooldown",
  "AbilityCastRange",
  "AbilityDuration",
  "Radius",
] as const;

function resolveThreats(
  schematic: AbilitySchematic | null | undefined,
): AbilityThreat[] {
  return schematic?.threats ?? [];
}

function isPassive(schematic: AbilitySchematic | null | undefined): boolean {
  return schematic?.shape === "passive";
}

export function AbilityGrid({
  localAbilities,
  apiAbilities = [],
  schematics: schematicsProp,
  variant = "browse",
}: Props) {
  const byClass = useMemo(() => {
    const m = new Map<string, Ability>();
    for (const a of apiAbilities) m.set(a.class_name, a);
    return m;
  }, [apiAbilities]);

  const list =
    localAbilities.length > 0
      ? localAbilities
      : apiAbilities.map((a, i) => ({
          class_name: a.class_name,
          slot: (`signature${Math.min(i + 1, 4)}` as ResolvedAbilityAssets["slot"]),
          name: a.name,
          iconUrl: a.image_webp || a.image || "",
          clipUrl: a.videos?.webm ?? null,
          liveClipUrl: null,
          posterUrl: null,
          schematicUrl: "",
        }));

  const schematicKey = list.map((a) => a.schematicUrl).join("|");
  const [schematicsLocal, setSchematicsLocal] = useState<
    Record<string, AbilitySchematic | null>
  >({});

  useEffect(() => {
    if (schematicsProp) return;
    let cancelled = false;
    void (async () => {
      const { loadAbilitySchematic } = await import("@/lib/hero-assets");
      const entries = await Promise.all(
        list.map(async (a) => {
          if (!a.schematicUrl) return [a.class_name, null] as const;
          const s = await loadAbilitySchematic(a.schematicUrl);
          return [a.class_name, s] as const;
        }),
      );
      if (!cancelled) setSchematicsLocal(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schematicKey, schematicsProp]);

  const schematics = schematicsProp ?? schematicsLocal;

  if (list.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No local abilities in the manifest for this hero yet.
      </p>
    );
  }

  const live = variant === "live";

  return (
    <div
      className={
        live ? "grid grid-cols-2 gap-1.5" : "grid gap-4 sm:grid-cols-2"
      }
    >
      {list.map((ability) => {
        const api = byClass.get(ability.class_name);
        const schematic = schematics[ability.class_name] ?? null;
        const numbers = schematic
          ? resolveSchematicNumbers(schematic, api)
          : {};
        const threats = resolveThreats(schematic);
        const quip = plainAbilityText(api?.description?.quip);
        const desc = plainAbilityText(api?.description?.desc);
        const passive = isPassive(schematic);

        if (live) {
          const liveSrc = ability.liveClipUrl || ability.clipUrl;
          return (
            <article
              key={ability.class_name}
              className="group relative overflow-hidden rounded-lg bg-zinc-950 ring-1 ring-zinc-800/80"
            >
              <div className="relative aspect-[4/3] bg-zinc-950">
                <LiveAbilityMedia
                  src={liveSrc}
                  posterUrl={ability.posterUrl}
                  iconUrl={ability.iconUrl}
                  allowVideo={!passive && !!liveSrc}
                  className="absolute inset-0 h-full w-full"
                />

                {passive ? (
                  <div className="pointer-events-none absolute inset-0 bg-zinc-950/35" />
                ) : null}

                {threats.length ? (
                  <AbilityThreatBadges
                    threats={threats}
                    placement="overlay"
                  />
                ) : null}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 pb-1.5 pt-8">
                  <div className="flex items-end gap-1.5">
                    {ability.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ability.iconUrl}
                        alt=""
                        className="h-5 w-5 shrink-0 rounded object-contain"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-zinc-50">
                        {ability.name}
                        {passive ? (
                          <span className="ml-1 font-normal text-zinc-400">
                            · passive
                          </span>
                        ) : null}
                      </p>
                      {threats.length ? (
                        <p className="truncate text-[10px] text-zinc-300/90">
                          {threats.map((t) => THREAT_META[t].label).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        }

        return (
          <article
            key={ability.class_name}
            className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60"
          >
            <header className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
              {ability.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ability.iconUrl}
                  alt=""
                  className="h-8 w-8 rounded object-contain"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800 text-[10px] text-zinc-500">
                  ?
                </span>
              )}
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-zinc-50">
                  {ability.name}
                </h3>
                <p className="font-mono text-[10px] text-zinc-500">
                  {ability.slot}
                </p>
              </div>
              {threats.length ? (
                <div className="ml-auto">
                  <AbilityThreatBadges threats={threats} placement="inline" />
                </div>
              ) : null}
            </header>

            <div className="relative bg-black">
              {ability.clipUrl ? (
                <video
                  className="aspect-video w-full bg-black object-cover"
                  src={ability.clipUrl}
                  poster={ability.posterUrl ?? undefined}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : schematic ? (
                <AbilitySchematicView
                  shape={schematic.shape}
                  numbers={numbers}
                  label={ability.name}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-zinc-900 text-xs text-zinc-600">
                  No clip
                </div>
              )}
              {threats.length ? (
                <AbilityThreatBadges threats={threats} placement="overlay" />
              ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
              {quip ? (
                <p className="text-sm text-amber-200/90">{quip}</p>
              ) : null}
              {desc ? (
                <p className="text-sm leading-relaxed text-zinc-300">{desc}</p>
              ) : null}

              {schematic?.beginner_hints?.length ? (
                <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-400">
                  {schematic.beginner_hints.slice(0, 2).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : null}

              {schematic?.watch_for?.length ? (
                <ul className="list-disc space-y-1 pl-4 text-xs text-rose-300/70">
                  {schematic.watch_for.slice(0, 1).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : null}

              {api?.properties ? (
                <dl className="mt-auto grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-zinc-400">
                  {STAT_KEYS.map((key) => {
                    const p = api.properties?.[key];
                    if (!p?.value && p?.value !== 0) return null;
                    return (
                      <div
                        key={key}
                        className="rounded border border-zinc-800/80 bg-zinc-900/40 px-2 py-1"
                      >
                        <dt className="text-zinc-500">{p.label ?? key}</dt>
                        <dd className="font-mono text-zinc-200">
                          {String(p.value)}
                          {p.postfix ?? ""}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
