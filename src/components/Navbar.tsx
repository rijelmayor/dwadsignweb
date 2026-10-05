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

  // Lock body scroll when mobile menu is open; close menu on resize to desktop
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-white/10 bg-ink/80 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] supports-[backdrop-filter]:bg-ink/55"
          : "border-transparent bg-ink/40 backdrop-blur-md supports-[backdrop-filter]:bg-ink/25"
      }`}
    >
      <nav className="relative mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 md:h-[68px] flex items-center justify-between gap-3 sm:gap-6">
        <Link
          href="/"
          className="flex items-center min-w-0 shrink-0"
          aria-label={`${branding.companyName} — home`}
          onClick={() => setOpen(false)}
        >
          <img
            src={branding.logoUrl}
            alt={branding.companyName}
            className="h-8 sm:h-9 md:h-10 w-auto max-w-[140px] sm:max-w-[160px] md:max-w-[180px] object-contain transition hover:opacity-90"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5 lg:gap-7 text-sm text-fog">
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
            className="rounded-full bg-gold px-4 lg:px-5 py-2 lg:py-2.5 font-semibold text-ink hover:bg-gold-dim transition hover:shadow-[0_0_28px_rgba(243,179,60,0.4)] whitespace-nowrap"
          >
            {ctaLabel}
          </a>
        </div>

        {/* Mobile / tablet hamburger — stays tight to the right edge */}
        <button
          type="button"
          className="md:hidden relative z-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 active:bg-white/15 transition"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
          <span className="flex h-5 w-5 flex-col items-center justify-center gap-[5px]">
            <span
              className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 origin-center ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                open ? "opacity-0 scale-x-0" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 origin-center ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile menu panel — full width, contained, no horizontal stretch */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-[320px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="border-t border-white/10 bg-ink/95 backdrop-blur-xl px-4 sm:px-6 py-4 flex flex-col gap-1 text-fog">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-base hover:text-white hover:bg-white/5 active:bg-white/10 transition"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={quoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 rounded-full bg-gold px-5 py-3 text-center font-semibold text-ink hover:bg-gold-dim transition"
            onClick={() => setOpen(false)}
          >
            {ctaLabel}
          </a>
        </div>
      </div>

      {/* Dim overlay behind menu (tap to close) — only when open */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="md:hidden fixed inset-0 top-14 sm:top-16 z-[-1] bg-ink/50 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}
    </header>
  );
}
