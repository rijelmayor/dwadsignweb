/**
 * SIGN CONFIGURATOR CATALOG
 * -------------------------
 * Products here are BUILT from components. Each sign type is a set of
 * build-up layers (frame, face, lighting, mounting...) and every layer
 * has material options with a raw price per unit.
 *
 * Units:
 *   "sqft" : face area  (width ft × height ft)          e.g. panaflex face
 *   "lm"   : perimeter  (2 × (width + height), in ft)   e.g. metal frame
 *   "pcs"  : flat per sign                              e.g. LED power supply
 *
 * When your raw prices are ready, fill in `pricePerUnit` (0 = "price TBD").
 * The configurator at /quote reads only this file — update, push, done.
 */

export type UnitSystem = "sqft" | "lm" | "pcs";

export interface MaterialOption {
  id: string;
  name: string;
  /** Raw cost per unit (before markup). 0 = placeholder, fill in later. */
  pricePerUnit: number;
  unit: UnitSystem;
}

export interface BuildComponent {
  id: string;
  name: string;
  options: MaterialOption[];
}

export type PreviewKind = "panaflex" | "lightbox" | "acrylic" | "neon";

export interface SignType {
  id: string;
  name: string;
  desc: string;
  preview: PreviewKind;
  components: BuildComponent[];
}

export const SIGN_TYPES: SignType[] = [
  {
    id: "panaflex",
    name: "Panaflex Sign",
    desc: "Printed panaflex face on a welded metal frame. The workhorse of storefront signage.",
    preview: "panaflex",
    components: [
      {
        id: "frame",
        name: "Frame (Metal)",
        options: [
          { id: "angle-1x1", name: "1×1 angle bar, welded + primer", pricePerUnit: 0, unit: "lm" },
          { id: "angle-1x2", name: "1×2 angle bar, welded + primer", pricePerUnit: 0, unit: "lm" },
          { id: "stud-metal", name: "Metal stud frame", pricePerUnit: 0, unit: "lm" },
        ],
      },
      {
        id: "face",
        name: "Face (Panaflex)",
        options: [
          { id: "pf-13oz", name: "Panaflex 13oz, printed", pricePerUnit: 0, unit: "sqft" },
          { id: "pf-15oz", name: "Panaflex 15oz, printed", pricePerUnit: 0, unit: "sqft" },
          { id: "pf-backlit", name: "Panaflex backlit film", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "lighting",
        name: "Lighting",
        options: [
          { id: "none", name: "No lighting (daytime only)", pricePerUnit: 0, unit: "pcs" },
          { id: "led-exposed", name: "Exposed LED modules (edge)", pricePerUnit: 0, unit: "sqft" },
          { id: "led-internal", name: "Internal LED backlight", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "mounting",
        name: "Mounting",
        options: [
          { id: "wall", name: "Wall-mounted (included)", pricePerUnit: 0, unit: "pcs" },
          { id: "pole", name: "Pole / freestanding", pricePerUnit: 0, unit: "pcs" },
          { id: "rooftop", name: "Rooftop with steel support", pricePerUnit: 0, unit: "pcs" },
        ],
      },
      {
        id: "finish",
        name: "Frame Finish",
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
        id: "frame",
        name: "Cabinet (Metal)",
        options: [
          { id: "cab-alu", name: "Aluminum cabinet, folded", pricePerUnit: 0, unit: "lm" },
          { id: "cab-gi", name: "GI sheet cabinet, welded", pricePerUnit: 0, unit: "lm" },
        ],
      },
      {
        id: "face",
        name: "Face",
        options: [
          { id: "face-acrylic", name: "Acrylic face, UV print", pricePerUnit: 0, unit: "sqft" },
          { id: "face-flex", name: "Backlit flex face", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "lighting",
        name: "Lighting",
        options: [
          { id: "led-std", name: "LED modules, warm white", pricePerUnit: 0, unit: "sqft" },
          { id: "led-rgb", name: "LED modules, RGB programmable", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "mounting",
        name: "Mounting",
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
        id: "face",
        name: "Letter Build",
        options: [
          { id: "acm-3mm", name: "3mm acrylic, flat-cut", pricePerUnit: 0, unit: "sqft" },
          { id: "acm-5mm", name: "5mm acrylic, flat-cut", pricePerUnit: 0, unit: "sqft" },
          { id: "acm-built", name: "Built-up acrylic (returns)", pricePerUnit: 0, unit: "sqft" },
          { id: "ss-brushed", name: "Brushed stainless 1.2mm", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "lighting",
        name: "Lighting",
        options: [
          { id: "none", name: "Non-lit", pricePerUnit: 0, unit: "pcs" },
          { id: "halo", name: "LED halo / backlit", pricePerUnit: 0, unit: "sqft" },
          { id: "frontlit", name: "LED face-lit", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "mounting",
        name: "Mounting",
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
    desc: "Custom-shaped LED neon on clear acrylic backing. Quote by overall sign area.",
    preview: "neon",
    components: [
      {
        id: "neon",
        name: "Neon Flex",
        options: [
          { id: "neon-std", name: "Standard LED neon flex", pricePerUnit: 0, unit: "sqft" },
          { id: "neon-rgb", name: "RGB addressable neon flex", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "backing",
        name: "Backing",
        options: [
          { id: "back-clear", name: "Clear acrylic backing", pricePerUnit: 0, unit: "sqft" },
          { id: "back-black", name: "Black acrylic backing", pricePerUnit: 0, unit: "sqft" },
        ],
      },
      {
        id: "mounting",
        name: "Mounting",
        options: [
          { id: "wall", name: "Wall-mounted (included)", pricePerUnit: 0, unit: "pcs" },
          { id: "hanging", name: "Hanging with cables", pricePerUnit: 0, unit: "pcs" },
        ],
      },
    ],
  },
];

export const DEFAULT_MARKUP_PCT = 40;

export function findSignType(id: string) {
  return SIGN_TYPES.find((s) => s.id === id);
}

export function findOption(signTypeId: string, componentId: string, optionId: string) {
  const st = findSignType(signTypeId);
  const comp = st?.components.find((c) => c.id === componentId);
  return { component: comp, option: comp?.options.find((o) => o.id === optionId) };
}
