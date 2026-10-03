"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LandingSettings } from "@/lib/settings";

const NAV = [
  { label: "Work", href: "/#work" },
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "About", href: "/#about" },
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
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll while the mobile menu is open; close on Escape or when the screen grows to desktop.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "bg-ink/80 backdrop-blur-xl border-b border-white/10"
          : "bg-gradient-to-b from-ink/70 to-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-5 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center min-w-0"
          aria-label={`${branding.companyName} — home`}
        >
          <img
            src={branding.logoUrl}
            alt={branding.companyName}
            className="h-9 sm:h-10 w-auto max-w-[170px] sm:max-w-[200px] object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-1 text-sm text-fog">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-spark relative inline-flex items-center px-3 py-2 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={quoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 rounded-full bg-gold px-5 py-2.5 font-semibold text-ink transition hover:bg-gold-dim hover:shadow-[0_0_28px_rgba(243,179,60,0.4)]"
          >
            {ctaLabel}
          </a>
        </div>

        <button
          type="button"
          className="md:hidden flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="md:hidden fixed inset-x-0 top-16 bottom-0 h-[calc(100dvh-4rem)] overflow-y-auto bg-ink/95 backdrop-blur-2xl animate-in fade-in duration-300"
        >
          <div className="px-6 pt-6 pb-10 flex flex-col min-h-full">
            <ul className="flex flex-col">
              {NAV.map((item) => (
                <li key={item.href} className="border-b border-white/10">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-5 font-display text-3xl font-bold tracking-tight text-white active:text-teal"
                  >
                    {item.label}
                    <span aria-hidden className="text-fog text-xl">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-8 flex h-14 items-center justify-center rounded-full bg-gold text-base font-semibold text-ink"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
