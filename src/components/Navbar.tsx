"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { LandingSettings } from "@/lib/settings";

const NAV = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/#work" },
  { label: "Process", href: "/#process" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar({ quoteUrl, ctaLabel, branding }: { quoteUrl: string; ctaLabel: string; branding: LandingSettings["branding"] }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-ink/65 backdrop-blur-xl supports-[backdrop-filter]:bg-ink/45">
      <nav className="mx-auto max-w-7xl px-5 sm:px-6 h-[76px] flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center min-w-0" aria-label={`${branding.companyName} — home`}>
          <img src={branding.logoUrl} alt={branding.companyName} className="h-11 sm:h-12 w-auto max-w-[210px] object-contain" />
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-fog">
          {NAV.map((item) => <Link key={item.href} href={item.href} className="nav-spark relative inline-flex items-center hover:text-white transition">{item.label}</Link>)}
          <a href={quoteUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-gold px-5 py-2.5 font-semibold text-ink hover:bg-gold-dim transition">{ctaLabel}</a>
        </div>
        <button className="md:hidden text-white text-xl" onClick={() => setOpen(!open)} aria-label="Menu">{open ? "✕" : "☰"}</button>
      </nav>
      {open && <div className="md:hidden border-t border-white/10 bg-ink/90 backdrop-blur-xl px-6 py-4 flex flex-col gap-4 text-fog">{NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}<a href={quoteUrl} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold" onClick={() => setOpen(false)}>{ctaLabel} →</a></div>}
    </header>
  );
}
