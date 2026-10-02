import { site } from "@/lib/site";

export interface BrandingSettings {
  logoUrl: string;
  /** TIFF archive generated when a new logo is saved. Web rendering uses logoUrl. */
  logoTiffData: string;
  companyName: string;
  teamImage: string;
}

export interface ServiceItem {
  title: string;
  desc: string;
  icon: string;
  background: string;
}

export interface ProjectItem {
  title: string;
  tag: string;
  image: string;
  url: string;
}

export interface LandingSettings {
  branding: BrandingSettings;
  hero: { eyebrow: string; headline: string; accent: string; headlineEnd: string; sub: string; ctaLabel: string };
  marquee: string[];
  services: ServiceItem[];
  projects: ProjectItem[];
  contact: { phone: string; email: string; address: string; hours: string };
  links: { quoteUrl: string; facebook: string; instagram: string };
  sectionBackgrounds: { whatWeDo: string };
}

const DEFAULT_IMAGES = {
  whatWeDo: "https://www.mixandpatch.ph/assets/about-us-photo.jpg",
  signages: "https://cdn.sanity.io/images/wqvxnrg7/production/15dc81b64c8d5b7dd1c359284761f6a38ce5816e-640x640.jpg",
  largeFormatPrinting: "https://www.heeter.com/hs-fs/hubfs/Imported_Blog_Media/Blog2.jpg?height=498&name=Blog2.jpg&width=700",
  brandingDisplay: "https://uploads-ssl.webflow.com/63a58ae3581f4d07842895a1/64499d2420d2b9291a73d7a7_Adidas.webp",
};

export const DEFAULT_LANDING: LandingSettings = {
  branding: {
    logoUrl: "/dwlogo.png",
    logoTiffData: "",
    companyName: site.name,
    teamImage: "",
  },
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
    { title: "Signages", desc: "3D acrylic letters, lightboxes, LED neon flex, and wayfinding systems — fabricated in-house.", icon: "◼", background: DEFAULT_IMAGES.signages },
    { title: "Large Format Printing", desc: "Tarpaulin banners, panaflex, stickers, decals, and UV prints at production-grade quality.", icon: "▤", background: DEFAULT_IMAGES.largeFormatPrinting },
    { title: "Branding & Display", desc: "Roll-up banners, wall murals, trade-show displays, and complete brand environments.", icon: "◈", background: DEFAULT_IMAGES.brandingDisplay },
  ],
  projects: [
    { title: "Neon Café Identity", tag: "LED Neon", image: "", url: "" },
    { title: "Retail Lightbox Wall", tag: "Lightbox", image: "", url: "" },
    { title: "Storefront Panaflex Sign", tag: "Panaflex", image: "", url: "" },
    { title: "Office Wayfinding Suite", tag: "Signage", image: "", url: "" },
    { title: "Mall Atrium Mural", tag: "Wall Mural", image: "", url: "" },
  ],
  contact: {
    phone: "+63 (XXX) XXX-XXXX",
    email: "hello@dwadsign.com",
    address: "Your address here",
    hours: "Mon – Sat, 9:00 AM – 6:00 PM",
  },
  links: { quoteUrl: site.facebook, facebook: site.facebook, instagram: "" },
  sectionBackgrounds: { whatWeDo: DEFAULT_IMAGES.whatWeDo },
};

function nonEmptyArray<T>(v: unknown, fallback: T[]): T[] {
  return Array.isArray(v) && v.length > 0 ? (v as T[]) : fallback;
}

function str(v: unknown, fallback: string) {
  return typeof v === "string" ? v : fallback;
}

