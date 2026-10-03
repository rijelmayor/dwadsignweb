import Image from "next/image";
import type { LandingSettings } from "@/lib/settings";
import { site } from "@/lib/site";

const NAV = [
  { label: "Work", href: "/#work" },
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

const social =
  "flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-fog transition hover:border-gold hover:bg-gold/10 hover:text-gold";

export default function Footer({ links }: { links: LandingSettings["links"] }) {
  const fb = links.facebook || site.facebook;
  return (
    <footer className="relative overflow-hidden border-t border-white/10 px-5 py-12 sm:px-8 sm:py-16">
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
        <Image
          src="/logo-full.png"
          alt={`${site.name} ${site.descriptor}`}
          width={720}
          height={491}
          className="h-20 w-auto self-start sm:h-24"
        />

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fog">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="py-2 transition hover:text-white">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {fb && (
            <a href={fb} target="_blank" rel="noopener noreferrer" className={social} aria-label="Facebook">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                <path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7H17V3.9c-.3 0-1.3-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.5H7.5v3.3h2.8V22h3.2z" />
              </svg>
            </a>
          )}
          {links.instagram && (
            <a href={links.instagram} target="_blank" rel="noopener noreferrer" className={social} aria-label="Instagram">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          )}
        </div>
      </div>
      <p className="relative mx-auto mt-10 max-w-7xl text-xs text-fog/80">
        © {new Date().getFullYear()} {site.name} {site.descriptor}. All rights reserved.
      </p>
    </footer>
  );
}
