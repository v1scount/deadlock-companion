import Link from "next/link";

import { HeroDetail } from "@/components/HeroDetail";

export default async function HeroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const heroId = Number(id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <p className="text-sm text-zinc-500">
        <Link href="/heroes" className="underline-offset-4 hover:underline">
          ← Heroes
        </Link>
      </p>
      {Number.isFinite(heroId) ? (
        <HeroDetail key={heroId} heroId={heroId} />
      ) : (
        <p className="text-sm text-red-400">Invalid hero id.</p>
      )}
    </div>
  );
}
