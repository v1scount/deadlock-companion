import Link from "next/link";

import { HeroesIndex } from "@/components/HeroesIndex";

export default function HeroesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/" className="underline-offset-4 hover:underline">
            ← Profile
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-50">Heroes</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Ability teaching surface — local icons and schematics first.
        </p>
      </div>
      <HeroesIndex />
    </div>
  );
}
