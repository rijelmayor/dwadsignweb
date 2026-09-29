import { site } from "@/lib/site";

export interface ServiceItem { title: string; desc: string; icon: string }
export interface ProjectItem { title: string; tag: string; image: string }

export interface LandingSettings {
  hero: { eyebrow: string; headline: string; accent: string; headlineEnd: string; sub: string; ctaLabel: string };
  marquee: string[];
  services: ServiceItem[];
  projects: ProjectItem[];
  contact: { phone: string; email: string; address: string; hours: string };
  links: { quoteUrl: string; facebook: string; instagram: string };
}

export const DEFAULT_LANDING: LandingSettings = {
  hero: {
    eyebrow: "Advertising · Signages · Large Format Print",
    headline: "We make brands",
    accent: "impossible",
    headlineEnd: "to miss.",
    sub: "From 3D signage, lightboxes and LED neon to large-format print and wall murals — designed, fabricated, and installed by one obsessive team.",
    ctaLabel: "Get a Quote",
  },
  marquee: ["3D ACRYLIC LETTERS", "LEDBOX SIGNS", "LED NEON", "PANAFLEX", "TARPAULIN", "WALL MURALS", "WAYFINDING", "BRANDING"],
  services: [
    { title: "Signages", desc: "3D acrylic letters, lightboxes, LED neon flex, and wayfinding systems — fabricated in-house.", icon: "◼" },
    { title: "Large Format Print", desc: "Tarpaulin banners, panaflex, stickers, decals, and UV prints at production-grade quality.", icon: "▤" },
    { title: "Branding & Display", desc: "Roll-up banners, wall murals, trade-show displays, and complete brand environments.", icon: "◈" },
  ],
  projects: [
    { title: "Neon Café Identity", tag: "LED Neon", image: "" },
    { title: "Retail Lightbox Wall", tag: "Lightbox", image: "" },
    { title: "Storefront Panaflex Sign", tag: "Panaflex", image: "" },
    { title: "Office Wayfinding Suite", tag: "Signage", image: "" },
    { title: "Mall Atrium Mural", tag: "Wall Mural", image: "" },
  ],
  contact: {
    phone: "+63 (XXX) XXX-XXXX",
    email: "hello@dwadsign.com",
    address: "Your address here",
    hours: "Mon – Sat, 9:00 AM – 6:00 PM",
  },
  links: { quoteUrl: site.facebook, facebook: site.facebook, instagram: "" },
};

function nonEmptyArray<T>(v: unknown, fallback: T[]): T[] {
  return Array.isArray(v) && v.length > 0 ? (v as T[]) : fallback;
}

export function mergeLanding(raw: unknown): LandingSettings {
  const r = (raw ?? {}) as Partial<LandingSettings>;
  const d = DEFAULT_LANDING;
  return {
    hero: { ...d.hero, ...(r.hero ?? {}) },
    marquee: nonEmptyArray(r.marquee, d.marquee),
    services: nonEmptyArray(r.services, d.services),
    projects: nonEmptyArray(r.projects, d.projects),
    contact: { ...d.contact, ...(r.contact ?? {}) },
    links: { ...d.links, ...(r.links ?? {}) },
  };
}

export async function fetchLandingSettings(): Promise<LandingSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("YOUR-PROJECT")) return DEFAULT_LANDING;
  try {
    const res = await fetch(`${url}/rest/v1/site_settings?key=eq.landing&select=value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return DEFAULT_LANDING;
    const rows = (await res.json()) as { value: unknown }[];
    return mergeLanding(rows[0]?.value);
  } catch {
    return DEFAULT_LANDING;
  }
}

export interface PanaflexPricing {
  /** Hidden construction/base rate. Still charged per square foot, but not exposed as a customer-facing frame option. */
  constructionPerSqft: number;
  face: Record<string, number>;
  lighting: Record<string, number>;
  printing: Record<string, number>;
  minimumCharge: number;
}

export interface QuoteSettings {
  markupPct: number;
  vatPct: number;
  quotePrefix: string;
  terms: string[];
  preparedByTitle: string;
  panaflexPricing: PanaflexPricing;
}

export const DEFAULT_PANAFLEX_PRICING: PanaflexPricing = {
  constructionPerSqft: 0,
  face: {
    panaflex: 0,
    tarp: 0,
    apc: 0,
    acrylic: 0,
    metal: 0,
    custom: 0,
  },
  lighting: {
    without: 0,
    with: 0,
  },
  printing: {
    sticker: 0,
    direct: 0,
    uv: 0,
  },
  minimumCharge: 0,
};

export const DEFAULT_QUOTE_SETTINGS: QuoteSettings = {
  markupPct: 40,
  vatPct: 12,
  quotePrefix: "DW",
  terms: [
    "This quotation is valid for 30 days from the date of issue.",
    "50% downpayment is required to commence production.",
    "Prices are subject to site survey confirmation.",
  ],
  preparedByTitle: "Sales Specialist",
  panaflexPricing: DEFAULT_PANAFLEX_PRICING,
};

function num(v: unknown, fallback: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function mergeNumberMap(raw: unknown, fallback: Record<string, number>) {
  const r = (raw ?? {}) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(fallback).map(([key, value]) => [key, num(r[key], value)]));
}

export function mergeQuoteSettings(raw: unknown): QuoteSettings {
  const r = (raw ?? {}) as Partial<QuoteSettings> & { panaflexPricing?: Partial<PanaflexPricing> };
  const d = DEFAULT_QUOTE_SETTINGS;
  const p: Partial<PanaflexPricing> = r.panaflexPricing ?? {};
  return {
    markupPct: num(r.markupPct, d.markupPct),
    vatPct: num(r.vatPct, d.vatPct),
    quotePrefix: r.quotePrefix?.trim() || d.quotePrefix,
    terms: nonEmptyArray(r.terms, d.terms),
    preparedByTitle: r.preparedByTitle ?? d.preparedByTitle,
    panaflexPricing: {
      constructionPerSqft: num(p.constructionPerSqft, d.panaflexPricing.constructionPerSqft),
      face: mergeNumberMap(p.face, d.panaflexPricing.face),
      lighting: mergeNumberMap(p.lighting, d.panaflexPricing.lighting),
      printing: mergeNumberMap(p.printing, d.panaflexPricing.printing),
      minimumCharge: num(p.minimumCharge, d.panaflexPricing.minimumCharge),
    },
  };
}
