export type UnitSystem = "sqft" | "lm" | "pcs";
export type PreviewKind = "panaflex" | "lightbox" | "acrylic" | "neon";
export type ComponentRole = "frame" | "face" | "lighting" | "mounting" | "finish" | "other";

export interface MaterialOption {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: UnitSystem;
}

export interface BuildComponent {
  id: string;
  name: string;
  role?: ComponentRole;
  options: MaterialOption[];
}

export interface SignType {
  id: string;
  name: string;
  desc: string;
  preview: PreviewKind;
  components: BuildComponent[];
}

export const DEFAULT_SIGN_TYPES: SignType[] = [
  {
    id: "panaflex",
    name: "Panaflex Sign",
    desc: "Printed panaflex face on a welded metal frame. The workhorse of storefront signage.",
    preview: "panaflex",
    components: [
      {
        id: "frame", name: "Frame (Metal)", role: "frame",
        options: [
          { id: "angle-1x1", name: "1×1 angle bar, welded + primer", pricePerUnit: 0, unit: "lm" },
          { id: "angle-1x2", name: "1×2 angle bar, welded + primer", pricePerUnit: 0, unit: "lm" },
          { id: "stud-metal", name: "Metal stud frame", pricePerUnit: 0, unit: "lm" },
        ],
      },
      {
        id: "face", name: "Face (Panaflex)", role: "face",
        options: [
          { id: "pf-13oz", name: "Panaflex 13oz, printed", pricePerUnit: 0, unit: "sqft" },
          { id: "pf-15oz", name: "Panaflex 15oz, printed", pricePerUnit: 0, unit: "sqft" },
          { id: "pf-backlit", name: "Panaflex backlit film", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "lighting", name: "Lighting", role: "lighting",
        options: [
          { id: "none", name: "No lighting (daytime only)", pricePerUnit: 0, unit: "pcs" },
          { id: "led-exposed", name: "Exposed LED modules (edge)", pricePerUnit: 0, unit: "sqft" },
          { id: "led-internal", name: "Internal LED backlight", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "mounting", name: "Mounting", role: "mounting",
        options: [
          { id: "wall", name: "Wall-mounted (included)", pricePerUnit: 0, unit: "pcs" },
          { id: "pole", name: "Pole / freestanding", pricePerUnit: 0, unit: "pcs" },
          { id: "rooftop", name: "Rooftop with steel support", pricePerUnit: 0, unit: "pcs" },
        ],
      },
      {
        id: "finish", name: "Frame Finish", role: "finish",
        options: [
          { id: "primer", name: "Primer + enamel paint", pricePerUnit: 0, unit: "lm" },
          { id: "powder", name: "Powder-coated color", pricePerUnit: 0, unit: "lm" },
        ],
      },
    ],
  },
  {
    id: "lightbox",
    name: "LED Lightbox",
    desc: "Illuminated sign with even LED diffusion — visible day and night.",
    preview: "lightbox",
    components: [
      {
        id: "frame", name: "Cabinet (Metal)", role: "frame",
        options: [
          { id: "cab-alu", name: "Aluminum cabinet, folded", pricePerUnit: 0, unit: "lm" },
          { id: "cab-gi", name: "GI sheet cabinet, welded", pricePerUnit: 0, unit: "lm" },
        ],
      },
      {
        id: "face", name: "Face", role: "face",
        options: [
          { id: "face-acrylic", name: "Acrylic face, UV print", pricePerUnit: 0, unit: "sqft" },
          { id: "face-flex", name: "Backlit flex face", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "lighting", name: "Lighting", role: "lighting",
        options: [
          { id: "led-std", name: "LED modules, warm white", pricePerUnit: 0, unit: "sqft" },
          { id: "led-rgb", name: "LED modules, RGB programmable", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "mounting", name: "Mounting", role: "mounting",
        options: [
          { id: "wall", name: "Wall-mounted (included)", pricePerUnit: 0, unit: "pcs" },
          { id: "pole", name: "Pole / freestanding", pricePerUnit: 0, unit: "pcs" },
        ],
      },
    ],
  },
  {
    id: "acrylic-3d",
    name: "3D Acrylic Letters",
    desc: "Flat-cut or built-up acrylic letters mounted direct to wall or on raceway.",
    preview: "acrylic",
    components: [
      {
        id: "face", name: "Letter Build", role: "face",
        options: [
          { id: "acm-3mm", name: "3mm acrylic, flat-cut", pricePerUnit: 0, unit: "sqft" },
          { id: "acm-5mm", name: "5mm acrylic, flat-cut", pricePerUnit: 0, unit: "sqft" },
          { id: "acm-built", name: "Built-up acrylic (returns)", pricePerUnit: 0, unit: "sqft" },
          { id: "ss-brushed", name: "Brushed stainless 1.2mm", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "lighting", name: "Lighting", role: "lighting",
        options: [
          { id: "none", name: "Non-lit", pricePerUnit: 0, unit: "pcs" },
          { id: "halo", name: "LED halo / backlit", pricePerUnit: 0, unit: "sqft" },
          { id: "frontlit", name: "LED face-lit", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "mounting", name: "Mounting", role: "mounting",
        options: [
          { id: "direct", name: "Direct wall mount", pricePerUnit: 0, unit: "pcs" },
          { id: "raceway", name: "Painted raceway", pricePerUnit: 0, unit: "lm" },
        ],
      },
    ],
  },
  {
    id: "led-neon",
    name: "LED Neon Flex",
    desc: "Custom-shaped LED neon on acrylic backing. Quote by overall sign area.",
    preview: "neon",
    components: [
      {
        id: "neon", name: "Neon Flex", role: "face",
        options: [
          { id: "neon-std", name: "Standard LED neon flex", pricePerUnit: 0, unit: "sqft" },
          { id: "neon-rgb", name: "RGB addressable neon flex", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "backing", name: "Backing", role: "other",
        options: [
          { id: "back-clear", name: "Clear acrylic backing", pricePerUnit: 0, unit: "sqft" },
          { id: "back-black", name: "Black acrylic backing", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "mounting", name: "Mounting", role: "mounting",
        options: [
          { id: "wall", name: "Wall-mounted (included)", pricePerUnit: 0, unit: "pcs" },
          { id: "hanging", name: "Hanging with cables", pricePerUnit: 0, unit: "pcs" },
        ],
      },
    ],
  },
];

export const PREVIEW_KINDS: { value: PreviewKind; label: string }[] = [
  { value: "panaflex", label: "Panaflex (frame + printed face)" },
  { value: "lightbox", label: "Lightbox (cabinet + lit face)" },
  { value: "acrylic", label: "3D letters" },
  { value: "neon", label: "LED neon" },
];

export const COMPONENT_ROLES: { value: ComponentRole; label: string }[] = [
  { value: "frame", label: "Frame / cabinet" },
  { value: "face", label: "Face / letters / neon" },
  { value: "lighting", label: "Lighting" },
  { value: "mounting", label: "Mounting" },
  { value: "finish", label: "Frame finish" },
  { value: "other", label: "No 3D effect" },
];

export function mergeCatalog(raw: unknown): SignType[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SIGN_TYPES;
  const ok = raw.every(
    (s) =>
      s && typeof s.id === "string" && typeof s.name === "string" && Array.isArray(s.components) &&
      s.components.every((c: BuildComponent) => c && Array.isArray(c.options) && c.options.length > 0),
  );
  return ok ? (raw as SignType[]) : DEFAULT_SIGN_TYPES;
}

export function roleOf(c: BuildComponent): ComponentRole {
  if (c.role) return c.role;
  return (["frame", "face", "lighting", "mounting", "finish"] as const).find((r) => r === c.id) ?? "other";
}

export const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || Math.random().toString(36).slice(2, 7);
