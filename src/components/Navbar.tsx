"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";

const NAV = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/#work" },
  { label: "Process", href: "/#process" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar({ quoteUrl, ctaLabel }: { quoteUrl: string; ctaLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label={`${site.name} — home`}>
          <Image src="/logo-mark.png" alt="DW" width={520} height={251} priority className="h-10 w-auto" />
          <span className="hidden sm:block leading-none">
            <span className="block font-display text-lg font-bold tracking-tight">
              Delight <span className="text-gold">Works</span>
            </span>
            <span className="block mt-1 text-[10px] tracking-[0.28em] uppercase text-fog">{site.descriptor}</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-fog">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white transition">{item.label}</Link>
          ))}
          <a href={quoteUrl} target="_blank" rel="noopener noreferrer"
            className="rounded-full bg-gold px-5 py-2 font-semibold text-ink hover:bg-gold-dim transition">
            {ctaLabel}
          </a>
        </div>
        <button className="md:hidden text-white text-xl" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? "✕" : "☰"}
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-line bg-ink px-6 py-4 flex flex-col gap-4 text-fog">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
          ))}
          <a href={quoteUrl} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold" onClick={() => setOpen(false)}>
            {ctaLabel} →
          </a>
        </div>
      )}
    </header>
  );
}
