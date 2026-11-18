/**
 * Identity seam — who the app treats as "the user" for Home / Live fetches.
 *
 * Exports (contract):
 *   getAccountId(): number | null
 *   setAccountIdFromInput(raw: string): Promise<number>
 *   clearAccountId(): void
 *
 * v1: paste SteamID64 / SteamID3 / profile URL; persist in localStorage.
 * No Steam OpenID.
 *
 * ---------------------------------------------------------------------------
 * Phase 2 (optional, not implemented): Steam OpenID
 * ---------------------------------------------------------------------------
 * Goal: verified ownership + future bot-friend (patron steam-accounts).
 *
 * Sketch:
 * 1. Next.js route starts Steam OpenID 2.0
 *    (`https://steamcommunity.com/openid/login`) with return_to on our origin.
 * 2. Callback verifies assertion server-side, extracts SteamID64 from
 *    `openid.claimed_id`, converts to account_id, sets httpOnly session cookie
 *    (do not trust client-only storage for "verified" claims).
 * 3. IdentityProvider reads session via RSC / server promise; getAccountId()
 *    prefers verified session over manual localStorage fallback.
 * 4. Keep manual paste as guest / spectate for accounts the user does not own.
 * 5. Bot-friend: after verified login, call deadlock-api patron endpoints with
 *    server-held binding — never expose patron keys to the browser.
 *
 * Do not build the above in v1.
 * ---------------------------------------------------------------------------
 */

import {
  accountIdToSteamId64,
  isSteamParseVanity,
  parseSteamInput,
} from "@/lib/steamid";

export const ACCOUNT_ID_STORAGE_KEY = "deadlock.account_id";

type Listener = () => void;

let memoryAccountId: number | null = null;
let hydrated = false;
const listeners = new Set<Listener>();

export class IdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityError";
  }
}

/** @deprecated alias — prefer IdentityError */
export const IdentityInputError = IdentityError;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readStorage(): number | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_ID_STORAGE_KEY);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
}

function writeStorage(accountId: number | null): void {
  if (!canUseStorage()) return;
  try {
    if (accountId == null) {
      localStorage.removeItem(ACCOUNT_ID_STORAGE_KEY);
    } else {
      localStorage.setItem(ACCOUNT_ID_STORAGE_KEY, String(accountId));
    }
  } catch {
    // ignore quota / private mode
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** Load from localStorage once on the client. Safe to call repeatedly. */
export function hydrateAccountId(): number | null {
  if (!canUseStorage()) return memoryAccountId;
  memoryAccountId = readStorage();
  hydrated = true;
  return memoryAccountId;
}

export function isIdentityHydrated(): boolean {
  return hydrated || !canUseStorage();
}

/**
 * Current account_id (SteamID3), or null if unset.
 * Safe for other tracks to import. Returns null during SSR until hydrated.
 */
export function getAccountId(): number | null {
  if (!hydrated && canUseStorage()) {
    return hydrateAccountId();
  }
  return memoryAccountId;
}

function persistAccountId(accountId: number): void {
  if (!Number.isInteger(accountId) || accountId <= 0) {
    throw new IdentityError("account_id must be a positive integer");
  }
  memoryAccountId = accountId;
  hydrated = true;
  writeStorage(accountId);
  emit();
}

export function clearAccountId(): void {
  memoryAccountId = null;
  hydrated = true;
  writeStorage(null);
  emit();
}

/** Direct set when the caller already has a verified account_id. */
export function setAccountId(accountId: number): void {
  persistAccountId(accountId);
}

export type SetAccountIdResult = {
  accountId: number;
  source: string;
};

async function resolveVanity(vanity: string): Promise<number> {
  const res = await fetch(
    `/api/steam/resolve-vanity?vanity=${encodeURIComponent(vanity)}`,
  );
  const body = (await res.json().catch(() => null)) as {
    accountId?: number;
    error?: string;
  } | null;
  if (!res.ok || body?.accountId == null) {
    throw new IdentityError(
      body?.error ?? "Could not resolve that Steam vanity URL.",
    );
  }
  return body.accountId;
}

/**
 * Parse SteamID64 / account_id / profile URL (vanity via server proxy)
 * without saving it. Player search uses this so a lookup is not a login.
 */
export async function lookupAccountIdFromInput(
  raw: string,
): Promise<SetAccountIdResult> {
  const parsed = parseSteamInput(raw);
  if (!parsed.ok) {
    throw new IdentityError(parsed.error);
  }
  if (isSteamParseVanity(parsed)) {
    const accountId = await resolveVanity(parsed.vanity);
    return { accountId, source: parsed.source };
  }
  return { accountId: parsed.accountId, source: parsed.source };
}

/**
 * Parse SteamID64 / account_id / profile URL (vanity via server proxy),
 * persist account_id, notify subscribers. Returns the saved account_id.
 */
export async function setAccountIdFromInput(raw: string): Promise<number> {
  const { accountId } = await lookupAccountIdFromInput(raw);
  persistAccountId(accountId);
  return accountId;
}

/** Same as setAccountIdFromInput but also returns parse source (for UI). */
export async function setAccountIdFromInputDetailed(
  raw: string,
): Promise<SetAccountIdResult> {
  const result = await lookupAccountIdFromInput(raw);
  persistAccountId(result.accountId);
  return result;
}

export function subscribeAccountId(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function steamId64FromAccountId(accountId: number): string {
  return accountIdToSteamId64(accountId);
}

export { accountIdToSteamId64, parseSteamInput };
