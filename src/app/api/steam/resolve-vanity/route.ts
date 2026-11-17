import { NextRequest } from "next/server";

import { steamId64ToAccountId } from "@/lib/steamid";

/**
 * Resolve a Steam vanity custom URL to account_id without OAuth.
 * Uses the public steamcommunity XML profile feed (no API key).
 */
export async function GET(request: NextRequest) {
  const vanity = request.nextUrl.searchParams.get("vanity")?.trim() ?? "";
  if (!vanity || !/^[a-zA-Z0-9_-]{1,64}$/.test(vanity)) {
    return Response.json({ error: "Invalid vanity name." }, { status: 400 });
  }

  const url = `https://steamcommunity.com/id/${encodeURIComponent(vanity)}/?xml=1`;
  let xml: string;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/xml,text/xml,*/*" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return Response.json(
        { error: "Steam community could not resolve that vanity URL." },
        { status: 404 },
      );
    }
    xml = await res.text();
  } catch {
    return Response.json(
      { error: "Failed to reach Steam community for vanity resolve." },
      { status: 502 },
    );
  }

  if (/<error>/i.test(xml) && !/<steamID64>/i.test(xml)) {
    return Response.json(
      { error: "No Steam profile found for that vanity name." },
      { status: 404 },
    );
  }

  const match = xml.match(/<steamID64>\s*(\d+)\s*<\/steamID64>/i);
  if (!match?.[1]) {
    return Response.json(
      { error: "Steam response did not include a SteamID64." },
      { status: 502 },
    );
  }

  try {
    const steamId64 = match[1];
    const accountId = steamId64ToAccountId(steamId64);
    return Response.json({ vanity, steamId64, accountId });
  } catch {
    return Response.json(
      { error: "Resolved SteamID64 was invalid." },
      { status: 502 },
    );
  }
}
