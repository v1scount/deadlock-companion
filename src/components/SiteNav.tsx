import Link from "next/link";

import { SteamSignInButton } from "@/components/SteamSignInButton";

const links = [
  { href: "/", label: "Search" },
  { href: "/live", label: "Live" },
  { href: "/heroes", label: "Heroes" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(244,214,176,0.12)] bg-[#110d0a]/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-3 py-2.5 sm:px-4 lg:px-5">
        <Link href="/" className="font-display text-lg uppercase leading-none text-[#f6efe4]">
          Companion
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm text-[#cbbba6]">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-display text-[15px] uppercase tracking-wide transition-colors hover:text-[#ff7a18]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <SteamSignInButton />
        </div>
      </div>
    </header>
  );
}
