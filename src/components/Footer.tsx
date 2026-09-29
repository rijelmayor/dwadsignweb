import Image from "next/image";
import type { LandingSettings } from "@/lib/settings";
import { site } from "@/lib/site";
export default function Footer({ links }: { links: LandingSettings["links"] }) {
  return (
    <footer className="border-t border-line px-6 py-14">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <Image src="/logo-full.png" alt={`${site.name} ${site.descriptor}`} width={720} height={491} className="h-24 w-auto" />
        </div>
        <div className="text-sm text-fog space-y-2 text-center md:text-left">
          <p className="font-display tracking-[0.3em] uppercase text-xs text-teal">{site.tagline}</p>
          <p>© {new Date().getFullYear()} {site.name} {site.descriptor}. All rights reserved.</p>
        </div>
        <div className="flex gap-6 text-sm text-fog">
          <a href={links.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Facebook</a>
          {links.instagram && (
            <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Instagram</a>
          )}
        </div>
      </div>
    </footer>
  );
}
