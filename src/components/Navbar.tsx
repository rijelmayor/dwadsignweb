"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LandingSettings } from "@/lib/settings";

const NAV = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/#work" },
  { label: "Process", href: "/#process" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar({
  quoteUrl,
  ctaLabel,
  branding,
}: {
  quoteUrl: string;
  ctaLabel: string;
  branding: LandingSettings["branding"];
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-white/10 bg-ink/80 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] supports-[backdrop-filter]:bg-ink/55"
          : "border-transparent bg-ink/40 backdrop-blur-md supports-[backdrop-filter]:bg-ink/25"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-5 sm:px-6 h-[76px] flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center min-w-0" aria-label={`${branding.companyName} — home`}>
          <img
            src={branding.logoUrl}
            alt={branding.companyName}
            className="h-11 sm:h-12 w-auto max-w-[210px] object-contain transition hover:opacity-90"
          />
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-fog">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-spark relative inline-flex items-center hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={quoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-gold px-5 py-2.5 font-semibold text-ink hover:bg-gold-dim transition hover:shadow-[0_0_28px_rgba(243,179,60,0.4)]"
          >
            {ctaLabel}
          </a>
        </div>
        <button
          className="md:hidden text-white text-xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-white/10 bg-ink/95 backdrop-blur-xl px-6 py-5 flex flex-col gap-4 text-fog animate-in fade-in duration-300">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="hover:text-white transition py-1"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={quoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold font-semibold pt-2"
            onClick={() => setOpen(false)}
          >
            {ctaLabel} →
          </a>
        </div>
      )}
    </header>
  );
}
