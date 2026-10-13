export type Family = "flex" | "apc" | "acrylic" | "metal" | "neon" | "sticker" | "roundbox";
export const FAMILIES: [Family, string][] = [
  ["flex", "Flex & tarp"], ["apc", "APC"], ["acrylic", "Acrylic"], ["metal", "Metal"],
  ["neon", "LED neon"], ["sticker", "Sticker & vinyl"], ["roundbox", "Round box (max 2 ft)"],
];

/** flat = all-in cost per sqft · acrylic/neon = fabrication cost per sqft, acrylic sheet is added separately */
export interface Preset {
  id: string; service: string; family: Family; name: string; sub: string;
  lit: "with" | "without"; kind: "flat" | "acrylic" | "neon";
  thick?: boolean; waste?: number; rate: number; rateDouble: number;
}
const P = (id: string, service: string, family: Family, name: string, sub: string, lit: "with" | "without", kind: Preset["kind"], rate: number, rateDouble = 0, extra: Partial<Preset> = {}): Preset =>
  ({ id, service, family, name, sub, lit, kind, rate, rateDouble, ...extra });

// Starter rates are PLACEHOLDERS (cost per sqft). Replace in Builder Settings with your own.
export const PRESETS: Preset[] = [
  P("pf-nonlit", "panaflex", "flex", "Panaflex on frame, non-lit", "Printed flex, frame included", "without", "flat", 220, 330),
  P("pf-lit", "panaflex", "flex", "Panaflex lightbox, LED", "Backlit flex, LED", "with", "flat", 480, 700),
  P("tarp", "tarp", "flex", "Tarp on frame", "Printed tarp, frame included", "without", "flat", 150, 230),
  P("apc-sticker", "apc", "apc", "APC flat, sticker print", "On frame", "without", "flat", 380),
  P("apc-cut", "apc", "apc", "APC flat, cut vinyl", "Solid colour, no print", "without", "flat", 340),
  P("apc-tray", "apc", "apc", "APC tray fascia, sticker print", "Folded edges", "without", "flat", 520),
  P("metal-sheet", "metal", "metal", "Metal sheet, sticker print", "GI / aluminum, flat", "without", "flat", 330),
  P("metal-laser", "metal", "metal", "Laser-cut powder-coated panel", "Decorative", "without", "flat", 750),
  P("metal-channel", "metal", "metal", "Aluminum channel letters, LED", "Acrylic face, lit", "with", "flat", 1300),
  P("metal-ss", "metal", "metal", "Stainless built-up letters", "Hairline / gold / mirror", "without", "flat", 1600),
  P("metal-ss-halo", "metal", "metal", "Stainless built-up letters, halo", "Halo-lit", "with", "flat", 1900),
  P("ac-3mm", "acrylic", "acrylic", "Acrylic 3mm flat, sticker print", "Advertising bolts", "without", "acrylic", 256),
  P("ac-5mm", "acrylic", "acrylic", "Acrylic 5mm flat, sticker print", "Advertising bolts", "without", "acrylic", 318, 0, { thick: true }),
  P("ac-5mm-uv", "acrylic", "acrylic", "Acrylic 5mm flat, UV print", "Advertising bolts", "without", "acrylic", 398, 0, { thick: true }),
  P("ac-letters-flat", "acrylic", "acrylic", "Acrylic flat-cut letters 5mm", "Non-lit, box sqft", "without", "acrylic", 438, 0, { thick: true, waste: 1.5 }),
  P("ac-letters", "acrylic", "acrylic", "Acrylic build-up letters", "Face + returns, non-lit", "without", "acrylic", 688, 0, { thick: true, waste: 1.5 }),
  P("ac-letters-lit", "acrylic", "acrylic", "Acrylic build-up letters, LED", "Face-lit or halo", "with", "acrylic", 1088, 0, { thick: true, waste: 1.5 }),
  P("ac-box-cut", "acrylic", "acrylic", "Acrylic box, sticker cut-out", "White diffuser face, LED", "with", "acrylic", 738, 0, { thick: true }),
  P("ac-box-uv", "acrylic", "acrylic", "Acrylic box, UV print", "Diffuser face, LED", "with", "acrylic", 818, 0, { thick: true }),
  P("neon-std", "neon", "neon", "LED neon flex, standard", "On 3mm acrylic backing", "with", "neon", 306),
  P("neon-rgb", "neon", "neon", "LED neon flex, RGB", "On 3mm acrylic backing", "with", "neon", 556),
  P("stk-print", "sticker", "sticker", "Sticker print + laminate", "Wall, glass, flat", "without", "flat", 60),
  P("stk-cut", "sticker", "sticker", "Plotter-cut vinyl", "No print", "without", "flat", 70),
  P("stk-frost", "sticker", "sticker", "Frosted / one-way / perforated", "Glass frontage", "without", "flat", 90),
  P("lb-acrylic", "lightbox", "roundbox", "Round box, acrylic build", "Acrylic body, lit face", "with", "flat", 1100, 1500),
  P("lb-builtup", "lightbox", "roundbox", "Round box, built-up", "Metal returns, lit face", "with", "flat", 1200, 1650),
];

