import Link from "next/link";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-line px-6 py-12">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-6">
        <p className="font-display font-bold">
          {site.name.toUpperCase()}
          <span className="text-volt">.</span>
        </p>
        <p className="text-fog text-sm">
          © {new Date().getFullYear()} {site.domain} — All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-fog">
          <Link href={site.socials.facebook} className="hover:text-volt">Facebook</Link>
          <Link href={site.socials.instagram} className="hover:text-volt">Instagram</Link>
          <Link href="/quote" className="hover:text-volt">Quotation Tool</Link>
        </div>
      </div>
    </footer>
  );
}
