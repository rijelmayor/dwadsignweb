"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_SIGN_TYPES, mergeCatalog, type SignType } from "@/lib/catalog";
import { DEFAULT_QUOTE_SETTINGS, mergeQuoteSettings, type QuoteSettings } from "@/lib/settings";
import { deriveTraits, type Traits } from "@/lib/traits";
import { site } from "@/lib/site";
import type { SignSceneHandle } from "@/components/SignScene";

const SignScene = dynamic(() => import("@/components/SignScene"), { ssr: false });

type Shape = "rect" | "circle";
type ServiceId = "panaflex" | "lightbox-round";
type LbBuild = "builtup" | "acrylic";

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

const LB_MAX_FT = 3;

/** Category services. Add a new service here (+ pricing in settings) to extend the builder. */
const SERVICES: { id: ServiceId; name: string; sub: string; shapes: Shape[] }[] = [
  { id: "panaflex", name: "Panaflex", sub: "Face · lighting · printing", shapes: ["rect", "circle"] },
  { id: "lightbox-round", name: "Lightbox Round", sub: `Max ${LB_MAX_FT} ft diameter`, shapes: ["circle"] },
];
const LB_BUILDS: [LbBuild, string, string][] = [
  ["builtup", "Built-up", "Metal returns, lit face"],
  ["acrylic", "Acrylic build", "Acrylic body, lit face"],
];
const MOUNTING_LABELS: Record<string, string> = { wall: "Wall-mounted", pole: "Pole / freestanding", rooftop: "Rooftop with steel support" };

const FACE_OPTIONS = [
  ["panaflex", "Panaflex"], ["tarp", "Tarp"], ["apc", "APC"], ["acrylic", "Acrylic"], ["metal", "Metal Sheet"], ["custom", "Custom Build Face"],
] as const;
const LIGHTING_OPTIONS = [["without", "Without Light"], ["with", "With Light"]] as const;
const PRINTING_OPTIONS = [["sticker", "Sticker print"], ["direct", "Direct print to materials"], ["uv", "UV print"]] as const;

const ft = (n: number) => `${Math.round(n * 100) / 100}`;
function fmt(n: number) { return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function today() { return new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }); }
function labelOf(options: readonly (readonly [string, string])[], id: string) { return options.find(([v]) => v === id)?.[1] ?? id; }

