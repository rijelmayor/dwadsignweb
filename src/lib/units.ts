/** Length units the Quote Builder accepts. Everything is stored in feet (sizes) or inches (depth)
 *  and pricing always runs on square feet, so any unit typed here gives the same sqft calculation. */
export type LenUnit = "ft" | "in" | "cm" | "mm";

export const LEN_UNITS: { id: LenUnit; label: string }[] = [
  { id: "ft", label: "ft" },
  { id: "in", label: "inch" },
  { id: "cm", label: "cm" },
  { id: "mm", label: "mm" },
];

const FT_PER: Record<LenUnit, number> = { ft: 1, in: 1 / 12, cm: 1 / 30.48, mm: 1 / 304.8 };

export const toFt = (v: number, u: LenUnit) => v * FT_PER[u];
export const fromFt = (ft: number, u: LenUnit) => ft / FT_PER[u];
export const toIn = (v: number, u: LenUnit) => toFt(v, u) * 12;
export const fromIn = (inch: number, u: LenUnit) => fromFt(inch / 12, u);

/** Trim to 2 decimals without trailing zeros: 4 → "4", 1219.2 → "1219.2" */
export const trimNum = (n: number, dp = 2) => {
  const k = 10 ** dp;
  return String(Math.round(n * k) / k);
};

/** Label for dimension lines and sheets in the unit the sales person typed. */
export function fmtLen(ft: number, u: LenUnit = "ft"): string {
  switch (u) {
    case "in": return `${trimNum(ft * 12)}"`;
    case "cm": return `${trimNum(ft * 30.48, 1)} cm`;
    case "mm": return `${Math.round(ft * 304.8)} mm`;
    default: return `${trimNum(ft)}'`;
  }
}

/** Always shows feet and the typed unit together when they differ, e.g. `48" (4 ft)`. */
export function fmtLenBoth(ft: number, u: LenUnit): string {
  return u === "ft" ? `${trimNum(ft)} ft` : `${fmtLen(ft, u)} (${trimNum(ft)} ft)`;
}
