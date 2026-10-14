"use client";
import { presetFor, presetsFor, priceSign } from "@/lib/presets";
import { LETTER_FONTS, layoutText, useLetterFont } from "@/lib/letters";
import type { LettersSpec } from "@/components/LettersMesh";
import UnitField from "@/components/UnitField";
import { fmtLen, fromFt, fromIn, toFt, toIn, trimNum, type LenUnit } from "@/lib/units";
import { BOLT_FINISHES, BOLT_PRESET_IDS, PANEL_TINTS, STANDOFF_OPTIONS_MM, type BoltFinish, type BoltSpec, type PanelTint } from "@/lib/bolts";

const NEON_PALETTE = ["#ff4fd8", "#4fd8ff", "#ffe14f", "#7dff4f", "#ff7a4f", "#b388ff"];
const LETTER_IDS = ["ac-letters-flat", "ac-letters", "ac-letters-lit"];

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_QUOTE_SETTINGS, mergeQuoteSettings, type QuoteSettings } from "@/lib/settings";
import type { Traits } from "@/lib/traits";
import { site } from "@/lib/site";
import type { SignSceneHandle } from "@/components/SignScene";

const SignScene = dynamic(() => import("@/components/SignScene"), { ssr: false });

type Shape = "rect" | "circle";
type ServiceId = "panaflex" | "lightbox" | "acrylic" | "neon" | "apc" | "tarp" | "sticker" | "metal" | "custom";
type LbBuild = "builtup" | "acrylic";
type Mount = "wall" | "bracket" | "hanging" | "pole" | "pole_single" | "rooftop";
type Sides = "single" | "double";

const BOX_COLORS: { id: string; label: string; hex: string }[] = [
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "black", label: "Black", hex: "#1a1a1a" },
  { id: "silver", label: "Silver", hex: "#c5ccd3" },
  { id: "charcoal", label: "Charcoal", hex: "#3d4450" },
  { id: "gold", label: "Gold", hex: "#c9a227" },
  { id: "navy", label: "Navy", hex: "#0b1f3a" },
  { id: "red", label: "Red", hex: "#b91c1c" },
  { id: "teal", label: "Teal", hex: "#0d9488" },
  { id: "blue", label: "Blue", hex: "#1d4ed8" },
  { id: "green", label: "Green", hex: "#15803d" },
  { id: "orange", label: "Orange", hex: "#ea580c" },
  { id: "yellow", label: "Yellow", hex: "#facc15" },
];
const colorName = (hex: string) => BOX_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.label || hex.toUpperCase();