export function mergeLanding(raw: unknown): LandingSettings {
  const r = (raw ?? {}) as Partial<LandingSettings>;
  const d = DEFAULT_LANDING;
  const rb = (r.branding ?? {}) as Partial<BrandingSettings>;
  const rh = (r.hero ?? {}) as Partial<LandingSettings["hero"]>;
  const rc = (r.contact ?? {}) as Partial<LandingSettings["contact"]>;
  const rl = (r.links ?? {}) as Partial<LandingSettings["links"]>;
  const rs = (r.sectionBackgrounds ?? {}) as Partial<LandingSettings["sectionBackgrounds"]>;

  return {
    branding: {
      logoUrl: str(rb.logoUrl, d.branding.logoUrl),
      logoTiffData: str(rb.logoTiffData, d.branding.logoTiffData),
      companyName: str(rb.companyName, d.branding.companyName),
      teamImage: str(rb.teamImage, d.branding.teamImage),
    },
    hero: { ...d.hero, ...rh },
    marquee: nonEmptyArray(r.marquee, d.marquee),
    services: nonEmptyArray(r.services, d.services).map((s, i) => ({
      ...d.services[i % d.services.length],
      ...(s as Partial<ServiceItem>),
      background: str((s as Partial<ServiceItem>).background, d.services[i % d.services.length]?.background ?? ""),
    })),
    projects: nonEmptyArray(r.projects, d.projects).map((p, i) => ({
      ...d.projects[i % d.projects.length],
      ...(p as Partial<ProjectItem>),
      url: str((p as Partial<ProjectItem>).url, ""),
    })),
    contact: { ...d.contact, ...rc },
    links: { ...d.links, ...rl },
    sectionBackgrounds: { whatWeDo: str(rs.whatWeDo, d.sectionBackgrounds.whatWeDo) },
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

export interface LightRate { without: number; with: number }
export const MATERIAL_RATES: [string, string][] = [
  ["panaflex", "Panaflex"], ["acrylic", "Acrylic"], ["neon", "Neon LED"], ["apc", "APC"],
  ["tarp", "Tarp"], ["sticker", "Sticker"], ["metal", "Metal Sheet"], ["custom", "Custom"],
];
export const LIGHTBOX_RATES: [string, string][] = [["builtup", "Lightbox · Built-up"], ["acrylic", "Lightbox · Acrylic build"]];
export const PRINTING_RATES: [string, string][] = [["direct", "Direct to materials"], ["sticker", "Sticker print"], ["cutout", "Sticker Cut Out"], ["uv", "UV Print"]];

export interface PricingSettings {
  constructionPerSqft: number;
  materials: Record<string, LightRate>;
  lightbox: Record<string, LightRate>;
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
  markupPct: 40, vatPct: 12, quotePrefix: "DW",
  terms: ["This quotation is valid for 30 days from the date of issue.", "50% downpayment is required to commence production.", "Prices are subject to site survey confirmation."],
  preparedByTitle: "Sales Specialist", pricing: DEFAULT_PRICING,
};
function num(v: unknown, fallback: number) { return typeof v === "number" && Number.isFinite(v) ? v : fallback; }
function obj(v: unknown): Record<string, unknown> { return v && typeof v === "object" ? (v as Record<string, unknown>) : {}; }
function mergeRate(raw: unknown, fallback: LightRate): LightRate { const r = obj(raw); return { without: num(r.without, fallback.without), with: num(r.with, fallback.with) }; }
function mergePricing(rawQuote: Record<string, unknown>): PricingSettings {
  const d = DEFAULT_PRICING; const np = obj(rawQuote.pricing);
  if (Object.keys(np).length > 0) {
    const mats = obj(np.materials), lbs = obj(np.lightbox), printing = obj(np.printing);
    return {
      constructionPerSqft: num(np.constructionPerSqft, d.constructionPerSqft),
      materials: Object.fromEntries(MATERIAL_RATES.map(([id]) => [id, mergeRate(mats[id], d.materials[id])])),
      lightbox: Object.fromEntries(LIGHTBOX_RATES.map(([id]) => [id, mergeRate(lbs[id], d.lightbox[id])])),
      printing: Object.fromEntries(PRINTING_RATES.map(([id]) => [id, num(printing[id], 0)])),
      minimumCharge: num(np.minimumCharge, d.minimumCharge), lightboxMinimumCharge: num(np.lightboxMinimumCharge, d.lightboxMinimumCharge),
    };
  }
  const op = obj(rawQuote.panaflexPricing), olb = obj(rawQuote.lightboxRoundPricing), face = obj(op.face), lighting = obj(op.lighting), printing = obj(op.printing);
  const lightWithout = num(lighting.without, 0), lightWith = num(lighting.with, 0);
  return {
    constructionPerSqft: num(op.constructionPerSqft, 0),
    materials: Object.fromEntries(MATERIAL_RATES.map(([id]) => { const f = num(face[id], 0); return [id, { without: f + lightWithout, with: f + lightWith }]; })),
    lightbox: { builtup: { without: num(olb.builtUp, 0), with: num(olb.builtUp, 0) }, acrylic: { without: num(olb.acrylic, 0), with: num(olb.acrylic, 0) } },
    printing: Object.fromEntries(PRINTING_RATES.map(([id]) => [id, num(printing[id], 0)])),
    minimumCharge: num(op.minimumCharge, 0), lightboxMinimumCharge: num(olb.minimumCharge, 0),
  };
}
export function mergeQuoteSettings(raw: unknown): QuoteSettings {
  const r = obj(raw), d = DEFAULT_QUOTE_SETTINGS;
  const terms = Array.isArray(r.terms) && r.terms.length > 0 ? (r.terms as string[]) : d.terms;
  return { markupPct: num(r.markupPct, d.markupPct), vatPct: num(r.vatPct, d.vatPct), quotePrefix: typeof r.quotePrefix === "string" && r.quotePrefix.trim() ? r.quotePrefix.trim() : d.quotePrefix, terms, preparedByTitle: typeof r.preparedByTitle === "string" ? r.preparedByTitle : d.preparedByTitle, pricing: mergePricing(r) };
}
