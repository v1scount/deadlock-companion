"use client";

import { useEffect } from "react";

/**
 * If this PC already has Deadlock's Pulp file, register it as the "Pulp"
 * family. Display text already prefers that name and falls back to Lilita One.
 */
export function LocalPulpFont() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/local-font");
        if (!res.ok || cancelled) return;
        const bytes = await res.arrayBuffer();
        if (cancelled || bytes.byteLength < 100) return;
        const face = new FontFace("Pulp", bytes, {
          weight: "100 900",
          style: "normal",
          display: "swap",
        });
        await face.load();
        if (cancelled) return;
        document.fonts.add(face);
      } catch {
        // Lilita One stays.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
