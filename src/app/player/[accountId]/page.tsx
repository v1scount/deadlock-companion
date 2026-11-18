import Link from "next/link";

import { PlayerProfile } from "@/components/PlayerProfile";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const id = Number(accountId);
  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-sm text-zinc-400">That player id is not valid.</p>
        <Link href="/" className="mt-3 inline-block text-sm text-amber-500 hover:text-amber-400">
          Back to search
        </Link>
      </div>
    );
  }
  return <PlayerProfile accountId={id} />;
}
