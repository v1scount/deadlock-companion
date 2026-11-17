"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

import { useIdentity } from "@/components/identity-provider";
import { IdentityError } from "@/lib/identity";
import { accountIdToSteamId64 } from "@/lib/steamid";

type Props = {
  onChange?: (accountId: number | null) => void;
};

/**
 * Set / change / clear Steam account. Shows resolved persona when
 * `/v1/players/{id}/steam` works; otherwise account_id-only mode.
 */
export function AccountBinder({ onChange }: Props = {}) {
  const {
    accountId,
    hydrated,
    profile,
    profileStatus,
    setFromInput,
    clear,
  } = useIdentity();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputId = useId();

  useEffect(() => {
    if (hydrated) onChange?.(accountId);
  }, [accountId, hydrated, onChange]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { accountId: id } = await setFromInput(raw);
      setRaw("");
      onChange?.(id);
    } catch (err) {
      setError(
        err instanceof IdentityError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Invalid Steam ID",
      );
    } finally {
      setPending(false);
    }
  }

  function handleClear() {
    clear();
    setError(null);
    setRaw("");
    onChange?.(null);
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-medium text-zinc-300">
        {accountId == null ? "Set Steam ID" : "Change account"}
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        Paste SteamID64, account_id (SteamID3), or a steamcommunity profile URL.
        Stored locally — no OpenID in v1.
      </p>

      {!hydrated ? (
        <p className="mt-3 text-sm text-zinc-500">Loading saved account…</p>
      ) : accountId != null ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {profile?.avatarmedium ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarmedium}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded bg-zinc-800"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-zinc-100">
              {profileStatus === "loading"
                ? "Looking up persona…"
                : profile?.personaname ?? "Account set (persona unavailable)"}
            </p>
            <p className="font-mono text-xs text-zinc-500">
              account_id {accountId} · {accountIdToSteamId64(accountId)}
            </p>
            {profileStatus === "missing" ? (
              <p className="mt-1 text-xs text-amber-500/90">
                No Steam profile in deadlock-api yet — stats still work with
                account_id only.
              </p>
            ) : null}
            {profileStatus === "error" ? (
              <p className="mt-1 text-xs text-amber-500/90">
                Could not reach Steam profile lookup — using account_id only.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
          >
            Clear account
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap gap-2">
        <label htmlFor={inputId} className="sr-only">
          Steam ID or profile URL
        </label>
        <input
          id={inputId}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="76561198… / account_id / steamcommunity.com/…"
          autoComplete="off"
          spellCheck={false}
          className="min-w-[16rem] flex-1 rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
        <button
          type="submit"
          disabled={pending || !raw.trim()}
          className="rounded bg-amber-600 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500 disabled:opacity-40"
        >
          {pending ? "Saving…" : accountId == null ? "Save" : "Update"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </section>
  );
}