export default function QuoteBuilder() {
  const [catalog, setCatalog] = useState<SignType[]>(DEFAULT_SIGN_TYPES);
  const [qs, setQs] = useState<QuoteSettings>(DEFAULT_QUOTE_SETTINGS);
  const [shape, setShape] = useState<Shape>("rect");
  const [serviceId, setServiceId] = useState<ServiceId>("panaflex");
  const [lbBuild, setLbBuild] = useState<LbBuild>("builtup");
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(2);
  const [diameter, setDiameter] = useState(2);
  const [thicknessIn, setThicknessIn] = useState(2);
  const [qty, setQty] = useState(1);
  const [face, setFace] = useState("panaflex");
  const [lighting, setLighting] = useState("without");
  const [printing, setPrinting] = useState("sticker");
  const [mounting, setMounting] = useState("wall");
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
  const sceneRef = useRef<SignSceneHandle>(null);
  const quoteSheetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      setSupabaseOk(!!sb);
      if (!sb) return;
      const { data } = await sb.from("site_settings").select("key,value").in("key", ["catalog", "quote"]);
      for (const row of data ?? []) {
        if (row.key === "catalog") setCatalog(mergeCatalog(row.value));
        if (row.key === "quote") setQs(mergeQuoteSettings(row.value));
      }
    }
    load();
  }, []);

  const isCircle = shape === "circle";
  const isLightbox = serviceId === "lightbox-round";
  const service = SERVICES.find((x) => x.id === serviceId) ?? SERVICES[0];
  const panaflexType = catalog.find((x) => x.id === "panaflex") ?? catalog[0];
  const dimW = isCircle ? diameter : width;
  const dimH = isCircle ? diameter : height;
  const areaSqft = Math.max(0, isCircle ? Math.PI * (diameter / 2) ** 2 : width * height);
  const activeLogo = logoPreview || logoUrl || undefined;
  const lbBuildLabel = LB_BUILDS.find(([id]) => id === lbBuild)?.[1] ?? "";
  const faceLabel = isLightbox ? `Lightbox Round · ${lbBuildLabel}` : labelOf(FACE_OPTIONS, face);
  const lightingLabel = isLightbox ? "Internal LED (always lit)" : labelOf(LIGHTING_OPTIONS, lighting);
  const printingLabel = isLightbox ? "" : labelOf(PRINTING_OPTIONS, printing);
  const variant = isLightbox ? lbBuild : "panaflex";

  const traits = useMemo(() => {
    if (isLightbox) {
      return { frameThickness: Math.max(0.04, thicknessIn / 12), metal: "aluminum", light: "internal", mount: mounting === "pole" ? "pole" : "wall", material: "acrylic", backing: "clear" } as Traits;
    }
    return panaflexType ? deriveTraits(panaflexType, { lighting, mounting, face }, thicknessIn) : null;
  }, [isLightbox, panaflexType, lighting, mounting, face, thicknessIn]);

  const live = useMemo(() => {
    const markup = 1 + qs.markupPct / 100;
    if (isLightbox) {
      const lb = qs.lightboxRoundPricing;
      const rate = lbBuild === "builtup" ? lb.builtUp : lb.acrylic;
      const rates = { construction: rate, face: 0, lighting: 0, printing: 0 };
      const raw = rate * areaSqft;
      return { rates, raw, unitCost: Math.max(lb.minimumCharge || 0, raw * markup), hasTbd: rate <= 0 };
    }
    const p = qs.panaflexPricing;
    const rates = { construction: p.constructionPerSqft, face: p.face[face] ?? 0, lighting: p.lighting[lighting] ?? 0, printing: p.printing[printing] ?? 0 };
    const raw = (rates.construction + rates.face + rates.lighting + rates.printing) * areaSqft;
    return { rates, raw, unitCost: Math.max(p.minimumCharge || 0, raw * markup), hasTbd: Object.values(rates).some((v) => v <= 0) && raw === 0 };
  }, [qs, isLightbox, lbBuild, face, lighting, printing, areaSqft]);

  const pickShape = (next: Shape) => {
    setShape(next);
    if (next === "rect" && isLightbox) { setServiceId("panaflex"); setThicknessIn(2); }
  };
  const pickService = (id: ServiceId) => {
    setServiceId(id);
    if (id === "lightbox-round") {
      setShape("circle");
      setDiameter((d) => Math.min(d, LB_MAX_FT));
      setThicknessIn(4);
      if (mounting === "rooftop") setMounting("wall");
    } else {
      setThicknessIn(2);
    }
  };

  const onLogoFile = (file: File | null) => {
    if (!file) { setLogoPreview(""); return; }
    const reader = new FileReader(); reader.onload = () => setLogoPreview(String(reader.result || "")); reader.readAsDataURL(file);
  };

  const addLine = () => {
    if (!traits || areaSqft <= 0) return;
    const renders = {
      front: sceneRef.current?.captureFront() ?? null,
      side: sceneRef.current?.captureSide() ?? null,
      iso: sceneRef.current?.captureIso() ?? null,
    };
    const r = live.rates;
    setLines((prev) => [...prev, {
      id: crypto.randomUUID(), serviceId, signName: isLightbox ? "Lightbox Round" : "Panaflex Sign", shape,
      width: dimW, height: dimH, diameter, thicknessIn, areaSqft, qty,
      face: faceLabel, lighting: lightingLabel, printing: printingLabel, mounting, note, unitCost: live.unitCost,
      breakdown: {
        construction: r.construction * areaSqft, face: r.face * areaSqft, lighting: r.lighting * areaSqft, printing: r.printing * areaSqft,
        markup: live.unitCost - (r.construction + r.face + r.lighting + r.printing) * areaSqft,
      },
      hasTbd: live.hasTbd, renders, logoUrl: activeLogo,
    }]);
    setNote(""); setMsg("Item added · front, side & 3D renders captured ✓"); setTimeout(() => setMsg(""), 2500);
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));
  const subtotal = lines.reduce((s, l) => s + l.unitCost * l.qty, 0);
  const afterDisc = Math.max(0, subtotal - discount);
  const vat = afterDisc * (qs.vatPct / 100);
  const grand = afterDisc + vat;
  const quoteNo = `${qs.quotePrefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(lines.length || 1).padStart(2, "0")}`;

  const saveQuote = useCallback(async () => {
    setSaving(true); setMsg(""); const sb = createClient();
    if (!sb) { setMsg("Supabase is not configured."); setSaving(false); return; }
    const payload = {
      quote_no: quoteNo, client,
      lines: lines.map((l) => ({ ...l, amount: l.unitCost * l.qty })),
      totals: { sub: subtotal, discount, vat, grand, preparedBy, preparedByTitle: qs.preparedByTitle }, status: "draft",
    };
    const { error } = await sb.from("quotes").insert(payload);
    setMsg(error ? `Save failed: ${error.message}` : "Saved to Supabase ✓"); setSaving(false);
  }, [quoteNo, client, lines, subtotal, discount, vat, grand, preparedBy, qs.preparedByTitle]);

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
      const options = { pixelRatio: Math.max(1.5, 1600 / w), backgroundColor: "#ffffff", width: w, height: h, quality: format === "jpeg" ? 0.92 : 1 };
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
  const angleTag = "text-[9px] font-bold uppercase tracking-wider text-black px-2 pt-1.5";

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/"><Image src="/logo-mark.png" alt="DW" width={120} height={58} className="h-8 w-auto" /></Link>
            <span className="font-display font-bold text-sm hidden sm:inline">
              Quote Builder <span className="text-fog font-normal">· {site.name}</span>
            </span>
            {supabaseOk === false && (
              <span className="text-[10px] rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/40">Supabase offline</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Link href="/buildersettings" className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:border-teal hover:text-white">
              Builder Settings
            </Link>
            <button onClick={downloadMockupOnly} className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:border-teal hover:text-white">
              3D Render JPG
            </button>
            <button disabled={exporting} onClick={() => downloadImage("jpeg")} className="rounded-full border border-gold/50 px-4 py-2 text-xs font-bold text-gold hover:bg-gold/10 disabled:opacity-50">
              Download JPG
            </button>
            <button disabled={exporting} onClick={() => downloadImage("png")} className="rounded-full bg-gold text-ink px-4 py-2 text-xs font-bold hover:bg-gold-dim disabled:opacity-50">
              {exporting ? "Exporting…" : "Download PNG"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] p-4 lg:p-6 space-y-6">
        {/* TOP: Builder (left) + live 3D (right, sticky) */}
        <div className="grid lg:grid-cols-[minmax(380px,0.9fr)_minmax(480px,1.1fr)] gap-6 items-start">
          {/* LEFT — controls */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-line bg-panel p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">{service.name}{isLightbox ? ` · ${lbBuildLabel}` : ""}</p>
              <h1 className="font-display text-2xl font-bold">Sign Builder</h1>
              <p className="text-sm text-fog mt-1">Pick the shape, choose the service, then set size. Live 3D updates on the right.</p>
            </div>

            {/* 1 · Shape */}
            <div className={cardCls}>
              <div>
                <p className={stepCls}>1 · Shape</p>
                <h2 className="font-display text-lg font-bold">What are we building today?</h2>
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
            </div>

            {/* 2 · Service / material */}
            <div className={cardCls}>
              <div>
                <p className={stepCls}>2 · Service</p>
                <h2 className="font-display text-lg font-bold">Material type</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {SERVICES.map((sv) => {
                  const allowed = sv.shapes.includes(shape);
                  const active = serviceId === sv.id;
                  return (
                    <button
                      key={sv.id}
                      disabled={!allowed}
                      onClick={() => pickService(sv.id)}
                      className={`rounded-xl border px-4 py-3.5 text-left transition ${active ? "border-teal bg-teal text-ink" : "border-line bg-ink/30 text-fog hover:border-teal"} ${!allowed ? "opacity-40 cursor-not-allowed hover:border-line" : ""}`}
                    >
                      <span className="block font-bold text-sm">{sv.name}</span>
                      <span className="block text-[11px] opacity-80">{allowed ? sv.sub : "Circle shape only"}</span>
                    </button>
                  );
                })}
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
            </div>

            {/* 3 · Dimensions */}
            <div className={cardCls}>
              <div>
                <p className={stepCls}>3 · Dimensions</p>
                <h2 className="font-display text-lg font-bold">Sign size</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {isCircle ? (
                  <div className="col-span-2">
                    <label className={labelCls}>Diameter (ft){isLightbox ? ` · max ${LB_MAX_FT}` : ""}</label>
                    <input type="number" min={0.1} max={isLightbox ? LB_MAX_FT : undefined} step={0.1} value={diameter}
                      onChange={(e) => setDiameter(Math.min(isLightbox ? LB_MAX_FT : Infinity, Math.max(0.1, +e.target.value || 0)))} className={inputCls} />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={labelCls}>Height (ft)</label>
                      <input type="number" min={0.1} step={0.1} value={height} onChange={(e) => setHeight(Math.max(0.1, +e.target.value || 0))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Width (ft)</label>
                      <input type="number" min={0.1} step={0.1} value={width} onChange={(e) => setWidth(Math.max(0.1, +e.target.value || 0))} className={inputCls} />
                    </div>
                  </>
                )}
                <div>
                  <label className={labelCls}>Thickness (in)</label>
                  <input type="number" min={0.25} step={0.25} value={thicknessIn} onChange={(e) => setThicknessIn(Math.max(0.25, +e.target.value || 0))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-ink/50 border border-line px-2 py-2">
                  <span className="text-fog block">Area</span>
                  <strong>{areaSqft.toFixed(2)} sqft</strong>
                </div>
                <div className="rounded-lg bg-ink/50 border border-line px-2 py-2">
                  <span className="text-fog block">Thickness</span>
                  <strong>{thicknessIn}&quot;</strong>
                </div>
                <div className="rounded-lg bg-ink/50 border border-line px-2 py-2">
                  <span className="text-fog block">Qty</span>
                  <input className="bg-transparent text-center w-full outline-none font-bold" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} />
                </div>
              </div>
            </div>

            {/* 4 · Build */}
            <div className={cardCls}>
              <div>
                <p className={stepCls}>4 · Build</p>
                <h2 className="font-display text-lg font-bold">{isLightbox ? "Lightbox & mounting" : "Face, lighting & printing"}</h2>
              </div>
              {!isLightbox && (
                <>
                  <div>
                    <label className={labelCls}>Face</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {FACE_OPTIONS.map(([id, name]) => (
                        <button key={id} onClick={() => setFace(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold text-left transition ${face === id ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Lighting</label>
                    <div className="grid grid-cols-2 gap-2">
                      {LIGHTING_OPTIONS.map(([id, name]) => (
                        <button key={id} onClick={() => setLighting(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${lighting === id ? "border-teal bg-teal text-ink" : "border-line bg-ink/30 text-fog hover:border-teal"}`}>
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Printing</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {PRINTING_OPTIONS.map(([id, name]) => (
                        <button key={id} onClick={() => setPrinting(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${printing === id ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {isLightbox && (
                <p className="text-xs text-fog rounded-lg bg-ink/50 border border-line px-3 py-2">
                  {lbBuildLabel} lightbox · internally lit by LED. Priced by circle area from Builder Settings.
                </p>
              )}
              <div>
                <label className={labelCls}>Mounting</label>
                <select value={mounting} onChange={(e) => setMounting(e.target.value)} className={inputCls}>
                  <option value="wall">Wall-mounted</option>
                  <option value="pole">Pole / freestanding</option>
                  {!isLightbox && <option value="rooftop">Rooftop with steel support</option>}
                </select>
              </div>
            </div>

            {/* 5 · Branding */}
            <div className={cardCls}>
              <div>
                <p className={stepCls}>5 · Branding</p>
                <h2 className="font-display text-lg font-bold">Client logo / design</h2>
              </div>
              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <input className={inputCls} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo / design image URL (optional)" />
                <label className="rounded-xl border border-line bg-ink/30 px-4 py-2.5 text-sm font-semibold cursor-pointer text-center hover:border-teal">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              {activeLogo && (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
                  <img src={activeLogo} alt="Client logo" className="h-16 w-32 object-contain" />
                  <button onClick={() => { setLogoUrl(""); setLogoPreview(""); }} className="text-xs text-red-500">Clear</button>
                </div>
              )}
            </div>

            {/* 6 · Notes */}
            <div className="rounded-2xl border border-line bg-panel p-5 space-y-3">
              <p className={stepCls}>6 · Notes</p>
              <textarea className={`${inputCls} min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional fabrication / installation note" />
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-xs text-fog">{areaSqft.toFixed(2)} sqft × rates + {qs.markupPct}% markup</div>
                <button onClick={addLine} className="rounded-full bg-gold text-ink px-6 py-2.5 font-bold hover:bg-gold-dim">
                  Add to Quote · ₱{fmt(live.unitCost)}
                </button>
              </div>
            </div>

            {msg && <div className="rounded-xl border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal">{msg}</div>}
          </section>

          {/* RIGHT — live 3D (sticky while building) */}
          <aside className="lg:sticky lg:top-20 space-y-3">
            <div className="rounded-2xl border border-line bg-panel overflow-hidden">
              <div className="px-4 py-2.5 border-b border-line flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Live 3D</p>
                  <p className="text-sm font-semibold">Updates as you build</p>
                </div>
                <span className="text-xs text-fog">
                  {isCircle ? `Ø ${ft(diameter)}'` : `${ft(height)}' H × ${ft(width)}' W`} · {thicknessIn}&quot; T
                </span>
              </div>
              <div className="h-[min(62vh,560px)] min-h-[420px]">
                {traits && (
                  <SignScene
                    ref={sceneRef}
                    widthFt={dimW}
                    heightFt={dimH}
                    shape={shape}
                    variant={variant}
                    lit={isLightbox || lighting === "with"}
                    preview={isLightbox ? "lightbox" : "panaflex"}
                    traits={traits}
                    text="Your Logo"
                    logoUrl={activeLogo}
                    showDimensions
                    faceLabel={faceLabel}
                    printingLabel={printingLabel || undefined}
                  />
                )}
              </div>
            </div>
            <p className="text-xs text-fog text-center px-2">
              Black dimension labels · full-bleed logo · bulb = lit. Rotate with mouse. Add to Quote captures front, side &amp; 3D.
            </p>
          </aside>
        </div>

        {/* BOTTOM — compact quotation sheet (export target, fits its content) */}
        <section
          ref={quoteSheetRef}
          className="quote-sheet mx-auto w-full max-w-[210mm] rounded-2xl border border-line bg-white text-ink overflow-hidden shadow-lg"
        >
          <div className="bg-[#011424] text-white px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo-mark.png" alt="DW" width={100} height={48} className="h-8 w-auto" />
              <div>
                <p className="font-display font-bold text-base leading-tight">Delight Works</p>
                <p className="text-[10px] text-fog tracking-widest uppercase">{site.descriptor}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-gold text-base leading-tight">{quoteNo}</p>
              <p className="text-xs text-fog">{today()}</p>
            </div>
          </div>

          <div className="px-5 py-3">
            {lines.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 no-export">
                Add a sign from the builder above. Its 3 renders (front · side · 3D) with dimensions will appear here.
              </p>
            ) : (
              lines.map((l) => {
                const size = l.shape === "circle" ? `Ø ${ft(l.diameter)} ft` : `${ft(l.width)} W × ${ft(l.height)} H ft`;
                const cells: [string, string][] = [
                  ["Size", size],
                  ["Thickness", `${l.thicknessIn}"`],
                  ["Area", `${l.areaSqft.toFixed(2)} sqft`],
                  ["Qty", String(l.qty)],
                  ["Face / Build", l.face],
                  ["Lighting", l.lighting],
                  ["Printing", l.printing || "—"],
                  ["Mounting", MOUNTING_LABELS[l.mounting] ?? l.mounting],
                ];
                return (
                  <div key={l.id} className="mb-3 last:mb-0 border border-gray-300 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between gap-3 bg-[#eef2f6] px-3 py-1.5 border-b border-gray-300">
                      <p className="text-sm font-bold">{l.signName} <span className="font-normal text-gray-500">· {shapeLabel(l.shape)}</span></p>
                      <p className="text-sm font-bold">₱{fmt(l.unitCost * l.qty)}</p>
                    </div>
                    <div className="grid grid-cols-3 bg-[#f0f3f6]">
                      {([["Front", l.renders.front], ["Side · thickness", l.renders.side], ["3D view", l.renders.iso]] as const).map(([cap, src], i) => (
                        <div key={cap} className={i < 2 ? "border-r border-gray-300" : ""}>
                          <p className={angleTag}>{cap}</p>
                          {src ? <img src={src} alt={cap} className="w-full h-40 object-contain" /> : <div className="h-40 flex items-center justify-center text-xs text-gray-400">—</div>}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 border-t border-gray-300 text-[11px]">
                      {cells.map(([k, v], i) => (
                        <div key={k} className={`px-2 py-1.5 ${i % 4 !== 3 ? "border-r" : ""} ${i < 4 ? "border-b" : ""} border-gray-200`}>
                          <span className="block text-[9px] uppercase tracking-wider text-gray-500">{k}</span>
                          <strong className="text-black leading-tight">{v}</strong>
                        </div>
                      ))}
                    </div>
                    {l.note && <p className="text-[11px] text-gray-600 px-3 py-1.5 border-t border-gray-200">Note: {l.note}</p>}
                    <div className="no-export px-3 pb-1.5">
                      <button onClick={() => removeLine(l.id)} className="text-red-500 text-xs hover:underline">Remove</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-5 py-2 border-t border-gray-200 text-sm ml-auto max-w-xs space-y-0.5">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₱{fmt(subtotal)}</span></div>
            <div className="flex justify-between items-center no-export">
              <span className="text-gray-500">Discount</span>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(+e.target.value || 0)} className="w-28 border border-gray-200 rounded px-2 py-0.5 text-right text-sm" />
            </div>
            {discount > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>−₱{fmt(discount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">VAT ({qs.vatPct}%)</span><span>₱{fmt(vat)}</span></div>
            <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-200">
              <span>Grand Total</span>
              <span>₱{fmt(grand)}</span>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-gray-50 text-[10px] text-gray-600 space-y-0.5">
            {qs.terms.map((t, i) => <p key={i}>• {t}</p>)}
            <div className="pt-2 flex justify-between items-end">
              <div className="no-export">
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-gray-500 mb-0.5">Prepared by</label>
                <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-sm w-40" placeholder="Your name" />
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink text-xs">{preparedBy || "—"}</p>
                <p>{qs.preparedByTitle}</p>
              </div>
            </div>
          </div>

          <div className="no-export px-5 py-3 flex flex-wrap justify-end gap-2 border-t border-gray-100">
            <button disabled={exporting || lines.length === 0} onClick={() => downloadImage("jpeg")} className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-bold text-ink hover:bg-gray-50 disabled:opacity-50">
              Download JPG
            </button>
            <button disabled={exporting || lines.length === 0} onClick={() => downloadImage("png")} className="rounded-full bg-gold text-ink px-5 py-2.5 text-sm font-bold hover:bg-gold-dim disabled:opacity-50">
              {exporting ? "Exporting…" : "Download PNG"}
            </button>
            <button disabled={saving} onClick={saveQuote} className="rounded-full bg-teal text-ink px-5 py-2.5 text-sm font-bold disabled:opacity-50">
              {saving ? "Saving…" : "Save to Supabase"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
