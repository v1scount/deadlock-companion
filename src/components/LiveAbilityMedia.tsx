"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  /** Low-res live webm. */
  src: string | null;
  posterUrl: string | null;
  iconUrl?: string;
  className?: string;
  /** When false, never mount a <video> — poster/icon only. */
  allowVideo?: boolean;
}

const MAX_PLAYING = 2;
const playing = new Set<HTMLVideoElement>();

function release(el: HTMLVideoElement | null) {
  if (!el) return;
  el.pause();
  playing.delete(el);
  el.removeAttribute("src");
  el.load();
}

/**
 * Live cells: poster-first. Video mounts only on hover/focus and is capped
 * globally so the roster cannot decode many WebMs at once.
 */
export function LiveAbilityMedia({
  src,
  posterUrl,
  iconUrl,
  className,
  allowVideo = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);

  const stop = useCallback(() => {
    setActive(false);
    release(videoRef.current);
  }, []);

  const start = useCallback(() => {
    if (!allowVideo || !src) return;
    setActive(true);
  }, [allowVideo, src]);

  useEffect(() => {
    if (!active || !src) return;
    const el = videoRef.current;
    if (!el) return;

    // Evict oldest if at cap.
    if (!playing.has(el) && playing.size >= MAX_PLAYING) {
      const oldest = playing.values().next().value;
      if (oldest) release(oldest);
    }

    el.src = src;
    el.load();
    playing.add(el);
    void el.play().catch(() => {
      release(el);
      setActive(false);
    });

    return () => release(el);
  }, [active, src]);

  return (
    <div
      className={`relative overflow-hidden bg-zinc-950 ${className ?? ""}`}
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl}
          alt=""
          className="absolute inset-0 m-auto h-10 w-10 object-contain opacity-70"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-900" />
      )}

      {active && src ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : null}

      {allowVideo && src ? (
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/55 px-1 py-0.5 text-[9px] uppercase tracking-wide text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100">
          Hover
        </span>
      ) : null}
    </div>
  );
}
