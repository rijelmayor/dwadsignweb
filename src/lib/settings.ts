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

/** ₱ per square foot, for the same material with the light off / on. */
export interface LightRate { without: number; with: number }

/** Material / service types priced with and without light (Lightbox has its own two builds). */
export const MATERIAL_RATES: [string, string][] = [
  ["panaflex", "Panaflex"],
  ["acrylic", "Acrylic"],
  ["neon", "Neon LED"],
  ["apc", "APC"],
  ["tarp", "Tarp"],
  ["sticker", "Sticker"],
  ["metal", "Metal Sheet"],
  ["custom", "Custom"],
];
export const LIGHTBOX_RATES: [string, string][] = [
  ["builtup", "Lightbox · Built-up"],
  ["acrylic", "Lightbox · Acrylic build"],
];
export const PRINTING_RATES: [string, string][] = [
  ["direct", "Direct to materials"],
  ["sticker", "Sticker print"],
  ["cutout", "Sticker Cut Out"],
  ["uv", "UV Print"],
];

export interface PricingSettings {
  /** Hidden internal construction / frame rate, ₱ per sqft (not a customer-facing option). */
  constructionPerSqft: number;
  /** Material rate per sqft, without and with light, for every material type. */
  materials: Record<string, LightRate>;
  /** Lightbox rate per sqft (builds), without and with light. */
  lightbox: Record<string, LightRate>;
  /** Printing add-on, ₱ per sqft. */
  printing: Record<string, number>;
  minimumCharge: number;
  lightboxMinimumCharge: number;
}

export interface QuoteSettings {
  markupPct: number;
  vatPct: number;
  quotePrefix: string;
  terms: string[];
  preparedByTitle: string;
  pricing: PricingSettings;
}

const zeroRate = (): LightRate => ({ without: 0, with: 0 });

export const DEFAULT_PRICING: PricingSettings = {
  constructionPerSqft: 0,
  materials: Object.fromEntries(MATERIAL_RATES.map(([id]) => [id, zeroRate()])),
  lightbox: Object.fromEntries(LIGHTBOX_RATES.map(([id]) => [id, zeroRate()])),
  printing: Object.fromEntries(PRINTING_RATES.map(([id]) => [id, 0])),
  minimumCharge: 0,
  lightboxMinimumCharge: 0,
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
  pricing: DEFAULT_PRICING,
};

function num(v: unknown, fallback: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function mergeRate(raw: unknown, fallback: LightRate): LightRate {
  const r = obj(raw);
  return { without: num(r.without, fallback.without), with: num(r.with, fallback.with) };
}

/**
 * Reads the new `pricing` block. Older saved settings (panaflexPricing: face + separate lighting add-on,
 * lightboxRoundPricing) are converted so existing prices keep the same totals:
 *   without = face + lighting.without · with = face + lighting.with
 */
function mergePricing(rawQuote: Record<string, unknown>): PricingSettings {
  const d = DEFAULT_PRICING;
  const np = obj(rawQuote.pricing);

  if (Object.keys(np).length > 0) {
    const mats = obj(np.materials);
    const lbs = obj(np.lightbox);
    const printing = obj(np.printing);
    return {
      constructionPerSqft: num(np.constructionPerSqft, d.constructionPerSqft),
      materials: Object.fromEntries(MATERIAL_RATES.map(([id]) => [id, mergeRate(mats[id], d.materials[id])])),
      lightbox: Object.fromEntries(LIGHTBOX_RATES.map(([id]) => [id, mergeRate(lbs[id], d.lightbox[id])])),
      printing: Object.fromEntries(PRINTING_RATES.map(([id]) => [id, num(printing[id], 0)])),
      minimumCharge: num(np.minimumCharge, d.minimumCharge),
      lightboxMinimumCharge: num(np.lightboxMinimumCharge, d.lightboxMinimumCharge),
    };
  }

  // ---- legacy shape ----
  const op = obj(rawQuote.panaflexPricing);
  const olb = obj(rawQuote.lightboxRoundPricing);
  const face = obj(op.face);
  const lighting = obj(op.lighting);
  const printing = obj(op.printing);
  const lightWithout = num(lighting.without, 0);
  const lightWith = num(lighting.with, 0);
  return {
    constructionPerSqft: num(op.constructionPerSqft, 0),
    materials: Object.fromEntries(
      MATERIAL_RATES.map(([id]) => {
        const f = num(face[id], 0);
        return [id, { without: f + lightWithout, with: f + lightWith }];
      }),
    ),
    lightbox: {
      builtup: { without: num(olb.builtUp, 0), with: num(olb.builtUp, 0) },
      acrylic: { without: num(olb.acrylic, 0), with: num(olb.acrylic, 0) },
    },
    printing: Object.fromEntries(PRINTING_RATES.map(([id]) => [id, num(printing[id], 0)])),
    minimumCharge: num(op.minimumCharge, 0),
    lightboxMinimumCharge: num(olb.minimumCharge, 0),
  };
}

export function mergeQuoteSettings(raw: unknown): QuoteSettings {
  const r = obj(raw);
  const d = DEFAULT_QUOTE_SETTINGS;
  const terms = Array.isArray(r.terms) && r.terms.length > 0 ? (r.terms as string[]) : d.terms;
  return {
    markupPct: num(r.markupPct, d.markupPct),
    vatPct: num(r.vatPct, d.vatPct),
    quotePrefix: typeof r.quotePrefix === "string" && r.quotePrefix.trim() ? r.quotePrefix.trim() : d.quotePrefix,
    terms,
    preparedByTitle: typeof r.preparedByTitle === "string" ? r.preparedByTitle : d.preparedByTitle,
    pricing: mergePricing(r),
  };
}
