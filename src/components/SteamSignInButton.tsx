"use client";

import { useEffect, useId, useState } from "react";

/**
 * Steam sign-in placeholder. Not wired to OpenID — later this saves
 * settings such as theme against the signed-in account.
 */
export function SteamSignInButton() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-display inline-flex items-center gap-2 bg-[#ff7a18] px-3 py-1.5 text-sm uppercase text-[#1a0e06] hover:bg-[#ff8d3a]"
      >
        <SteamMark />
        <span className="hidden sm:inline">Login with Steam</span>
        <span className="sm:hidden">Steam</span>
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 id={titleId} className="text-base font-semibold text-zinc-50">
              Login with Steam
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Steam sign-in is not connected yet. When it is, it will save app
              settings such as theme on your account.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SteamMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="text-zinc-300">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-9.9 11.4l5.4 2.2a2.9 2.9 0 0 1 1.6-.5l2.4-3.5a4.2 4.2 0 1 1 2.5 2.4l-3.4 2.4a2.9 2.9 0 0 1 .1.7 2.9 2.9 0 0 1-5.7.7L2.3 16A10 10 0 1 0 12 2Zm-3.6 15.4a1.9 1.9 0 1 0 .1-3.3 1.9 1.9 0 0 0-.1 3.3ZM16.2 12a3.2 3.2 0 1 0-3.2-3.2A3.2 3.2 0 0 0 16.2 12Z"
      />
    </svg>
  );
}
