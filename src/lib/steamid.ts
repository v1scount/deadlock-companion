/**
 * Steam ID parse helpers for deadlock-api `account_id` (SteamID3).
 * account_id = SteamID64 − 76561197960265728
 */

export const STEAM_ID64_BASE = 76561197960265728n;

/** Max sensible SteamID3 (32-bit unsigned). */
const MAX_ACCOUNT_ID = 0xffff_ffff;

export type SteamParseSuccess = {
  ok: true;
  accountId: number;
  /** How the input was recognized. */
  source: "account_id" | "steamid64" | "profile_url" | "steam2";
};

export type SteamParseVanity = {
  ok: true;
  needsVanityResolve: true;
  vanity: string;
  source: "vanity_url" | "vanity_name";
};

export type SteamParseFailure = {
  ok: false;
  error: string;
};

export type SteamParseResult =
  | SteamParseSuccess
  | SteamParseVanity
  | SteamParseFailure;

function isSteamId64(n: bigint): boolean {
  return n >= STEAM_ID64_BASE && n < STEAM_ID64_BASE + BigInt(MAX_ACCOUNT_ID);
}

function isAccountId(n: bigint): boolean {
  return n > 0n && n <= BigInt(MAX_ACCOUNT_ID);
}

export function steamId64ToAccountId(steamId64: bigint | string | number): number {
  const n = typeof steamId64 === "bigint" ? steamId64 : BigInt(String(steamId64).trim());
  if (!isSteamId64(n)) {
    throw new Error("Not a valid SteamID64");
  }
  return Number(n - STEAM_ID64_BASE);
}

export function accountIdToSteamId64(accountId: number): string {
  if (!Number.isInteger(accountId) || accountId <= 0 || accountId > MAX_ACCOUNT_ID) {
    throw new Error("Not a valid account_id");
  }
  return (STEAM_ID64_BASE + BigInt(accountId)).toString();
}

/** STEAM_0:Y:Z → account_id = Z * 2 + Y */
function parseSteam2(raw: string): number | null {
  const m = raw.match(/^STEAM_([0-5]):([01]):(\d+)$/i);
  if (!m) return null;
  const y = Number(m[2]);
  const z = BigInt(m[3]);
  const accountId = Number(z * 2n + BigInt(y));
  if (!isAccountId(BigInt(accountId))) return null;
  return accountId;
}

/** [U:1:account_id] */
function parseSteam3Bracket(raw: string): number | null {
  const m = raw.match(/^\[U:1:(\d+)\]$/i);
  if (!m) return null;
  const n = BigInt(m[1]);
  if (!isAccountId(n)) return null;
  return Number(n);
}

function tryParseDigits(raw: string): SteamParseSuccess | SteamParseFailure | null {
  if (!/^\d+$/.test(raw)) return null;
  let n: bigint;
  try {
    n = BigInt(raw);
  } catch {
    return { ok: false, error: "Number is too large to be a Steam ID." };
  }
  if (isSteamId64(n)) {
    return {
      ok: true,
      accountId: Number(n - STEAM_ID64_BASE),
      source: "steamid64",
    };
  }
  if (isAccountId(n)) {
    return { ok: true, accountId: Number(n), source: "account_id" };
  }
  return {
    ok: false,
    error:
      "Number is not a valid SteamID64 or account_id (SteamID3). Paste a profile URL if unsure.",
  };
}

/**
 * Sync parse of SteamID64, account_id, STEAM_0:x:y, [U:1:id],
 * and steamcommunity /profiles/ or /id/ URLs.
 * Vanity (/id/…) returns `needsVanityResolve` — resolve via API route.
 */
export function parseSteamInput(raw: string): SteamParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a Steam ID or profile URL." };
  }

  const steam2 = parseSteam2(trimmed);
  if (steam2 != null) {
    return { ok: true, accountId: steam2, source: "steam2" };
  }

  const steam3 = parseSteam3Bracket(trimmed);
  if (steam3 != null) {
    return { ok: true, accountId: steam3, source: "account_id" };
  }

  const digitResult = tryParseDigits(trimmed);
  if (digitResult) return digitResult;

  // Profile / vanity URLs (with or without protocol)
  let urlText = trimmed;
  if (!/^https?:\/\//i.test(urlText) && /steamcommunity\.com/i.test(urlText)) {
    urlText = `https://${urlText.replace(/^\/+/, "")}`;
  }

  try {
    const url = new URL(urlText);
    if (!/steamcommunity\.com$/i.test(url.hostname.replace(/^www\./i, ""))) {
      // fall through to vanity-name heuristic below only for plain tokens
      throw new Error("not steamcommunity");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0]?.toLowerCase() === "profiles" && parts[1]) {
      const idPart = parts[1].replace(/\D.*/, "");
      const digit = tryParseDigits(idPart);
      if (digit && digit.ok) {
        return { ...digit, source: "profile_url" };
      }
      return {
        ok: false,
        error: "Profile URL must include a numeric SteamID64 under /profiles/.",
      };
    }
    if (parts[0]?.toLowerCase() === "id" && parts[1]) {
      const vanity = decodeURIComponent(parts[1]).trim();
      if (!vanity || !/^[a-zA-Z0-9_-]+$/.test(vanity)) {
        return { ok: false, error: "Invalid vanity name in profile URL." };
      }
      return { ok: true, needsVanityResolve: true, vanity, source: "vanity_url" };
    }
    return {
      ok: false,
      error: "Unrecognized Steam profile URL. Use /profiles/<SteamID64> or /id/<vanity>.",
    };
  } catch {
    // Plain vanity token (no spaces, typical Steam custom URL chars)
    if (/^[a-zA-Z][a-zA-Z0-9_-]{2,31}$/.test(trimmed)) {
      return {
        ok: true,
        needsVanityResolve: true,
        vanity: trimmed,
        source: "vanity_name",
      };
    }
    return {
      ok: false,
      error:
        "Could not parse input. Paste a SteamID64, account_id, or steamcommunity profile URL.",
    };
  }
}

export function isSteamParseVanity(
  result: SteamParseResult,
): result is SteamParseVanity {
  return result.ok === true && "needsVanityResolve" in result && result.needsVanityResolve;
}