/** Swatches + a custom colour picker. */
function ColorRow({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-wider uppercase text-fog mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-fog mb-2">{hint}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {BOX_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.label}
            onClick={() => onChange(c.hex)}
            className={`w-9 h-9 rounded-full border-2 transition ${value.toLowerCase() === c.hex.toLowerCase() ? "border-gold ring-2 ring-gold/40 scale-110" : "border-white/30 hover:border-white/60"}`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
        <label title="Custom color" className="relative w-9 h-9 rounded-full border-2 border-dashed border-white/40 hover:border-white/70 overflow-hidden cursor-pointer flex items-center justify-center text-sm text-fog">
          +
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      </div>
      <p className="text-[10px] text-fog mt-1">{colorName(value)}</p>
    </div>
  );
}

interface LineItem {
  id: string;
  serviceId: ServiceId;
  signName: string;
  shape: Shape;
  width: number;
  height: number;
  /** circle only */
  diameter: number;
  thicknessIn: number;
  /** Units the sales person typed the size / depth in (price always runs on sqft) */
  unit?: LenUnit;
  depthUnit?: LenUnit;
  areaSqft: number;
  qty: number;
  face: string;
  lighting: string;
  printing: string;
  mounting: string;
  note: string;
  unitCost: number;
  breakdown: { construction: number; face: number; lighting: number; printing: number; markup: number };
  hasTbd: boolean;
  /** The 3 renders (all with dimension lines) */
  renders: { front: string | null; side: string | null; iso: string | null };
  logoUrl?: string;
}

interface ClientInfo { name: string; company: string; email: string; phone: string; project: string }

interface DraftRow {
  id: string;
  quote_no: string;
  draftName: string;
  created_at: string;
  grand: number;
  itemCount: number;
  source: "supabase";
  raw?: { client?: ClientInfo; lines?: LineItem[]; totals?: Record<string, unknown> };
}

const LOCAL_DRAFTS_KEY = "dw_quote_drafts_v1";
/** IDs the user deleted on this device — hide even if server delete fails */
const DELETED_DRAFTS_KEY = "dw_quote_drafts_deleted_v1";

const LB_MAX_FT = 2;

interface ServiceDef {
  id: ServiceId;
  name: string;
  sub: string;
  /** default thickness (inches) applied when the service is picked */
  thicknessIn: number;
  /** lighting selected by default when the service is picked (always changeable) */
  defaultLight: "with" | "without";
  /** whether the Printing option applies to this service */
  printing: boolean;
  /** max diameter (ft) when the shape is a circle */
  circleMaxFt?: number;
}

/** Service / material type. Add a new service here (+ a rate in Builder Settings) to extend the builder. */
const SERVICES: ServiceDef[] = [
  { id: "panaflex", name: "Panaflex", sub: "Printed flex face", thicknessIn: 2, defaultLight: "without", printing: true },
  { id: "lightbox", name: "Lightbox", sub: `Lit box · circle max ${LB_MAX_FT} ft`, thicknessIn: 4, defaultLight: "with", printing: true, circleMaxFt: LB_MAX_FT },
  { id: "acrylic", name: "Acrylic", sub: "Acrylic panel face", thicknessIn: 1, defaultLight: "without", printing: true },
  { id: "neon", name: "Neon LED", sub: "LED neon on backing", thicknessIn: 1.5, defaultLight: "with", printing: true },
  { id: "apc", name: "APC", sub: "Aluminum composite panel", thicknessIn: 2, defaultLight: "without", printing: true },
  { id: "tarp", name: "Tarp", sub: "Tarpaulin on frame", thicknessIn: 2, defaultLight: "without", printing: true },
  { id: "sticker", name: "Sticker", sub: "Flat adhesive sticker", thicknessIn: 0.25, defaultLight: "without", printing: true },
  { id: "metal", name: "Metal Sheet", sub: "Metal sheet face", thicknessIn: 2, defaultLight: "without", printing: true },
  { id: "custom", name: "Custom", sub: "Describe your own material", thicknessIn: 2, defaultLight: "without", printing: true },
];
const LB_BUILDS: [LbBuild, string, string][] = [
  ["builtup", "Built-up", "Metal returns, lit face"],
  ["acrylic", "Acrylic build", "Acrylic body, lit face"],
];
const SIDES_OPTIONS: [Sides, string, string][] = [
  ["single", "Single face", "Artwork on the front only"],
  ["double", "Double face", "Artwork on both sides (face + printing × 2)"],
];
const MOUNTING_LABELS: Record<string, string> = {
  wall: "Flush on wall",
  bracket: "Side arm / projecting",
  hanging: "Hanging from ceiling",
  pole: "Pole bracket",
  pole_single: "Single pole hanging",
  rooftop: "Rooftop legs (behind)",
};

/** Short sales-friendly descriptions for each mount */
const MOUNTING_HELP: Record<string, string> = {
  wall: "Sign sits flat against the wall — most common for storefront panels.",
  bracket: "Blade / side arm sticks out from the wall (great for circle or box signs over the sidewalk).",
  hanging: "Suspended from the ceiling or soffit with rods/cables (like hanging lightboxes).",
  pole: "Clamps onto an existing pole — pole itself not included in the quote.",
  pole_single: "One vertical pole with the sign hanging off the side (pylon / roadside style).",
  rooftop: "Steel legs behind the sign for roof or freestanding install.",
};

const LIGHTING_OPTIONS = [["without", "Without Light"], ["with", "With Light"]] as const;
const PRINTING_OPTIONS = [["direct", "Direct to materials"], ["sticker", "Sticker print"], ["cutout", "Sticker Cut Out"], ["uv", "UV Print"]] as const;

/** Mini side-view icons so the mounting choice is visual. */
function MountIcon({ id }: { id: Mount }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="56" height="44" viewBox="0 0 56 44" aria-hidden>
      {id === "wall" && (<><rect x="6" y="3" width="6" height="38" {...common} /><rect x="12" y="10" width="5" height="24" fill="currentColor" stroke="none" /></>)}
      {id === "bracket" && (
        <>
          {/* Wall + side arm + sign (projecting / blade) */}
          <rect x="4" y="3" width="5" height="38" {...common} />
          <path d="M9 16 H28" {...common} />
          <path d="M9 28 H28" {...common} />
          <rect x="28" y="10" width="18" height="24" rx="2" fill="currentColor" stroke="none" />
        </>
      )}
      {id === "hanging" && (
        <>
          {/* Ceiling + rods + hanging sign */}
          <path d="M6 6 H50" {...common} strokeWidth={3} />
          <path d="M18 6 V16 M38 6 V16" {...common} />
          <rect x="12" y="16" width="32" height="18" rx="2" fill="currentColor" stroke="none" />
        </>
      )}
      {id === "pole" && (
        <>
          <rect x="8" y="6" width="26" height="32" fill="currentColor" stroke="none" />
          <rect x="34" y="14" width="4" height="16" {...common} />
          <path d="M38 14 Q50 22 38 30" {...common} />
        </>
      )}
      {id === "pole_single" && (
        <>
          {/* Single pole + sign hanging off side */}
          <path d="M12 4 V40" {...common} strokeWidth={3} />
          <path d="M12 14 H28 M12 28 H28" {...common} />
          <rect x="28" y="10" width="20" height="24" rx="2" fill="currentColor" stroke="none" />
        </>
      )}
      {id === "rooftop" && (
        <>
          <path d="M4 41 H52" {...common} strokeWidth={3} />
          <path d="M22 41 V20 M22 41 L40 24" {...common} />
          <path d="M40 41 L22 24" {...common} />
          <rect x="14" y="5" width="28" height="12" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

const ft = (n: number) => `${Math.round(n * 100) / 100}`;
function fmt(n: number) { return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function today() { return new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }); }
function labelOf(options: readonly (readonly [string, string])[], id: string) { return options.find(([v]) => v === id)?.[1] ?? id; }

export default function QuoteBuilder() {
  const [qs, setQs] = useState<QuoteSettings>(DEFAULT_QUOTE_SETTINGS);
  const [shape, setShape] = useState<Shape>("rect");
  const [serviceId, setServiceId] = useState<ServiceId>("panaflex");
  const [sides, setSides] = useState<Sides>("single");
  const [customName, setCustomName] = useState("");
  const [lbBuild, setLbBuild] = useState<LbBuild>("builtup");
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(2);
  const [diameter, setDiameter] = useState(2);
  const [thicknessIn, setThicknessIn] = useState(2);
  const [qty, setQty] = useState(1);
  const [lighting, setLighting] = useState("without");
  const [printing, setPrinting] = useState("sticker");
  const [presetId, setPresetId] = useState("");
  const [letterText, setLetterText] = useState("BRAND");
  const [letterFont, setLetterFont] = useState("helvetiker");
  const [letterHeightIn, setLetterHeightIn] = useState(12);
  const [letterDepthIn, setLetterDepthIn] = useState(2);
  const [letterGlow, setLetterGlow] = useState<"halo" | "front">("halo");
  const [neonBacking, setNeonBacking] = useState<"clear" | "black">("clear");
  const [neonColors, setNeonColors] = useState(1);
  const [psu, setPsu] = useState(0);
  const [leftoverLost, setLeftoverLost] = useState(false);
  const [mobilization, setMobilization] = useState<number | null>(null);
  /** Quote-level delivery: normal, rush (+rushPct%) or shipping (rate typed in once the courier price is known) */
  const [deliveryType, setDeliveryType] = useState<"normal" | "rush" | "shipping">("normal");
  const [shippingFee, setShippingFee] = useState(0);
  const [mounting, setMounting] = useState<Mount>("wall");
  /** 1 = single arm, 2 = double arm (bracket / hanging / pole / pole_single) */
  const [armCount, setArmCount] = useState<1 | 2>(1);
  const [bodyColor, setBodyColor] = useState("#ffffff");
  const [returnColor, setReturnColor] = useState("#1a1a1a");
  const [note, setNote] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [client] = useState<ClientInfo>({ name: "", company: "", email: "", phone: "", project: "" });
  const [discount, setDiscount] = useState(0);
  const [preparedBy, setPreparedBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState("");
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);
  /** Draft filename the user chooses for later edit */
  const [draftName, setDraftName] = useState("");
  /** When set, Save updates this draft instead of creating a new one */
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  /** Site photo of the real location + where the sign will be placed */
  const [sitePhoto, setSitePhoto] = useState<string>("");
  const [placementType, setPlacementType] = useState<"storefront" | "wall" | "bracket" | "pole" | "rooftop" | "other">("wall");
  const [placementNote, setPlacementNote] = useState("");
  /** Position of 3D sign on site photo (percent 0–100) + stretch */
  const [pinPos, setPinPos] = useState({ x: 50, y: 45 });
  const [pinScale, setPinScale] = useState(28); // % of photo width
  const [pinStretchX, setPinStretchX] = useState(100); // horizontal stretch %
  const [pinStretchY, setPinStretchY] = useState(100); // vertical stretch %
  const [pinSkew, setPinSkew] = useState(0); // degrees — curve/perspective feel
  const [siteMockup, setSiteMockup] = useState<string>(""); // clear iso for overlay
  /** Wizard step 1–6 so Live 3D stays fully visible */
  const [buildStep, setBuildStep] = useState(1);
  /** Original logo before white-BG removal (so user can restore) */
  const [logoOriginal, setLogoOriginal] = useState("");
  const [logoBgCleared, setLogoBgCleared] = useState(false);
  /** Logo size on the face (% of panel W / H) — independent so client can stretch corner-to-corner */
  const [logoScaleW, setLogoScaleW] = useState(90);
  const [logoScaleH, setLogoScaleH] = useState(90);
  /** Draft strings so size fields can be cleared and typed freely */
  const [dimUnit, setDimUnit] = useState<LenUnit>("ft");
  const [depthUnit, setDepthUnit] = useState<LenUnit>("in");
  const [letterUnit, setLetterUnit] = useState<LenUnit>("in");
  /** Acrylic panel on advertising bolts */
  const [boltFinish, setBoltFinish] = useState<BoltFinish>("chrome");
  const [boltCount, setBoltCount] = useState<4 | 6>(4);
  const [panelTint, setPanelTint] = useState<PanelTint>("clear");
  const [standoffMm, setStandoffMm] = useState(25);
  const sceneRef = useRef<SignSceneHandle>(null);
  const quoteSheetRef = useRef<HTMLElement | null>(null);
  const sitePhotoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      setSupabaseOk(!!sb);
      if (!sb) return;
      const { data } = await sb.from("site_settings").select("key,value").in("key", ["quote"]);
      for (const row of data ?? []) {
        if (row.key === "quote") setQs(mergeQuoteSettings(row.value));
      }
    }
    load();
  }, []);

  const isCircle = shape === "circle";
  const def = SERVICES.find((x) => x.id === serviceId) ?? SERVICES[0];
  const isLightbox = serviceId === "lightbox";
  const lit = lighting === "with";
  const circleMax = isCircle ? def.circleMaxFt : undefined;
  const dimW = isCircle ? diameter : width;
  const dimH = isCircle ? diameter : height;
  const areaSqft = Math.max(0, isCircle ? Math.PI * (diameter / 2) ** 2 : width * height);
  const activeLogo = logoPreview || logoUrl || undefined;
  const lbBuildLabel = LB_BUILDS.find(([id]) => id === lbBuild)?.[1] ?? "";
  const sidesMult = sides === "double" ? 2 : 1;
  const sidesLabel = sides === "double" ? "Double face" : "Single face";
  const serviceName = serviceId === "custom" && customName.trim() ? `Custom · ${customName.trim()}` : def.name;
  const faceLabel = isLightbox ? `Lightbox · ${lbBuildLabel}` : serviceName;
  const lightingLabel = labelOf(LIGHTING_OPTIONS, lighting);
  const printingLabel = def.printing ? labelOf(PRINTING_OPTIONS, printing) : "";
  const variant = isLightbox ? lbBuild : serviceId === "acrylic" ? "acrylic" : "panaflex";

  // Arms / brackets: user chooses 1 or 2 for supported mounts; default single for small circles
  const needsArms = mounting === "bracket" || mounting === "hanging" || mounting === "pole" || mounting === "pole_single";
  const bracketCount = needsArms ? armCount : 1;
  const mountingText = needsArms
    ? `${MOUNTING_LABELS[mounting]} · ${armCount === 1 ? "single arm" : "double arm"}`
    : MOUNTING_LABELS[mounting];

  const traits = useMemo<Traits>(() => ({
    frameThickness: Math.max(0.02, thicknessIn / 12),
    metal: isLightbox ? "aluminum" : "primer",
    light: lit ? "internal" : "none",
    mount: mounting,
    material: serviceId === "metal" ? "stainless" : "acrylic",
    backing: "clear",
    bodyColor,
    returnColor,
  }), [thicknessIn, isLightbox, lit, mounting, serviceId, bodyColor, returnColor]);

  const activePreset = presetFor(serviceId, { lit, lbBuild, presetId });
  const isLetters = !!activePreset && LETTER_IDS.includes(activePreset.id);
  const isNeonText = activePreset?.kind === "neon";
  const lettersOn = (isLetters || isNeonText) && !isCircle;
  const flatCut = activePreset?.id === "ac-letters-flat";
  const lFont = useLetterFont(letterFont, lettersOn);
  const layout = useMemo(() => (lFont && lettersOn ? layoutText(lFont, letterText.trim() ? letterText : " ") : null), [lFont, lettersOn, letterText]);
  const lScale = layout ? letterHeightIn / 12 / layout.capH : 1;
  const boxW = layout ? Math.round((layout.maxX - layout.minX) * lScale * 100) / 100 : 0;
  const boxH = layout ? Math.round((layout.maxY - layout.minY) * lScale * 100) / 100 : 0;
  useEffect(() => {
    if (!lettersOn || !layout || boxW <= 0 || boxH <= 0) return;
    setWidth(boxW); setHeight(boxH);
  }, [lettersOn, layout, boxW, boxH]);
  const letterDepthUsed = isNeonText ? 0.5 : flatCut ? 0.2 : letterDepthIn;
  useEffect(() => {
    if (lettersOn) setThicknessIn(letterDepthUsed);
  }, [lettersOn, letterDepthUsed]);
  const lettersSpec: LettersSpec | undefined = layout && lettersOn ? {
    layout, scale: lScale, depthFt: letterDepthUsed / 12, faceFt: flatCut ? letterDepthUsed / 12 : (activePreset?.thick ? 5 : 3) / 304.8,
    faceColor: bodyColor, returnColor, glow: activePreset?.id === "ac-letters-lit" ? letterGlow : "none",
    neon: isNeonText, neonColors: NEON_PALETTE.slice(0, Math.max(1, neonColors)), backing: neonBacking,
  } : undefined;
  const isBoltPanel = !!activePreset && BOLT_PRESET_IDS.includes(activePreset.id);
  const panelMm = activePreset?.id === "ac-3mm" ? 3 : 5;
  const boltSpec: BoltSpec | undefined = isBoltPanel ? { panelMm, standoffMm, count: boltCount, finish: boltFinish, tint: panelTint, diaMm: 25 } : undefined;
  useEffect(() => {
    if (!isBoltPanel) return;
    setMounting("wall");
    setThicknessIn(Math.round(((panelMm + standoffMm) / 25.4) * 100) / 100);
  }, [isBoltPanel, panelMm, standoffMm, mounting]);
  const mountingShown = isBoltPanel
    ? `Wall · ${boltCount} advertising bolts (${BOLT_FINISHES.find((f) => f.id === boltFinish)?.label.toLowerCase()}, ${standoffMm} mm standoff)`
    : mountingText;
  const live = useMemo(() => {
    if (activePreset) {
      const pp = priceSign(activePreset, qs.presetSettings, areaSqft, sides === "double", { colors: neonColors, psu, leftoverLost });
      return { rates: { construction: 0, face: 0, lighting: 0, printing: 0 }, raw: pp.fab + pp.material, unitCost: pp.unit, hasTbd: pp.tbd, breakdown: { construction: pp.fab, face: pp.material, lighting: 0, printing: 0, markup: pp.markup } as LineItem["breakdown"] | undefined };
    }
    const markup = 1 + qs.markupPct / 100;
    const pr = qs.pricing;
    const key = lit ? "with" : "without";
    const printRate = def.printing ? (pr.printing[printing] ?? 0) * sidesMult : 0;

    if (isLightbox) {
      // Lightbox: one rate per sqft for the chosen build, with / without light
      const rate = (pr.lightbox[lbBuild]?.[key] ?? 0) * sidesMult;
      const rates = { construction: rate, face: 0, lighting: 0, printing: printRate };
      const raw = (rate + printRate) * areaSqft;
      return { rates, raw, unitCost: Math.max(pr.lightboxMinimumCharge || 0, raw * markup), hasTbd: rate <= 0 };
    }

    // Other materials: material rate per sqft for the chosen light option (+ hidden construction, + printing)
    // Sticker and Neon LED have no internal frame.
    const framed = serviceId !== "sticker" && serviceId !== "neon";
    const rates = {
      construction: framed ? pr.constructionPerSqft : 0,
      face: (pr.materials[serviceId]?.[key] ?? 0) * sidesMult,
      lighting: 0,
      printing: printRate,
    };
    const raw = (rates.construction + rates.face + rates.lighting + rates.printing) * areaSqft;
    return { rates, raw, unitCost: Math.max(pr.minimumCharge || 0, raw * markup), hasTbd: rates.face <= 0 };
  }, [qs, isLightbox, lbBuild, serviceId, lit, printing, areaSqft, sidesMult, def.printing, activePreset, sides, neonColors, psu, leftoverLost]);

  const pickShape = (next: Shape) => {
    setShape(next);
    if (next === "circle") {
      if (def.circleMaxFt) setDiameter((d) => Math.min(d, def.circleMaxFt!));
      setArmCount(1); // small round signs default to single arm
    }
  };
  const pickService = (id: ServiceId) => {
    const nextDef = SERVICES.find((x) => x.id === id) ?? SERVICES[0];
    setServiceId(id);
    setPresetId("");
    setThicknessIn(nextDef.thicknessIn);
    setLighting(nextDef.defaultLight);
    if (shape === "circle" && nextDef.circleMaxFt) setDiameter((d) => Math.min(d, nextDef.circleMaxFt!));
  };

  const onLogoFile = (file: File | null) => {
    if (!file) {
      setLogoPreview("");
      setLogoOriginal("");
      setLogoBgCleared(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      setLogoPreview(data);
      setLogoOriginal(data);
      setLogoBgCleared(false);
    };
    reader.readAsDataURL(file);
  };

  /** Make near-white pixels transparent so logo sits clean on clear acrylic / 3D face */
  const removeLogoWhiteBackground = useCallback(() => {
    const src = logoOriginal || logoPreview || logoUrl;
    if (!src) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      // Start fully transparent so cleared pixels stay alpha=0 (not black)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      // Near-white / light gray → transparent (soft falloff so edges look clean)
      const fullClear = 230; // fully transparent at this brightness and above
      const softStart = 200; // begin fading alpha
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        const sat = max - min;
        // Light, low-saturation pixels (white / off-white / light gray BG)
        if (min >= softStart && sat < 40) {
          if (min >= fullClear) {
            d[i + 3] = 0; // fully transparent — not black
          } else {
            const t = (min - softStart) / (fullClear - softStart);
            d[i + 3] = Math.round(d[i + 3] * (1 - t));
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      const cleared = canvas.toDataURL("image/png");
      if (!logoOriginal) setLogoOriginal(src);
      setLogoPreview(cleared);
      setLogoBgCleared(true);
    };
    img.onerror = () => {
      setMsg("Could not process logo (try uploading the file instead of a link).");
      setTimeout(() => setMsg(""), 3000);
    };
    img.src = src;
  }, [logoOriginal, logoPreview, logoUrl]);

  const restoreLogoBackground = useCallback(() => {
    if (logoOriginal) {
      setLogoPreview(logoOriginal);
      setLogoBgCleared(false);
    }
  }, [logoOriginal]);

  const onSitePhotoFile = (file: File | null) => {
    if (!file) { setSitePhoto(""); return; }
    const reader = new FileReader();
    reader.onload = () => setSitePhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const PLACEMENT_LABELS: Record<string, string> = {
    storefront: "Storefront / Façade",
    wall: "Wall-mounted (flush)",
    bracket: "Wall with bracket",
    pole: "Pole / Pylon",
    rooftop: "Rooftop support",
    other: "Other / Custom",
  };

  const addLine = () => {
    if (areaSqft <= 0) return;
    const renders = {
      front: sceneRef.current?.captureFront() ?? null,
      side: sceneRef.current?.captureSide() ?? null,
      iso: sceneRef.current?.captureIso() ?? null,
    };
    const r = live.rates;
    setLines((prev) => [...prev, {
      id: crypto.randomUUID(), serviceId, signName: `${serviceName} Sign`, shape,
      width: dimW, height: dimH, diameter, thicknessIn, unit: dimUnit, depthUnit, areaSqft, qty,
      face: `${activePreset ? activePreset.name : faceLabel} · ${sidesLabel} · ${isBoltPanel ? `${PANEL_TINTS.find((t) => t.id === panelTint)?.label.toLowerCase()} panel ${panelMm}mm` : `face ${colorName(bodyColor)} / ${isLetters ? "siding" : "depth"} ${colorName(returnColor)}`}`, lighting: lightingLabel, printing: printingLabel, mounting: mountingShown, note, unitCost: live.unitCost,
      breakdown: (live as { breakdown?: LineItem["breakdown"] }).breakdown ?? {
        construction: r.construction * areaSqft, face: r.face * areaSqft, lighting: r.lighting * areaSqft, printing: r.printing * areaSqft,
        markup: live.unitCost - (r.construction + r.face + r.lighting + r.printing) * areaSqft,
      },
      hasTbd: live.hasTbd, renders, logoUrl: activeLogo,
    }]);
    setNote(""); setMsg("Item added · front, side & 3D renders captured ✓"); setTimeout(() => setMsg(""), 2500);
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));

  /** Reset builder to a blank new build (after draft save or “start over”) */
  const resetBuildForm = useCallback(() => {
    setShape("rect");
    setServiceId("panaflex");
    setSides("single");
    setCustomName("");
    setLbBuild("builtup");
    setWidth(4);
    setHeight(2);
    setDiameter(2);
    setThicknessIn(2);
    setQty(1);
    setLighting("without");
    setPrinting("sticker");
    setPresetId("");
    setLetterText("BRAND");
    setLetterFont("helvetiker");
    setLetterHeightIn(12);
    setLetterDepthIn(2);
    setLetterGlow("halo");
    setNeonBacking("clear");
    setNeonColors(1);
    setPsu(0);
    setLeftoverLost(false);
    setMounting("wall");
    setArmCount(1);
    setBodyColor("#ffffff");
    setReturnColor("#1a1a1a");
    setNote("");
    setLogoUrl("");
    setLogoPreview("");
    setLogoOriginal("");
    setLogoBgCleared(false);
    setLogoScaleW(90);
    setLogoScaleH(90);
    setBoltFinish("chrome");
    setBoltCount(4);
    setPanelTint("clear");
    setStandoffMm(25);
    setBuildStep(1);
    setDimUnit("ft");
    setDepthUnit("in");
    setLetterUnit("in");
    setSitePhoto("");
    setSiteMockup("");
    setPlacementNote("");
    setPinPos({ x: 50, y: 45 });
    setPinScale(28);
    setPinStretchX(100);
    setPinStretchY(100);
    setPinSkew(0);
  }, []);
  const subtotal = lines.reduce((s, l) => s + l.unitCost * l.qty, 0);
  const mobilDefault = lines.some((l) => l.areaSqft > qs.presetSettings.mobilThresholdSqft) ? qs.presetSettings.mobilLarge : qs.presetSettings.mobilSmall;
  const mobil = lines.length === 0 ? 0 : (mobilization ?? mobilDefault);
  const rushPct = qs.presetSettings.rushPct;
  const rush = deliveryType === "rush" ? subtotal * (rushPct / 100) : 0;
  const shipping = deliveryType === "shipping" ? shippingFee : 0;
  const afterDisc = Math.max(0, subtotal - discount) + rush + mobil + shipping;
  /** VAT is not part of our rates; it is added manually on the Official Receipt. */
  const vat = 0;
  const grand = afterDisc + vat;
  const quoteNo = `${qs.quotePrefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(lines.length || 1).padStart(2, "0")}`;

  /** Only drafts that have a real user-chosen filename */
  const hasRealName = (name: unknown) => {
    const n = String(name ?? "").trim();
    return n.length > 0;
  };

  /** One-time rescue: drafts saved on this device by the old offline mode are uploaded to Supabase, then cleared. */
  const migrateLegacyLocalDrafts = async (sb: NonNullable<ReturnType<typeof createClient>>) => {
    try {
      const raw = localStorage.getItem(LOCAL_DRAFTS_KEY);
      if (!raw) return;
      const gone = new Set<string>(JSON.parse(localStorage.getItem(DELETED_DRAFTS_KEY) || "[]"));
      const arr = JSON.parse(raw) as Array<{ id: string; quote_no: string; draftName?: string; created_at?: string; client?: ClientInfo; lines?: LineItem[]; totals?: Record<string, unknown> }>;
      let failed = false;
      for (const d of arr) {
        const name = String(d.draftName || (d.totals as { draftName?: string })?.draftName || "").trim();
        if (!name || gone.has(d.id)) continue;
        const { error } = await sb.from("quotes").upsert(
          { id: d.id, quote_no: d.quote_no, client: d.client ?? {}, lines: d.lines ?? [], totals: { ...(d.totals ?? {}), draftName: name }, status: "draft", created_at: d.created_at },
          { onConflict: "id", ignoreDuplicates: true },
        );
        if (error) failed = true;
      }
      if (!failed) { localStorage.removeItem(LOCAL_DRAFTS_KEY); localStorage.removeItem(DELETED_DRAFTS_KEY); }
    } catch { /* ignore */ }
  };

  const loadDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    const sb = createClient();
    if (!sb) {
      setDrafts([]);
      setMsg("Database not connected — drafts cannot be loaded. Check the Supabase environment variables.");
      setLoadingDrafts(false);
      return;
    }
    await migrateLegacyLocalDrafts(sb);
    const { data, error } = await sb
      .from("quotes")
      .select("id, quote_no, client, lines, totals, status, created_at")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      setMsg(`Could not load drafts: ${error.message}`);
      setLoadingDrafts(false);
      return;
    }
    const remote: DraftRow[] = (data ?? [])
      .map((row) => {
        const totals = (row.totals ?? {}) as Record<string, unknown>;
        const linesArr = (row.lines ?? []) as LineItem[];
        return {
          id: row.id as string,
          quote_no: row.quote_no as string,
          draftName: String(totals.draftName ?? "").trim(),
          created_at: row.created_at as string,
          grand: Number(totals.grand ?? 0),
          itemCount: linesArr.length,
          source: "supabase" as const,
          raw: { client: row.client as ClientInfo, lines: linesArr, totals },
          archived: Boolean(totals.archived),
        };
      })
      .filter((d) => hasRealName(d.draftName) && !d.archived)
      .map(({ archived: _a, ...d }) => d);
    setDrafts(remote);
    setLoadingDrafts(false);
  }, []);

  /** Removes a draft from Supabase. Soft-delete first (works with the UPDATE policy), then a hard delete. */
  const removeDraftOnServer = async (sb: NonNullable<ReturnType<typeof createClient>>, d: DraftRow) => {
    const prev = (d.raw?.totals ?? {}) as Record<string, unknown>;
    const { error: upErr } = await sb.from("quotes").update({ status: "lost", totals: { ...prev, archived: true, draftName: d.draftName } }).eq("id", d.id);
    const { error: delErr } = await sb.from("quotes").delete().eq("id", d.id);
    return !upErr || !delErr;
  };

  const openDraft = (d: DraftRow) => {
    if (!hasRealName(d.draftName)) {
      setMsg("This draft has no filename and cannot be opened.");
      return;
    }
    const linesArr = d.raw?.lines ?? [];
    const totals = d.raw?.totals ?? {};
    if (totals.archived) {
      setMsg("This draft was deleted.");
      return;
    }
    setLines(linesArr);
    setDiscount(Number(totals.discount ?? 0));
    setMobilization(totals.mobilization == null ? null : Number(totals.mobilization));
    setDeliveryType(totals.deliveryType === "rush" || totals.deliveryType === "shipping" ? totals.deliveryType : "normal");
    setShippingFee(Number(totals.shipping ?? 0));
    setPreparedBy(String(totals.preparedBy ?? ""));
    setDraftName(d.draftName);
    setEditingDraftId(d.id);
    setShowDrafts(false);
    setMsg(`Opened draft “${d.draftName}” — edit then Save to update.`);
    setTimeout(() => setMsg(""), 3500);
  };

  const deleteDraft = async (d: DraftRow) => {
    if (!confirm(`Delete draft “${d.draftName}”?`)) return;
    const sb = createClient();
    if (!sb) {
      setMsg("Database not connected — cannot delete.");
      return;
    }
    const ok = await removeDraftOnServer(sb, d);
    if (!ok) {
      setMsg("Could not delete the draft on the server. Try again.");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    setDrafts((prev) => prev.filter((x) => x.id !== d.id));
    if (editingDraftId === d.id) {
      setEditingDraftId(null);
      setDraftName("");
      setLines([]);
    }
    setMsg("Draft deleted.");
    setTimeout(() => setMsg(""), 3000);
  };

  const saveQuote = useCallback(async () => {
    setSaving(true);
    setMsg("");
    if (lines.length === 0) {
      setMsg("Add at least one sign before saving.");
      setSaving(false);
      return;
    }
    const name = draftName.trim();
    if (!name) {
      setMsg("Draft name is required. Type a filename before saving.");
      setSaving(false);
      return; // do not open drafts panel as a workaround — just block save
    }
    const totals = {
      sub: subtotal,
      discount,
      mobilization: mobil,
      deliveryType,
      rushPct: deliveryType === "rush" ? rushPct : 0,
      rush,
      shipping,
      vat,
      grand,
      preparedBy,
      preparedByTitle: qs.preparedByTitle,
      draftName: name,
    };
    const linePayload = lines.map((l) => ({ ...l, amount: l.unitCost * l.qty }));
    const sb = createClient();
    if (!sb) {
      setMsg("Database not connected — quote not saved. Check the Supabase environment variables.");
      setSaving(false);
      return;
    }
    {
      if (editingDraftId) {
        const { error } = await sb
          .from("quotes")
          .update({
            quote_no: quoteNo,
            client,
            lines: linePayload,
            totals,
            status: "draft",
          })
          .eq("id", editingDraftId);
        if (error) {
          setMsg(`Update failed: ${error.message}`);
          setSaving(false);
          return;
        }
        setMsg(`Updated draft “${name}”. Builder cleared for a new quote.`);
      } else {
        const { data, error } = await sb
          .from("quotes")
          .insert({
            quote_no: quoteNo,
            client,
            lines: linePayload,
            totals,
            status: "draft",
          })
          .select("id")
          .single();
        if (error) {
          setMsg(`Save failed: ${error.message}`);
          setSaving(false);
          return;
        }
        setMsg(`Saved draft “${name}”. Builder cleared — start a new build anytime.`);
      }
    }
    // Clear local build + quote so user starts a fresh build (draft is already stored)
    setLines([]);
    setDraftName("");
    setEditingDraftId(null);
    setDiscount(0);
    setMobilization(null);
    setDeliveryType("normal");
    setShippingFee(0);
    setPreparedBy("");
    resetBuildForm();
    setSaving(false);
    setTimeout(() => setMsg(""), 4000);
  }, [quoteNo, client, lines, subtotal, discount, deliveryType, rushPct, rush, shipping, vat, grand, preparedBy, qs.preparedByTitle, draftName, editingDraftId, resetBuildForm]);

  const downloadImage = useCallback(async (format: "png" | "jpeg") => {
    const el = quoteSheetRef.current;
    if (!el) return;
    if (lines.length === 0) {
      setMsg("Add at least one sign before downloading.");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    setExporting(true);
    setMsg("");
    const hideNodes = Array.from(el.querySelectorAll<HTMLElement>(".no-export"));
    try {
      hideNodes.forEach((n) => { n.dataset._prevDisplay = n.style.display; n.style.display = "none"; });
      // Fit-to-content image (no blank A4 padding) at ~1600px wide → small, fast, still sharp.
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const { toPng, toJpeg } = await import("html-to-image");
      // The on-screen sheet is centered with mx-auto (+ shadow). html-to-image copies that computed
      // margin onto the clone, which shifts the sheet right inside the canvas → white strip on the left
      // and the right side cut off. Neutralise margin/shadow on the clone so it renders flush at 0,0.
      const options = {
        pixelRatio: Math.max(1.5, 1600 / w),
        backgroundColor: "#ffffff",
        width: w,
        height: h,
        quality: format === "jpeg" ? 0.92 : 1,
        cacheBust: true,
        style: { margin: "0", boxShadow: "none", transform: "none", width: `${w}px`, maxWidth: `${w}px` },
      };
      const dataUrl = format === "png" ? await toPng(el, options) : await toJpeg(el, options);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${quoteNo}.${format === "png" ? "png" : "jpg"}`;
      a.click();
      setMsg(`Downloaded ${format === "png" ? "PNG" : "JPG"} · ready to send to client`);
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setMsg("Image export failed. Try again or check the browser console.");
      setTimeout(() => setMsg(""), 4000);
    } finally {
      hideNodes.forEach((n) => { n.style.display = n.dataset._prevDisplay || ""; delete n.dataset._prevDisplay; });
      setExporting(false);
    }
  }, [lines.length, quoteNo]);

  const downloadMockupOnly = useCallback(() => {
    const last = [...lines].reverse().find((l) => l.renders.iso);
    if (!last?.renders.iso) {
      setMsg("No 3D render yet — add a sign first.");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    const a = document.createElement("a");
    a.href = last.renders.iso;
    a.download = `${quoteNo}-3d-render.jpg`;
    a.click();
    setMsg("3D render downloaded");
    setTimeout(() => setMsg(""), 2500);
  }, [lines, quoteNo]);

  const inputCls = "w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-white placeholder:text-fog/50 focus:border-teal outline-none";
  const labelCls = "block text-[11px] font-bold tracking-wider uppercase text-fog mb-1.5";
  const stepCls = "text-[10px] uppercase tracking-[0.2em] text-gold font-bold";
  const cardCls = "rounded-2xl border border-line bg-panel p-5 space-y-4";
  const shapeLabel = (sh: Shape) => (sh === "circle" ? "Circle" : "Rectangle");

  /** Common sizes sales teams quote often (ft) */
  const SIZE_PRESETS: { label: string; w: number; h: number }[] = [
    { label: "2×1", w: 2, h: 1 },
    { label: "3×2", w: 3, h: 2 },
    { label: "4×2", w: 4, h: 2 },
    { label: "4×3", w: 4, h: 3 },
    { label: "6×3", w: 6, h: 3 },
    { label: "8×4", w: 8, h: 4 },
  ];
  const CIRCLE_PRESETS = [1, 1.5, 2, 2.5, 3];

  const applyPreset = (w: number, h: number) => {
    if (isCircle) {
      const d = Math.min(circleMax ?? Infinity, Math.max(w, h));
      setDiameter(d);
    } else {
      setWidth(w);
      setHeight(h);
    }
  };

  const refreshSiteMockup = () => {
    // Prefer transparent PNG so only the sign shows on the site photo
    const clear = sceneRef.current?.captureIsoClear?.() ?? null;
    const iso = clear || (sceneRef.current?.captureIso() ?? null);
    if (iso) setSiteMockup(iso);
  };

  const onSitePhotoClick = (e: { clientX: number; clientY: number }) => {
    const el = sitePhotoRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setPinPos({ x, y });
    if (!siteMockup) refreshSiteMockup();
  };

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/"><Image src="/dwlogo.png" alt="Delight Works" width={200} height={48} className="h-8 w-auto object-contain" priority /></Link>
            <span className="font-display font-bold text-sm hidden sm:inline truncate">
              Quote Builder <span className="text-fog font-normal">· for sales</span>
            </span>
            {supabaseOk === false && (
              <span className="text-[10px] rounded bg-red-500/20 text-red-300 px-2 py-0.5 border border-red-500/40 shrink-0">Database not connected — saving disabled</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {lines.length > 0 && (
              <span className="hidden md:inline text-xs text-fog mr-1">
                {lines.length} item{lines.length > 1 ? "s" : ""} · <strong className="text-gold">₱{fmt(grand)}</strong>
              </span>
            )}
            <button
              type="button"
              onClick={() => { setShowDrafts((v) => !v); if (!showDrafts) loadDrafts(); }}
              className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-fog hover:border-teal hover:text-white"
            >
              {showDrafts ? "Close drafts" : "My drafts"}
            </button>
            <Link href="/buildersettings" className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-fog hover:border-teal hover:text-white">
              Settings
            </Link>
            <button disabled={exporting || lines.length === 0} onClick={() => downloadImage("jpeg")} className="rounded-full border border-gold/50 px-3 py-2 text-xs font-bold text-gold hover:bg-gold/10 disabled:opacity-40">
              Send JPG
            </button>
            <button disabled={exporting || lines.length === 0} onClick={() => downloadImage("png")} className="rounded-full bg-gold text-ink px-4 py-2 text-xs font-bold hover:bg-gold-dim disabled:opacity-40">
              {exporting ? "…" : "Send PNG"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] p-4 lg:p-6 space-y-6">
        {/* Drafts panel */}
        {showDrafts && (
          <div className="no-export rounded-2xl border border-line bg-panel p-4 text-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold">My drafts</h2>
                <p className="text-xs text-fog">Open a draft to edit, or name this quote before saving.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={loadDrafts} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-fog hover:text-white">
                  {loadingDrafts ? "Loading…" : "Refresh"}
                </button>
                {drafts.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("Delete ALL named drafts from this list?")) return;
                      const sb = createClient();
                      if (!sb) { setMsg("Database not connected — cannot delete."); return; }
                      const failedIds: string[] = [];
                      for (const d of drafts) {
                        if (!(await removeDraftOnServer(sb, d))) failedIds.push(d.id);
                      }
                      if (failedIds.length) {
                        setDrafts((prev) => prev.filter((x) => failedIds.includes(x.id)));
                        setMsg(`${failedIds.length} draft(s) could not be deleted on the server.`);
                        return;
                      }
                      setDrafts([]);
                      setEditingDraftId(null);
                      setDraftName("");
                      setLines([]);
                      setMsg("All drafts cleared.");
                      setTimeout(() => setMsg(""), 2000);
                    }}
                    className="rounded-full border border-red-400/50 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold tracking-wider uppercase text-fog mb-1">Draft name (filename for later edit)</label>
                <input
                  className="w-full rounded-xl border border-line bg-ink/40 px-3 py-2 text-sm text-white placeholder:text-fog/50 outline-none focus:border-teal"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g. ABC Storefront April, Juan circle lightbox"
                />
              </div>
              {editingDraftId && (
                <button
                  type="button"
                  onClick={() => { setEditingDraftId(null); setDraftName(""); setMsg("New draft mode — save will create a new entry."); }}
                  className="rounded-full border border-line px-3 py-2 text-xs text-fog hover:text-white"
                >
                  Clear edit (new)
                </button>
              )}
            </div>
            {editingDraftId && (
              <p className="text-[11px] text-teal">Editing existing draft — Save will update it.</p>
            )}
            <div className="max-h-56 overflow-y-auto rounded-xl border border-line divide-y divide-line">
              {loadingDrafts && <p className="p-3 text-xs text-fog">Loading drafts…</p>}
              {!loadingDrafts && drafts.length === 0 && (
                <p className="p-3 text-xs text-fog">No drafts yet. Build a quote, type a name, then Save draft.</p>
              )}
              {drafts.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-2 px-3 py-2 hover:bg-ink/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{d.draftName}</p>
                    <p className="text-[10px] text-fog">
                      {d.quote_no} · {d.itemCount} item{d.itemCount !== 1 ? "s" : ""} · ₱{fmt(d.grand)} · {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button type="button" onClick={() => openDraft(d)} className="rounded-full bg-gold text-ink px-3 py-1.5 text-xs font-bold">
                    Open / edit
                  </button>
                  <button type="button" onClick={() => deleteDraft(d)} className="rounded-full border border-line px-3 py-1.5 text-xs text-red-400 hover:border-red-400">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOP: Builder (left) + live 3D (right). Desktop: 3D stays put; left header fixed, options scroll.
            Mobile: 3D on top, all options scroll below. */}
        <div className="grid lg:grid-cols-[minmax(320px,0.85fr)_minmax(480px,1.15fr)] gap-6 items-start lg:items-stretch lg:h-[calc(100vh-5.5rem)] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-hidden">
          {/* LEFT — wizard controls */}
          <section className="order-2 lg:order-1 flex flex-col gap-3 min-h-0 lg:h-full lg:overflow-hidden">
            {/* Fixed header + step pills (does not scroll on desktop) */}
            <div className="rounded-2xl border border-line bg-panel p-4 shrink-0">
              <h1 className="font-display text-xl font-bold">Build a quote</h1>
              <p className="text-xs text-fog mt-1">One step at a time — 3D stays on the right.</p>
              {/* Compact step pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { n: 1, t: "Shape" },
                  { n: 2, t: "Material" },
                  { n: 3, t: "Size" },
                  { n: 4, t: "Options" },
                  { n: 5, t: "Logo" },
                  { n: 6, t: "Add" },
                ].map((s) => (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => setBuildStep(s.n)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                      buildStep === s.n
                        ? "bg-gold text-ink"
                        : buildStep > s.n
                          ? "bg-teal/20 text-teal border border-teal/40"
                          : "bg-ink/40 text-fog border border-line"
                    }`}
                  >
                    {s.n}. {s.t}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable step content (desktop: only this block scrolls) */}
            <div className="space-y-3 min-h-0 lg:overflow-y-auto lg:flex-1 lg:pr-1 pb-2">
            {/* 1 · Shape */}
            {buildStep === 1 && (
            <div className={cardCls}>
              <div>
                <p className={stepCls}>1 · Shape</p>
                <h2 className="font-display text-lg font-bold">Rectangle or circle?</h2>
                <p className="text-[11px] text-fog mt-0.5">Most signs are rectangular. Circles are great for logos and lightboxes.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["rect", "circle"] as Shape[]).map((sh) => (
                  <button key={sh} onClick={() => pickShape(sh)} className={`rounded-xl border px-4 py-4 text-left transition flex items-center gap-3 ${shape === sh ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>
                    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      {sh === "rect" ? <rect x="3" y="8" width="28" height="18" rx="2" /> : <circle cx="17" cy="17" r="13" />}
                    </svg>
                    <span>
                      <span className="block font-bold text-sm">{shapeLabel(sh)}</span>
                      <span className="block text-[11px] opacity-80">{sh === "rect" ? "W × H box" : "Round · diameter"}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-1">
                <button type="button" onClick={() => setBuildStep(2)} className="rounded-full bg-gold text-ink px-5 py-2 text-sm font-bold">Next · Material →</button>
              </div>
            </div>
            )}

            {/* 2 · Material */}
            {buildStep === 2 && (
            <div className={cardCls}>
              <div>
                <p className={stepCls}>2 · Material</p>
                <h2 className="font-display text-lg font-bold">What kind of sign?</h2>
                <p className="text-[11px] text-fog mt-0.5">Panaflex is the everyday choice. Lightbox if they want it lit.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SERVICES.map((sv) => {
                  const active = serviceId === sv.id;
                  return (
                    <button
                      key={sv.id}
                      onClick={() => pickService(sv.id)}
                      className={`rounded-xl border px-3 py-3 text-left transition ${active ? "border-teal bg-teal text-ink" : "border-line bg-ink/30 text-fog hover:border-teal"}`}
                    >
                      <span className="block font-bold text-sm">{sv.name}</span>
                      <span className="block text-[11px] opacity-80 leading-snug">{sv.sub}</span>
                    </button>
                  );
                })}
              </div>
              {serviceId === "custom" && (
                <div>
                  <label className={labelCls}>Custom material</label>
                  <input className={inputCls} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Stainless letters on wood panel" />
                </div>
              )}
              <div className="flex justify-between pt-1 gap-2">
                <button type="button" onClick={() => setBuildStep(1)} className="rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-white">← Back</button>
                <button type="button" onClick={() => setBuildStep(3)} className="rounded-full bg-gold text-ink px-5 py-2 text-sm font-bold">Next · Size →</button>
              </div>
            </div>
            )}

            {/* 3 · Dimensions */}
            {buildStep === 3 && (
            <div className={cardCls}>
              <div>
                <p className={stepCls}>3 · Size</p>
                <h2 className="font-display text-lg font-bold">How big is the sign?</h2>
                <p className="text-[11px] text-fog mt-0.5">
                  Tap a common size, or type it in ft, inch, cm or mm — the price always runs on sqft. {circleMax ? `Circle max ${circleMax} ft.` : ""}
                </p>
              </div>

              {/* Quick size presets — sales love these */}
              <div>
                <label className={labelCls}>Common sizes (tap to apply)</label>
                <div className="flex flex-wrap gap-2">
                  {isCircle
                    ? CIRCLE_PRESETS.filter((d) => !circleMax || d <= circleMax).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDiameter(d)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                            diameter === d ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"
                          }`}
                        >
                          Ø {d} ft
                        </button>
                      ))
                    : SIZE_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => applyPreset(p.w, p.h)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                            width === p.w && height === p.h ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"
                          }`}
                        >
                          {p.label} ft
                        </button>
                      ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isCircle ? (
                  <UnitField label="Diameter" hint={circleMax ? `max ${fmtLen(circleMax, dimUnit)}` : undefined} value={diameter} unit={dimUnit} onUnit={setDimUnit}
                    fromBase={fromFt} toBase={toFt} onChange={setDiameter} minBase={0.1} maxBase={circleMax} inputCls={inputCls} labelCls={labelCls} />
                ) : (
                  <>
                    <UnitField label="Width" value={width} unit={dimUnit} onUnit={setDimUnit} fromBase={fromFt} toBase={toFt} onChange={setWidth} minBase={0.1} inputCls={inputCls} labelCls={labelCls} />
                    <UnitField label="Height" value={height} unit={dimUnit} onUnit={setDimUnit} fromBase={fromFt} toBase={toFt} onChange={setHeight} minBase={0.1} inputCls={inputCls} labelCls={labelCls} />
                  </>
                )}
                <UnitField label="Depth" value={thicknessIn} unit={depthUnit} onUnit={setDepthUnit} fromBase={fromIn} toBase={toIn} onChange={setThicknessIn} minBase={0.04} inputCls={inputCls} labelCls={labelCls} />
              </div>
              <p className="text-[11px] text-fog rounded-lg border border-line bg-ink/30 px-3 py-2">
                {isCircle ? `Ø ${trimNum(diameter)} ft` : `${trimNum(width)} × ${trimNum(height)} ft`}
                {" = "}<strong className="text-white">{areaSqft.toFixed(2)} sqft</strong>
                {dimUnit !== "ft" && <> · typed as {isCircle ? `Ø ${fmtLen(diameter, dimUnit)}` : `${fmtLen(width, dimUnit)} × ${fmtLen(height, dimUnit)}`}</>}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-ink/50 border border-line px-2 py-2">
                  <span className="text-fog block">Area</span>
                  <strong>{areaSqft.toFixed(2)} sqft</strong>
                </div>
                <div className="rounded-lg bg-ink/50 border border-line px-2 py-2">
                  <span className="text-fog block">Depth</span>
                  <strong>{fmtLen(thicknessIn / 12, depthUnit)}</strong>
                </div>
                <div className="rounded-lg bg-ink/50 border border-line px-2 py-2">
                  <span className="text-fog block">How many?</span>
                  <input className="bg-transparent text-center w-full outline-none font-bold" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} />
                </div>
              </div>
              <div className="flex justify-between pt-1 gap-2">
                <button type="button" onClick={() => setBuildStep(2)} className="rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-white">← Back</button>
                <button type="button" onClick={() => setBuildStep(4)} className="rounded-full bg-gold text-ink px-5 py-2 text-sm font-bold">Next · Options →</button>
              </div>
            </div>
            )}

            {/* 4 · Options */}
            {buildStep === 4 && (
            <div className={cardCls}>
              <div>
                <p className={stepCls}>4 · Options</p>
                <h2 className="font-display text-lg font-bold">Lighting, print &amp; how it mounts</h2>
                <p className="text-[11px] text-fog mt-0.5">Most clients care about light on/off and where it hangs. Defaults are already sensible.</p>
              </div>

              {isLightbox && (
                <div>
                  <label className={labelCls}>Lightbox build</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LB_BUILDS.map(([id, name, sub]) => (
                      <button key={id} onClick={() => setLbBuild(id)} className={`rounded-xl border px-3 py-3 text-left transition ${lbBuild === id ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>
                        <span className="block text-sm font-semibold">{name}</span>
                        <span className="block text-[11px] opacity-80">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {serviceId !== "panaflex" && presetsFor(serviceId).length > 1 && (
                <div>
                  <label className={labelCls}>Build</label>
                  <div className="grid grid-cols-1 gap-2">
                    {presetsFor(serviceId).map((p) => (
                      <button key={p.id} onClick={() => { setPresetId(p.id); setLighting(p.lit); }} className={`rounded-xl border px-3 py-2 text-left transition ${activePreset?.id === p.id ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>
                        <span className="block text-sm font-semibold">{p.name}</span>
                        <span className="block text-[11px] opacity-80">{p.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activePreset?.kind === "acrylic" && activePreset.thick && (
                <label className="flex items-center gap-2 text-xs text-fog">
                  <input type="checkbox" checked={leftoverLost} onChange={(e) => setLeftoverLost(e.target.checked)} />
                  Leftover sheet cannot be reused (bill the full sheet)
                </label>
              )}
              {isBoltPanel && (
                <div className="rounded-xl border border-gold/40 bg-ink/30 p-3 space-y-3">
                  <p className={labelCls}>Acrylic panel · advertising bolts</p>
                  <div>
                    <label className={labelCls}>Panel</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PANEL_TINTS.map((t) => (
                        <button key={t.id} type="button" onClick={() => setPanelTint(t.id)} className={`rounded-xl border px-2 py-2 text-sm font-semibold ${panelTint === t.id ? "border-gold bg-gold text-ink" : "border-line text-fog hover:border-gold"}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Bolt finish</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BOLT_FINISHES.map((f) => (
                        <button key={f.id} type="button" onClick={() => setBoltFinish(f.id)} className={`rounded-xl border px-2 py-2 text-sm font-semibold flex items-center justify-center gap-1.5 ${boltFinish === f.id ? "border-gold bg-gold text-ink" : "border-line text-fog hover:border-gold"}`}>
                          <span className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: f.color }} />{f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Bolts</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([4, 6] as const).map((n) => (
                          <button key={n} type="button" onClick={() => setBoltCount(n)} className={`rounded-xl border px-2 py-2 text-sm font-semibold ${boltCount === n ? "border-gold bg-gold text-ink" : "border-line text-fog hover:border-gold"}`}>{n} pcs</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Standoff (gap to wall)</label>
                      <select className={inputCls} value={standoffMm} onChange={(e) => setStandoffMm(+e.target.value)}>
                        {STANDOFF_OPTIONS_MM.map((mm) => <option key={mm} value={mm}>{mm} mm</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-fog">Printed with {printingLabel || "sticker / UV print"} on a {panelMm} mm acrylic panel, wall-mounted on advertising bolts. Bolts are covered by the per-sqft rate; mounting is set to wall automatically.</p>
                </div>
              )}
              {lettersOn && (
                <div className="rounded-xl border border-gold/40 bg-ink/30 p-3 space-y-3">
                  <p className={labelCls}>Live letters · type the client&apos;s text</p>
                  <textarea className={`${inputCls} min-h-16`} value={letterText} onChange={(e) => setLetterText(e.target.value)} placeholder="Client text (Enter = new line)" />
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Font (layout only)</label>
                      <select className={inputCls} value={letterFont} onChange={(e) => setLetterFont(e.target.value)}>
                        {LETTER_FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select></div>
                    <UnitField label="Letter height" value={letterHeightIn} unit={letterUnit} onUnit={setLetterUnit} fromBase={fromIn} toBase={toIn} onChange={setLetterHeightIn} minBase={1} inputCls={inputCls} labelCls={labelCls} />
                    {isLetters && !flatCut && <UnitField label="Return depth" value={letterDepthIn} unit={depthUnit} onUnit={setDepthUnit} fromBase={fromIn} toBase={toIn} onChange={setLetterDepthIn} minBase={0.5} inputCls={inputCls} labelCls={labelCls} />}
                    {isNeonText && <div><label className={labelCls}>Backing</label>
                      <select className={inputCls} value={neonBacking} onChange={(e) => setNeonBacking(e.target.value as "clear" | "black")}><option value="clear">Clear acrylic</option><option value="black">Black acrylic</option></select></div>}
                  </div>
                  {isLetters && (
                    <div className="space-y-3">
                      <ColorRow label="Letter face color" hint="White by default — tap any color or use + for a custom one." value={bodyColor} onChange={setBodyColor} />
                      <ColorRow label="Siding (returns) color" hint="The sides / depth of each letter." value={returnColor} onChange={setReturnColor} />
                    </div>
                  )}
                  {activePreset?.id === "ac-letters-lit" && (
                    <div className="grid grid-cols-2 gap-2">
                      {(["halo", "front"] as const).map((g) => (
                        <button key={g} onClick={() => setLetterGlow(g)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${letterGlow === g ? "border-gold bg-gold text-ink" : "border-line text-fog hover:border-gold"}`}>{g === "halo" ? "Halo (backlit)" : "Face-lit"}</button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-fog">Priced on the text box {boxW} × {boxH} ft = {(boxW * boxH).toFixed(2)} sqft. If the client&apos;s real font is wider or narrower, change Width / Height in Dimension to override.</p>
                </div>
              )}
              {activePreset?.kind === "neon" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Neon colors</label><input type="number" min={1} className={inputCls} value={neonColors} onChange={(e) => setNeonColors(Math.max(1, +e.target.value || 1))} /></div>
                  <div><label className={labelCls}>12V power supply ₱</label><input type="number" min={0} className={inputCls} value={psu} onChange={(e) => setPsu(+e.target.value || 0)} /></div>
                </div>
              )}

              <div>
                <label className={labelCls}>One side or both?</label>
                <div className="grid grid-cols-2 gap-2">
                  {SIDES_OPTIONS.map(([id, name, sub]) => (
                    <button key={id} onClick={() => setSides(id)} className={`rounded-xl border px-3 py-3 text-left transition ${sides === id ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>
                      <span className="block text-sm font-semibold">{name}</span>
                      <span className="block text-[11px] opacity-80">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Does it light up?</label>
                <div className="grid grid-cols-2 gap-2">
                  {LIGHTING_OPTIONS.map(([id, name]) => (
                    <button key={id} onClick={() => setLighting(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${lighting === id ? "border-teal bg-teal text-ink" : "border-line bg-ink/30 text-fog hover:border-teal"}`}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {def.printing && (
                <div>
                  <label className={labelCls}>How is the artwork printed?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRINTING_OPTIONS.map(([id, name]) => (
                      <button key={id} onClick={() => setPrinting(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold text-left transition ${printing === id ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>How does it attach?</label>
                <p className="text-[11px] text-fog mb-2">Pick the style that matches the job — works for rectangle and circle.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(["wall", "bracket", "hanging", "pole", "pole_single", "rooftop"] as Mount[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMounting(id)}
                      className={`rounded-xl border px-2 py-2.5 text-left transition flex flex-col items-center gap-1 ${
                        mounting === id ? "border-teal bg-teal text-ink" : "border-line bg-ink/30 text-fog hover:border-teal"
                      }`}
                    >
                      <MountIcon id={id} />
                      <span className="block text-[11px] font-semibold leading-tight text-center">{MOUNTING_LABELS[id]}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-fog leading-snug rounded-lg bg-ink/40 border border-line px-3 py-2">
                  {MOUNTING_HELP[mounting]}
                </p>
                {needsArms && (
                  <div className="mt-3">
                    <label className={labelCls}>Arms / supports</label>
                    <p className="text-[11px] text-fog mb-2">
                      Small round signs usually use <strong className="text-white">single arm</strong>. Larger boxes often need two.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setArmCount(1)}
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          armCount === 1 ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"
                        }`}
                      >
                        <span className="block text-sm font-semibold">Single arm</span>
                        <span className="block text-[11px] opacity-80">One support — good for small Ø / light signs</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setArmCount(2)}
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          armCount === 2 ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"
                        }`}
                      >
                        <span className="block text-sm font-semibold">Double arm</span>
                        <span className="block text-[11px] opacity-80">Two supports — steadier for larger signs</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Box + depth colors (letters and bolt panels have their own pickers in Build) */}
              {!isLetters && !isBoltPanel && (
                <>
                  <ColorRow label="Box / face color" hint="Front of the sign (what people see)." value={bodyColor} onChange={setBodyColor} />
                  <ColorRow label="Depth / returns color" hint="Sides of the box (clients often want black or white depth)." value={returnColor} onChange={setReturnColor} />
                </>
              )}

              <div className="flex justify-between pt-1 gap-2">
                <button type="button" onClick={() => setBuildStep(3)} className="rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-white">← Back</button>
                <button type="button" onClick={() => setBuildStep(5)} className="rounded-full bg-gold text-ink px-5 py-2 text-sm font-bold">Next · Logo →</button>
              </div>
            </div>
            )}

            {/* 5 · Logo */}
            {buildStep === 5 && (
            <div className={cardCls}>
              <div>
                <p className={stepCls}>5 · Logo (optional)</p>
                <h2 className="font-display text-lg font-bold">Put the client’s logo on the preview</h2>
                <p className="text-[11px] text-fog mt-0.5">Skip if you don’t have a logo yet — you can still quote. Use Remove white background for clear acrylic / cut-outs.</p>
              </div>
              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <input
                  className={inputCls}
                  value={logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    setLogoPreview("");
                    setLogoOriginal("");
                    setLogoBgCleared(false);
                  }}
                  placeholder="Paste logo image link (optional)"
                />
                <label className="rounded-xl border border-line bg-ink/30 px-4 py-2.5 text-sm font-semibold cursor-pointer text-center hover:border-teal">
                  Upload logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              {activeLogo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
                    <img src={activeLogo} alt="Client logo" className="h-16 w-32 object-contain" />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      {logoBgCleared ? (
                        <button
                          type="button"
                          onClick={restoreLogoBackground}
                          className="text-xs font-semibold text-teal text-left hover:underline"
                        >
                          Restore original
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={removeLogoWhiteBackground}
                          className="rounded-lg border border-gold/50 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20 text-left"
                        >
                          Remove white background
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrl("");
                          setLogoPreview("");
                          setLogoOriginal("");
                          setLogoBgCleared(false);
                          setLogoScaleW(90);
                          setLogoScaleH(90);
                        }}
                        className="text-xs text-red-500 text-left hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {logoBgCleared && (
                    <p className="text-[11px] text-fog">White / light background removed — logo is transparent for clear acrylic preview.</p>
                  )}
                  <div className="rounded-xl border border-line bg-ink/30 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-fog uppercase tracking-wider">Logo size on panel</p>
                    <p className="text-[11px] text-fog">Stretch W and H separately if the logo ratio doesn’t match the acrylic box. 100% = edge to edge.</p>
                    <label className="flex items-center gap-2 text-xs text-fog">
                      <span className="w-16 shrink-0">Width</span>
                      <input type="range" min={20} max={110} value={logoScaleW} onChange={(e) => setLogoScaleW(+e.target.value)} className="flex-1" />
                      <span className="w-10 text-right font-semibold text-white">{logoScaleW}%</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-fog">
                      <span className="w-16 shrink-0">Height</span>
                      <input type="range" min={20} max={110} value={logoScaleH} onChange={(e) => setLogoScaleH(+e.target.value)} className="flex-1" />
                      <span className="w-10 text-right font-semibold text-white">{logoScaleH}%</span>
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button type="button" onClick={() => { setLogoScaleW(100); setLogoScaleH(100); }} className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-fog hover:border-gold hover:text-white">
                        Fill panel (100%)
                      </button>
                      <button type="button" onClick={() => { setLogoScaleW(90); setLogoScaleH(90); }} className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-fog hover:border-gold hover:text-white">
                        Reset 90%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const m = Math.min(logoScaleW, logoScaleH);
                          setLogoScaleW(m);
                          setLogoScaleH(m);
                        }}
                        className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-fog hover:border-gold hover:text-white"
                      >
                        Lock square
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-1 gap-2">
                <button type="button" onClick={() => setBuildStep(4)} className="rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-white">← Back</button>
                <button type="button" onClick={() => setBuildStep(6)} className="rounded-full bg-gold text-ink px-5 py-2 text-sm font-bold">Next · Add →</button>
              </div>
            </div>
            )}

            {/* 6 · Add */}
            {buildStep === 6 && (
            <div className="rounded-2xl border border-gold/40 bg-panel p-5 space-y-3 ring-1 ring-gold/20">
              <div>
                <p className={stepCls}>6 · Add to quote</p>
                <h2 className="font-display text-lg font-bold">Ready? Add this sign</h2>
              </div>
              <div>
                <label className={labelCls}>Delivery type (whole quote)</label>
                <div className="grid grid-cols-3 gap-2">
                  {([["normal", "Normal", "Standard lead time"], ["rush", `Rush (+${rushPct}%)`, "Priority production"], ["shipping", "Shipping", "Shipping rate applies"]] as const).map(([id, name, sub]) => (
                    <button key={id} type="button" onClick={() => setDeliveryType(id)} className={`rounded-xl border px-3 py-2.5 text-left transition ${deliveryType === id ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>
                      <span className="block text-sm font-semibold">{name}</span>
                      <span className="block text-[11px] opacity-80">{sub}</span>
                    </button>
                  ))}
                </div>
                {deliveryType === "shipping" && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-fog">Shipping ₱</span>
                    <input type="number" min={0} value={shippingFee || ""} placeholder="Leave empty until the courier rate is known" onChange={(e) => setShippingFee(+e.target.value || 0)} className={inputCls} />
                  </div>
                )}
              </div>
              <textarea className={`${inputCls} min-h-16`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the client (e.g. includes install…)" />
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-xs text-fog">
                  <span className="block">{areaSqft.toFixed(2)} sqft · qty {qty}</span>
                  {live.hasTbd && <span className="text-amber-300">Price TBD — check Builder Settings rates</span>}
                </div>
                <button onClick={() => { addLine(); refreshSiteMockup(); }} className="rounded-full bg-gold text-ink px-7 py-3 font-bold text-base hover:bg-gold-dim shadow-lg shadow-gold/20">
                  Add to Quote · ₱{fmt(live.unitCost * qty)}
                </button>
              </div>
              <div className="flex justify-between pt-1 gap-2">
                <button type="button" onClick={() => setBuildStep(5)} className="rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-white">← Back</button>
                <button type="button" onClick={() => resetBuildForm()} className="rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-white">New sign · start over</button>
              </div>
            </div>
            )}

            {msg && <div className="rounded-xl border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal">{msg}</div>}
            </div>
          </section>

          {/* RIGHT — live 3D (desktop: stays in place / scrolls only within right column) */}
          <aside className="order-1 lg:order-2 space-y-3 min-h-0 lg:h-full lg:overflow-y-auto lg:sticky lg:top-20">
            <div className="rounded-2xl border border-line bg-panel overflow-hidden">
              <div className="px-4 py-2.5 border-b border-line flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Live 3D</p>
                  <p className="text-sm font-semibold">Updates as you build</p>
                </div>
                <span className="text-xs text-fog">
                  {isCircle ? `Ø ${fmtLen(diameter, dimUnit)}` : `${fmtLen(height, dimUnit)} H × ${fmtLen(width, dimUnit)} W`} · {fmtLen(thicknessIn / 12, depthUnit)} T
                </span>
              </div>
              <div className="h-[min(52vh,520px)] min-h-[360px] lg:h-[min(58vh,520px)]">
                <SignScene
                  ref={sceneRef}
                  widthFt={dimW}
                  heightFt={dimH}
                  shape={shape}
                  variant={variant}
                  service={serviceId}
                  doubleSided={sides === "double"}
                  lit={lit}
                  preview={isLightbox ? "lightbox" : "panaflex"}
                  traits={traits}
                  letters={lettersSpec}
                  bolts={boltSpec}
                  unit={dimUnit}
                  depthUnit={depthUnit}
                  text="Your Logo"
                  logoUrl={activeLogo}
                  logoScaleW={logoScaleW}
                  logoScaleH={logoScaleH}
                  showDimensions
                  faceLabel={faceLabel}
                  sidesLabel={sidesLabel}
                  mountLabel={mountingShown}
                  brackets={bracketCount}
                  printingLabel={printingLabel || undefined}
                />
              </div>
            </div>
            <p className="text-xs text-fog text-center px-2">
              Drag to rotate the preview. When you hit <strong className="text-white">Add to Quote</strong>, we save front, side &amp; 3D views with sizes for the client sheet.
            </p>

            {/* Live price card — always visible while building */}
            <div className="rounded-2xl border border-gold/30 bg-panel p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gold font-bold">This sign right now</p>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-2xl font-bold text-gold leading-none">₱{fmt(live.unitCost * qty)}</p>
                  <p className="text-[11px] text-fog mt-1">
                    {qty > 1 ? `${qty} × ₱${fmt(live.unitCost)}` : "per unit"} · {areaSqft.toFixed(1)} sqft
                  </p>
                </div>
                {lines.length > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-fog uppercase">Quote total</p>
                    <p className="text-lg font-bold">₱{fmt(grand)}</p>
                  </div>
                )}
              </div>
              {live.hasTbd && (
                <p className="text-[11px] text-amber-300">Rates not set — open Settings to fill prices.</p>
              )}
            </div>
          </aside>
        </div>

        {/* ── Site photo + place the 3D sign on it ── */}
        <div className="no-export mx-auto w-full max-w-[240mm] mb-4 rounded-2xl border border-line bg-white p-5 shadow-sm text-ink">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal/15 text-teal text-xs font-bold">+</span>
                Place the sign on the real photo
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xl">
                Upload a photo of the client’s wall or storefront, then <strong>tap where the sign goes</strong>. The 3D mockup sits on that point so they can see it in place.
              </p>
            </div>
            {!sitePhoto && (
              <span className="text-[10px] uppercase tracking-wider text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">Optional</span>
            )}
          </div>

          {!sitePhoto ? (
            <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-10 cursor-pointer hover:border-teal hover:bg-teal/5 transition">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { onSitePhotoFile(e.target.files?.[0] ?? null); setTimeout(refreshSiteMockup, 300); }} />
              <span className="text-sm text-gray-400 text-center">Tap to upload storefront / wall photo</span>
            </label>
          ) : (
            <div className="space-y-3">
              <div
                ref={sitePhotoRef}
                onClick={onSitePhotoClick}
                className="relative w-full rounded-xl overflow-hidden border border-gray-300 cursor-crosshair bg-gray-100 select-none"
                style={{ minHeight: 200 }}
              >
                <img src={sitePhoto} alt="Site" className="w-full h-auto block max-h-[360px] object-contain mx-auto" />
                {/* 3D sign overlay at pin — transparent render + stretch/skew */}
                {(siteMockup || lines[lines.length - 1]?.renders.iso) && (
                  <img
                    src={siteMockup || lines[lines.length - 1]?.renders.iso || ""}
                    alt="Sign placement"
                    className="absolute pointer-events-none drop-shadow-md"
                    style={{
                      left: `${pinPos.x}%`,
                      top: `${pinPos.y}%`,
                      width: `${pinScale}%`,
                      transform: `translate(-50%, -50%) scaleX(${pinStretchX / 100}) scaleY(${pinStretchY / 100}) skewX(${pinSkew}deg)`,
                      transformOrigin: "center center",
                      maxHeight: "50%",
                      objectFit: "contain",
                      background: "transparent",
                    }}
                  />
                )}
                {/* Pin marker */}
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-white bg-teal shadow-md pointer-events-none z-10"
                  style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%`, transform: "translate(-50%, -50%)" }}
                />
              </div>
              <p className="text-[11px] text-gray-500">Tap the photo to move the pin. Stretch / skew to match the wall angle.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                <label className="flex items-center gap-2">
                  Size
                  <input type="range" min={8} max={70} value={pinScale} onChange={(e) => setPinScale(+e.target.value)} className="flex-1" />
                  <span className="font-semibold w-10 text-right">{pinScale}%</span>
                </label>
                <label className="flex items-center gap-2">
                  Stretch W
                  <input type="range" min={50} max={160} value={pinStretchX} onChange={(e) => setPinStretchX(+e.target.value)} className="flex-1" />
                  <span className="font-semibold w-10 text-right">{pinStretchX}%</span>
                </label>
                <label className="flex items-center gap-2">
                  Stretch H
                  <input type="range" min={50} max={160} value={pinStretchY} onChange={(e) => setPinStretchY(+e.target.value)} className="flex-1" />
                  <span className="font-semibold w-10 text-right">{pinStretchY}%</span>
                </label>
                <label className="flex items-center gap-2">
                  Skew / curve
                  <input type="range" min={-25} max={25} value={pinSkew} onChange={(e) => setPinSkew(+e.target.value)} className="flex-1" />
                  <span className="font-semibold w-10 text-right">{pinSkew}°</span>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={refreshSiteMockup} className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50">
                  Refresh sign (no background)
                </button>
                <button
                  type="button"
                  onClick={() => { setPinStretchX(100); setPinStretchY(100); setPinSkew(0); setPinScale(28); }}
                  className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                >
                  Reset stretch
                </button>
                <button type="button" onClick={() => { setSitePhoto(""); setSiteMockup(""); }} className="text-xs text-red-500 hover:underline">
                  Remove photo
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-gray-500 mb-1">How it mounts</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(["storefront", "wall", "bracket", "pole", "rooftop", "other"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlacementType(p)}
                      className={`rounded-xl border px-2.5 py-2 text-[12px] font-medium text-left transition ${
                        placementType === p
                          ? "border-teal bg-teal/10 text-ink ring-1 ring-teal/30"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {PLACEMENT_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={placementNote}
                onChange={(e) => setPlacementNote(e.target.value)}
                placeholder="e.g. above the main door, facing the street"
              />
            </div>
          )}
        </div>

        {/* BOTTOM — client-ready proposal sheet (export target) */}
        <section
          ref={quoteSheetRef}
          className="quote-sheet mx-auto w-full max-w-[240mm] rounded-2xl border border-gray-300 bg-white text-ink overflow-hidden shadow-lg font-sans"
          style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
        >
          {/* Friendly header — logo only (dwlogo already has company name) */}
          <div className="bg-[#011424] text-white px-5 py-3.5 flex items-center justify-between gap-4">
            <Image src="/dwlogo.png" alt="Delight Works Advertising Signages" width={220} height={52} className="h-10 w-auto object-contain" />
            <div className="text-center flex-1 hidden sm:block">
              <p className="text-[10px] uppercase tracking-[0.15em] text-fog">Sign proposal</p>
              <p className="font-bold text-gold text-lg leading-tight">{quoteNo}</p>
            </div>
            <div className="text-right text-xs leading-snug">
              <p className="font-semibold text-gold sm:hidden">{quoteNo}</p>
              <p className="text-fog">{today()}</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {lines.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12 no-export">
                Your quote is empty. Build a sign above, then hit <strong>Add to Quote</strong>. The proposal with 3D views will show here — ready to download and send.
              </p>
            ) : (
              lines.map((l, idx) => {
                const lu = l.unit ?? "ft";
                const sizeFt = l.shape === "circle" ? `Ø ${ft(l.diameter)} ft` : `${ft(l.width)} × ${ft(l.height)} ft`;
                const size = lu === "ft" ? sizeFt : `${l.shape === "circle" ? `Ø ${fmtLen(l.diameter, lu)}` : `${fmtLen(l.width, lu)} × ${fmtLen(l.height, lu)}`} (${sizeFt})`;
                return (
                  <div key={l.id} className="rounded-xl border border-gray-300 overflow-hidden">
                    <div className="flex items-center justify-between gap-2 bg-[#f0f4f8] px-3 py-2 border-b border-gray-300">
                      <p className="text-sm font-bold">
                        {idx + 1}. {l.signName}
                        <span className="font-normal text-gray-500 ml-1.5 text-xs">{shapeLabel(l.shape)} · {size}</span>
                      </p>
                      <p className="text-sm font-bold text-[#011424]">₱{fmt(l.unitCost * l.qty)}</p>
                    </div>

                    {/* Multi-view — clear labels for clients */}
                    <div className="grid grid-cols-12 gap-0 bg-white">
                      <div className="col-span-5 sm:col-span-5 border-r border-gray-200 p-2 bg-[#fafbfc]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">3D preview</p>
                        {l.renders.iso ? (
                          <img src={l.renders.iso} alt="3D" className="w-full h-40 object-contain bg-white rounded-lg border border-gray-100" />
                        ) : (
                          <div className="h-40 flex items-center justify-center text-xs text-gray-400 border border-gray-100 rounded-lg bg-white">—</div>
                        )}
                      </div>
                      <div className="col-span-7 flex flex-col">
                        <div className="flex gap-2 p-2 border-b border-gray-200">
                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Front</p>
                            {l.renders.front ? (
                              <img src={l.renders.front} alt="Front" className="w-full h-24 object-contain bg-white rounded border border-gray-100" />
                            ) : (
                              <div className="h-24 flex items-center justify-center text-xs text-gray-400 border border-gray-100 rounded bg-white">—</div>
                            )}
                          </div>
                          <div className="w-[36%]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Side</p>
                            {l.renders.side ? (
                              <img src={l.renders.side} alt="Side" className="w-full h-24 object-contain bg-white rounded border border-gray-100" />
                            ) : (
                              <div className="h-24 flex items-center justify-center text-xs text-gray-400 border border-gray-100 rounded bg-white">—</div>
                            )}
                          </div>
                        </div>
                        <div className="p-2.5 text-[11px] leading-snug grow">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5">
                            <div><span className="text-gray-500 text-[9px] uppercase">Size</span><br /><strong>{size}</strong></div>
                            <div><span className="text-gray-500 text-[9px] uppercase">Depth</span><br /><strong>{fmtLen(l.thicknessIn / 12, l.depthUnit ?? "in")}</strong></div>
                            <div><span className="text-gray-500 text-[9px] uppercase">Area</span><br /><strong>{l.areaSqft.toFixed(2)} sqft</strong></div>
                            <div><span className="text-gray-500 text-[9px] uppercase">Qty</span><br /><strong>{l.qty}</strong></div>
                            <div className="col-span-2"><span className="text-gray-500 text-[9px] uppercase">Material</span><br /><strong>{l.face}</strong></div>
                            <div><span className="text-gray-500 text-[9px] uppercase">Lighting</span><br /><strong>{l.lighting}</strong></div>
                            <div><span className="text-gray-500 text-[9px] uppercase">Print</span><br /><strong>{l.printing || "—"}</strong></div>
                            <div className="col-span-2 sm:col-span-4"><span className="text-gray-500 text-[9px] uppercase">Mounting</span><br /><strong>{l.mounting}</strong></div>
                          </div>
                          {l.note && <p className="mt-1.5 text-[10px] text-gray-600 border-t border-gray-100 pt-1"><strong>Note:</strong> {l.note}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="no-export px-3 py-1.5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                      <button onClick={() => removeLine(l.id)} className="text-red-500 text-xs hover:underline">Remove</button>
                      <span className="text-[10px] text-gray-400">Item {idx + 1} of {lines.length}</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Site photo on sheet — with 3D placed on photo */}
            {(sitePhoto || placementNote) && (
              <div className="rounded-xl border border-gray-300 overflow-hidden">
                <div className="bg-[#f0f4f8] px-3 py-2 border-b border-gray-300">
                  <p className="text-sm font-bold">Where it will be installed</p>
                </div>
                <div className="grid grid-cols-12 gap-0">
                  <div className="col-span-7 p-2 bg-[#fafbfc] border-r border-gray-200">
                    {sitePhoto ? (
                      <div className="relative w-full rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                        <img src={sitePhoto} alt="Site" className="w-full h-auto max-h-48 object-contain mx-auto block" />
                        {(siteMockup || lines[lines.length - 1]?.renders.iso) && (
                          <img
                            src={siteMockup || lines[lines.length - 1]?.renders.iso || ""}
                            alt="Sign on site"
                            className="absolute"
                            style={{
                              left: `${pinPos.x}%`,
                              top: `${pinPos.y}%`,
                              width: `${pinScale}%`,
                              transform: `translate(-50%, -50%) scaleX(${pinStretchX / 100}) scaleY(${pinStretchY / 100}) skewX(${pinSkew}deg)`,
                              transformOrigin: "center center",
                              objectFit: "contain",
                              background: "transparent",
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="h-36 flex items-center justify-center text-xs text-gray-400 border border-gray-100 rounded-lg bg-white">No photo</div>
                    )}
                  </div>
                  <div className="col-span-5 p-3 text-[12px] space-y-2">
                    <p>
                      <span className="text-gray-500 text-[9px] uppercase tracking-wider">Installation</span><br />
                      <strong className="text-base">{PLACEMENT_LABELS[placementType]}</strong>
                    </p>
                    {placementNote && (
                      <p>
                        <span className="text-gray-500 text-[9px] uppercase tracking-wider">Details</span><br />
                        <strong>{placementNote}</strong>
                      </p>
                    )}
                    <p className="text-[10px] text-gray-500 border-t border-gray-100 pt-1.5">
                      Sign shown in proposed position. Final measure on site.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Simple terms */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-[10px] text-gray-600 leading-relaxed">
              <p className="font-bold text-[11px] text-gray-700 mb-1">Good to know</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Sizes shown in feet. Final measure on site before production.</li>
                <li>Price includes the options listed above. Install / permit fees quoted separately if needed.</li>
                <li>This is a proposal — not a final invoice until confirmed.</li>
              </ul>
              {qs.terms?.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                  {qs.terms.map((t, i) => <p key={i}>• {t}</p>)}
                </div>
              )}
            </div>
          </div>

          {/* Totals + prepared by */}
          <div className="border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 text-[11px]">
            <div className="p-3 border-b sm:border-b-0 sm:border-r border-gray-200">
              <p className="text-gray-500 uppercase tracking-wider text-[9px]">Prepared by</p>
              <p className="font-semibold text-sm mt-0.5">{preparedBy || "—"}</p>
              <p className="text-gray-500">{qs.preparedByTitle}</p>
              <div className="no-export mt-1.5">
                <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-full" placeholder="Your name" />
              </div>
            </div>
            <div className="p-3 border-b sm:border-b-0 sm:border-r border-gray-200">
              <p className="text-gray-500 uppercase tracking-wider text-[9px]">Price summary</p>
              <div className="mt-1 space-y-0.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">₱{fmt(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>−₱{fmt(discount)}</span></div>}
                {rush > 0 && <div className="flex justify-between"><span className="text-gray-500">Rush order (+{rushPct}%)</span><span>₱{fmt(rush)}</span></div>}
                {deliveryType === "shipping" && <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{shipping > 0 ? `₱${fmt(shipping)}` : "Rate to be advised"}</span></div>}
                {mobil > 0 && <div className="flex justify-between"><span className="text-gray-500">Mobilization (travel)</span><span>₱{fmt(mobil)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-1 mt-1">
                  <span>Total</span><span className="text-[#011424]">₱{fmt(grand)}</span>
                </div>
                <p className="text-[10px] text-gray-500 text-right">VAT not included · added on the Official Receipt</p>
              </div>
              <div className="no-export mt-1.5 flex items-center gap-1.5">
                <span className="text-gray-500 text-[10px]">Discount ₱</span>
                <input type="number" min={0} value={discount} onChange={(e) => setDiscount(+e.target.value || 0)} className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-right text-xs" />
              </div>
              <div className="no-export mt-1.5 flex items-center gap-1.5">
                <span className="text-gray-500 text-[10px]">Delivery</span>
                <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as "normal" | "rush" | "shipping")} className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                  <option value="normal">Normal</option>
                  <option value="rush">Rush (+{rushPct}%)</option>
                  <option value="shipping">Shipping</option>
                </select>
                {deliveryType === "shipping" && <input type="number" min={0} value={shippingFee || ""} placeholder="₱" onChange={(e) => setShippingFee(+e.target.value || 0)} className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-right text-xs" />}
              </div>
              <div className="no-export mt-1.5 flex items-center gap-1.5">
                <span className="text-gray-500 text-[10px]">Mobilization ₱</span>
                <input type="number" min={0} value={mobil} onChange={(e) => setMobilization(+e.target.value || 0)} className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-right text-xs" />
              </div>
            </div>
            <div className="p-3">
              <p className="text-gray-500 uppercase tracking-wider text-[9px]">Next step</p>
              <p className="mt-1 text-sm font-semibold">Reply to confirm or request changes.</p>
              <p className="text-gray-500 text-[10px] mt-1">Quote no. {quoteNo}</p>
            </div>
          </div>

          <div className="no-export px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Draft name</label>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Name this quote to find it later"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
              <p className="text-[10px] text-gray-400 pb-1.5">
                {editingDraftId ? "Will update existing draft" : "New draft"}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500">Download = send to client. Save draft = edit later via My drafts.</p>
              <div className="flex flex-wrap gap-2">
                <button disabled={exporting || lines.length === 0} onClick={() => downloadImage("jpeg")} className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-bold text-ink hover:bg-white disabled:opacity-50">
                  Download JPG
                </button>
                <button disabled={exporting || lines.length === 0} onClick={() => downloadImage("png")} className="rounded-full bg-gold text-ink px-5 py-2.5 text-sm font-bold hover:bg-gold-dim disabled:opacity-50">
                  {exporting ? "Exporting…" : "Download PNG"}
                </button>
                <button
                  disabled={saving || lines.length === 0 || !draftName.trim()}
                  onClick={saveQuote}
                  title={!draftName.trim() ? "Enter a draft name first" : undefined}
                  className="rounded-full bg-teal text-ink px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingDraftId ? "Update draft" : "Save draft"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
