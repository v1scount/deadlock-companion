import fs from "node:fs";
import type { NextRequest } from "next/server";

import { findLocalPulpFont } from "@/lib/local-pulp";

export const runtime = "nodejs";

/**
 * Serve Valve Pulp only to this machine, and only if Deadlock already
 * has the file. A public host never gets the bytes.
 */
export function GET(request: NextRequest) {
  if (!isLocalHost(request)) {
    return new Response(null, { status: 404 });
  }
  const file = findLocalPulpFont();
  if (!file) {
    return new Response(null, { status: 404 });
  }
  const bytes = fs.readFileSync(file);
  return new Response(bytes, {
    headers: {
      "Content-Type": "font/ttf",
      "Cache-Control": "private, max-age=86400",
    },
  });
}

function isLocalHost(request: NextRequest): boolean {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}
