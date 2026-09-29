export type UnitSystem = "sqft" | "lm" | "pcs";
export type PreviewKind = "panaflex" | "lightbox" | "acrylic" | "neon";
export type ComponentRole = "frame" | "face" | "lighting" | "mounting" | "finish" | "printing" | "other";

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
    desc: "Start with the sign dimensions, choose the face build, lighting and printing. Frame construction is handled internally by the pricing settings.",
    preview: "panaflex",
    components: [
      {
        id: "frame", name: "Internal construction", role: "frame",
        options: [{ id: "standard", name: "Standard internal construction", pricePerUnit: 0, unit: "sqft" }],
      },
      {
        id: "face", name: "Face", role: "face",
        options: [
          { id: "panaflex", name: "Panaflex", pricePerUnit: 0, unit: "sqft" },
          { id: "tarp", name: "Tarp", pricePerUnit: 0, unit: "sqft" },
          { id: "apc", name: "APC", pricePerUnit: 0, unit: "sqft" },
          { id: "acrylic", name: "Acrylic", pricePerUnit: 0, unit: "sqft" },
          { id: "metal", name: "Metal Sheet", pricePerUnit: 0, unit: "sqft" },
          { id: "custom", name: "Custom Build Face", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "lighting", name: "Lighting", role: "lighting",
        options: [
          { id: "without", name: "Without Light", pricePerUnit: 0, unit: "sqft" },
          { id: "with", name: "With Light", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "printing", name: "Printing", role: "printing",
        options: [
          { id: "sticker", name: "Sticker print", pricePerUnit: 0, unit: "sqft" },
          { id: "direct", name: "Direct print to materials", pricePerUnit: 0, unit: "sqft" },
          { id: "uv", name: "UV print", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "mounting", name: "Mounting", role: "mounting",
        options: [
          { id: "wall", name: "Wall-mounted", pricePerUnit: 0, unit: "pcs" },
          { id: "pole", name: "Pole / freestanding", pricePerUnit: 0, unit: "pcs" },
          { id: "rooftop", name: "Rooftop with steel support", pricePerUnit: 0, unit: "pcs" },
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
      { id: "frame", name: "Cabinet (Metal)", role: "frame", options: [{ id: "cab-alu", name: "Aluminum cabinet, folded", pricePerUnit: 0, unit: "lm" }] },
      { id: "face", name: "Face", role: "face", options: [{ id: "face-acrylic", name: "Acrylic face, UV print", pricePerUnit: 0, unit: "sqft" }, { id: "face-flex", name: "Backlit flex face", pricePerUnit: 0, unit: "sqft" }] },
      { id: "lighting", name: "Lighting", role: "lighting", options: [{ id: "led-std", name: "LED modules, warm white", pricePerUnit: 0, unit: "sqft" }, { id: "led-rgb", name: "LED modules, RGB programmable", pricePerUnit: 0, unit: "sqft" }] },
      { id: "mounting", name: "Mounting", role: "mounting", options: [{ id: "wall", name: "Wall-mounted", pricePerUnit: 0, unit: "pcs" }, { id: "pole", name: "Pole / freestanding", pricePerUnit: 0, unit: "pcs" }] },
    ],
  },
  {
    id: "acrylic-3d",
    name: "3D Acrylic Letters",
    desc: "Flat-cut or built-up acrylic letters mounted direct to wall or on raceway.",
    preview: "acrylic",
    components: [
      { id: "face", name: "Letter Build", role: "face", options: [{ id: "acm-3mm", name: "3mm acrylic, flat-cut", pricePerUnit: 0, unit: "sqft" }, { id: "acm-5mm", name: "5mm acrylic, flat-cut", pricePerUnit: 0, unit: "sqft" }, { id: "acm-built", name: "Built-up acrylic (returns)", pricePerUnit: 0, unit: "sqft" }, { id: "ss-brushed", name: "Brushed stainless 1.2mm", pricePerUnit: 0, unit: "sqft" }] },
      { id: "lighting", name: "Lighting", role: "lighting", options: [{ id: "none", name: "Non-lit", pricePerUnit: 0, unit: "pcs" }, { id: "halo", name: "LED halo / backlit", pricePerUnit: 0, unit: "sqft" }, { id: "frontlit", name: "LED face-lit", pricePerUnit: 0, unit: "sqft" }] },
      { id: "mounting", name: "Mounting", role: "mounting", options: [{ id: "direct", name: "Direct wall mount", pricePerUnit: 0, unit: "pcs" }, { id: "raceway", name: "Painted raceway", pricePerUnit: 0, unit: "lm" }] },
    ],
  },
  {
    id: "led-neon",
    name: "LED Neon Flex",
    desc: "Custom-shaped LED neon on acrylic backing. Quote by overall sign area.",
    preview: "neon",
    components: [
      { id: "neon", name: "Neon Flex", role: "face", options: [{ id: "neon-std", name: "Standard LED neon flex", pricePerUnit: 0, unit: "sqft" }, { id: "neon-rgb", name: "RGB addressable neon flex", pricePerUnit: 0, unit: "sqft" }] },
      { id: "backing", name: "Backing", role: "other", options: [{ id: "back-clear", name: "Clear acrylic backing", pricePerUnit: 0, unit: "sqft" }, { id: "back-black", name: "Black acrylic backing", pricePerUnit: 0, unit: "sqft" }] },
      { id: "mounting", name: "Mounting", role: "mounting", options: [{ id: "wall", name: "Wall-mounted", pricePerUnit: 0, unit: "pcs" }, { id: "hanging", name: "Hanging with cables", pricePerUnit: 0, unit: "pcs" }] },
    ],
  },
];

export const PREVIEW_KINDS: { value: PreviewKind; label: string }[] = [
  { value: "panaflex", label: "Panaflex" },
  { value: "lightbox", label: "Lightbox" },
  { value: "acrylic", label: "3D letters" },
  { value: "neon", label: "LED neon" },
];

export const COMPONENT_ROLES: { value: ComponentRole; label: string }[] = [
  { value: "frame", label: "Internal construction" },
  { value: "face", label: "Face / letters / neon" },
  { value: "lighting", label: "Lighting" },
  { value: "printing", label: "Printing" },
  { value: "mounting", label: "Mounting" },
  { value: "finish", label: "Internal finish" },
  { value: "other", label: "Other" },
];

export function mergeCatalog(raw: unknown): SignType[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SIGN_TYPES;
  const ok = raw.every((s) => s && typeof s.id === "string" && typeof s.name === "string" && Array.isArray(s.components) && s.components.every((c: BuildComponent) => c && Array.isArray(c.options) && c.options.length > 0));
  if (!ok) return DEFAULT_SIGN_TYPES;

  // Keep existing custom catalog entries, but always upgrade the Panaflex definition
  // when an older Supabase catalog does not yet have the new printing workflow.
  const incoming = raw as SignType[];
  const upgraded = incoming.map((s) => {
    if (s.id !== "panaflex") return s;
    const defaults = DEFAULT_SIGN_TYPES.find((d) => d.id === "panaflex")!;
    const hasPrinting = s.components.some((c) => c.id === "printing" || c.role === "printing");
    const face = s.components.find((c) => c.id === "face");
    const requiredFaces = defaults.components.find((c) => c.id === "face")!.options.map((o) => o.id);
    const hasRequiredFaces = requiredFaces.every((id) => face?.options.some((o) => o.id === id));
    if (hasPrinting && hasRequiredFaces) return s;
    return {
      ...defaults,
      ...s,
      desc: defaults.desc,
      components: defaults.components.map((dc) => {
        const existing = s.components.find((sc) => sc.id === dc.id);
        if (dc.id === "face" && !hasRequiredFaces) return dc;
        if (dc.id === "printing" && !hasPrinting) return dc;
        return existing ?? dc;
      }),
    };
  });
  return upgraded;
}

export function roleOf(c: BuildComponent): ComponentRole {
  if (c.role) return c.role;
  return (["frame", "face", "lighting", "mounting", "finish", "printing"] as const).find((r) => r === c.id) ?? "other";
}

export const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || Math.random().toString(36).slice(2, 7);
