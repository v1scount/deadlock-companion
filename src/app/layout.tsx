import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Lilita_One, Nunito } from "next/font/google";

import { IdentityProvider } from "@/components/identity-provider";
import { LocalPulpFont } from "@/components/LocalPulpFont";
import { SiteNav } from "@/components/SiteNav";

import "./globals.css";

/** Poster stand-in. Valve Pulp is used only when this machine already has the game file. */
const display = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lilita",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deadlock Companion",
  description: "Deadlock stats companion — identity, live match, heroes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <LocalPulpFont />
        <IdentityProvider>
          <SiteNav />
          {children}
        </IdentityProvider>
      </body>
    </html>
  );
}
