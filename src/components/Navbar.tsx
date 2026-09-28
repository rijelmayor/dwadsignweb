"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          {site.name.toUpperCase()}
          <span className="text-volt">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-fog">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white transition">
              {item.label}
            </Link>
          ))}
          <Link
            href="/quote"
            className="rounded-full bg-volt px-5 py-2 font-semibold text-ink hover:bg-volt-dim transition"
          >
            Get a Quote
          </Link>
        </div>

        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-line bg-ink px-6 py-4 flex flex-col gap-4 text-fog">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/quote" className="text-volt font-semibold" onClick={() => setOpen(false)}>
            Get a Quote →
          </Link>
        </div>
      )}
    </header>
  );
}
