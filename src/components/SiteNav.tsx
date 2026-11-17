import Link from "next/link";

import { AccountSettingsEntry } from "@/components/account-settings";

const links = [
  { href: "/", label: "Profile" },
  { href: "/live", label: "Live" },
  { href: "/heroes", label: "Heroes" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-3 py-2.5 sm:px-4 lg:px-5">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-50">
          Deadlock Companion
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm text-zinc-400">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-zinc-100"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <AccountSettingsEntry />
        </div>
      </div>
    </header>
  );
}
