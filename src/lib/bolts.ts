/** Acrylic panel mounted on advertising bolts (standoffs), e.g. the CDM Group logo plaque. */
export type BoltFinish = "chrome" | "steel" | "gold" | "black";
export type PanelTint = "clear" | "frosted" | "white" | "black";

export interface BoltSpec {
  panelMm: number;
  standoffMm: number;
  /** 2 = round/small plaques; 4 = corners; 6 = corners + mid sides */
  count: 2 | 4 | 6;
  finish: BoltFinish;
  tint: PanelTint;
  /** bolt cap diameter */
  diaMm: number;
}

export const BOLT_FINISHES: { id: BoltFinish; label: string; color: string; metalness: number; roughness: number }[] = [
  { id: "chrome", label: "Chrome", color: "#dfe5ea", metalness: 0.55, roughness: 0.18 },
  { id: "steel", label: "Brushed steel", color: "#a9b2ba", metalness: 0.5, roughness: 0.4 },
  { id: "gold", label: "Gold", color: "#d4af37", metalness: 0.6, roughness: 0.28 },
  { id: "black", label: "Black", color: "#1b1b1b", metalness: 0.3, roughness: 0.45 },
];

export const PANEL_TINTS: { id: PanelTint; label: string; color: string; opacity: number; edge: string; ink: string; outline: string }[] = [
  { id: "clear", label: "Clear", color: "#cfeaf4", opacity: 0.34, edge: "#5fa8c2", ink: "#1f2933", outline: "#ffffff" },
  { id: "frosted", label: "Frosted", color: "#eef4f7", opacity: 0.78, edge: "#9bb6c2", ink: "#1f2933", outline: "#ffffff" },
  { id: "white", label: "White", color: "#ffffff", opacity: 1, edge: "#c8d0d6", ink: "#1f2933", outline: "#ffffff" },
  { id: "black", label: "Black", color: "#141414", opacity: 1, edge: "#555555", ink: "#f5f5f5", outline: "#000000" },
];

export const STANDOFF_OPTIONS_MM = [19, 25, 38, 50];

/** Presets that are flat acrylic panels held off the wall by advertising bolts. */
export const BOLT_PRESET_IDS = ["ac-3mm", "ac-5mm", "ac-5mm-uv"];