export interface SheetPrices { thinPiece: number; thinFull: number; thickFull: number }
export interface PresetSettings {
  rates: Record<string, { rate: number; rateDouble: number }>;
  markup: Record<string, number>;
  minimum: Record<string, number>;
  sheets: SheetPrices;
  neonColorAddonPct: number;
  mobilSmall: number; mobilLarge: number; mobilThresholdSqft: number;
}
const MIN: Record<Family, number> = { flex: 2500, apc: 2000, acrylic: 1500, metal: 2000, neon: 3500, sticker: 500, roundbox: 3500 };
export const DEFAULT_PRESET_SETTINGS: PresetSettings = {
  rates: Object.fromEntries(PRESETS.map((p) => [p.id, { rate: p.rate, rateDouble: p.rateDouble }])),
  markup: Object.fromEntries(FAMILIES.map(([f]) => [f, 40])),
  minimum: MIN,
  sheets: { thinPiece: 1000, thinFull: 2800, thickFull: 4500 },
  neonColorAddonPct: 25,
  mobilSmall: 500, mobilLarge: 1000, mobilThresholdSqft: 30,
};
const n = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const o = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
export function mergePresetSettings(raw: unknown): PresetSettings {
  const r = o(raw), d = DEFAULT_PRESET_SETTINGS, rr = o(r.rates), mk = o(r.markup), mn = o(r.minimum), sh = o(r.sheets);
  return {
    rates: Object.fromEntries(PRESETS.map((p) => { const x = o(rr[p.id]); return [p.id, { rate: n(x.rate, d.rates[p.id].rate), rateDouble: n(x.rateDouble, d.rates[p.id].rateDouble) }]; })),
    markup: Object.fromEntries(FAMILIES.map(([f]) => [f, n(mk[f], d.markup[f])])),
    minimum: Object.fromEntries(FAMILIES.map(([f]) => [f, n(mn[f], d.minimum[f])])),
    sheets: { thinPiece: n(sh.thinPiece, d.sheets.thinPiece), thinFull: n(sh.thinFull, d.sheets.thinFull), thickFull: n(sh.thickFull, d.sheets.thickFull) },
    neonColorAddonPct: n(r.neonColorAddonPct, d.neonColorAddonPct),
    mobilSmall: n(r.mobilSmall, d.mobilSmall), mobilLarge: n(r.mobilLarge, d.mobilLarge), mobilThresholdSqft: n(r.mobilThresholdSqft, d.mobilThresholdSqft),
  };
}

export const presetsFor = (service: string) => PRESETS.filter((p) => p.service === service);
export function presetFor(service: string, o2: { lit: boolean; lbBuild: string; presetId: string }): Preset | undefined {
  if (service === "lightbox") return PRESETS.find((p) => p.id === `lb-${o2.lbBuild}`);
  if (service === "panaflex") return PRESETS.find((p) => p.id === (o2.lit ? "pf-lit" : "pf-nonlit"));
  const list = presetsFor(service);
  return list.find((p) => p.id === o2.presetId) ?? list[0];
}

/** Acrylic material by purchased piece: 4x2 ft blocks (8 sqft). Thin (≤3mm) is capped at the whole-sheet price. */
export function acrylicMaterial(area: number, waste: number, thick: boolean, s: SheetPrices, leftoverLost: boolean) {
  const blocks = Math.max(1, Math.ceil((area * waste) / 8));
  const sheets = Math.ceil(blocks / 4);
  if (thick) return leftoverLost ? sheets * s.thickFull : blocks * (s.thickFull / 4);
  return Math.min(blocks * s.thinPiece, sheets * s.thinFull);
}

export function priceSign(p: Preset, ps: PresetSettings, area: number, double: boolean, x: { colors: number; psu: number; leftoverLost: boolean }) {
  const r = ps.rates[p.id] ?? { rate: p.rate, rateDouble: p.rateDouble };
  const rate = double ? (r.rateDouble > 0 ? r.rateDouble : r.rate * 2) : r.rate;
  let fab = rate * area;
  if (p.kind === "neon" && x.colors > 2) fab *= 1 + ps.neonColorAddonPct / 100;
  const material = p.kind === "flat" ? 0 : acrylicMaterial(area, p.waste ?? 1, p.kind === "acrylic" && !!p.thick, ps.sheets, x.leftoverLost);
  const cost = fab + material;
  const sell = cost * (1 + (ps.markup[p.family] ?? 40) / 100);
  const unit = Math.max(ps.minimum[p.family] || 0, sell) + (x.psu || 0);
  return { unit, fab, material, markup: unit - fab - material, tbd: rate <= 0 };
}
