"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_SIGN_TYPES, mergeCatalog, type SignType } from "@/lib/catalog";
import { DEFAULT_QUOTE_SETTINGS, mergeQuoteSettings, type QuoteSettings } from "@/lib/settings";
import { deriveTraits } from "@/lib/traits";
import { site } from "@/lib/site";
import type { SignSceneHandle } from "@/components/SignScene";

const SignScene = dynamic(() => import("@/components/SignScene"), { ssr: false });

interface LineItem {
  id: string;
  signTypeId: string;
  signName: string;
  width: number;
  height: number;
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
  mockupPng?: string | null;
  logoUrl?: string;
}

interface ClientInfo { name: string; company: string; email: string; phone: string; project: string }

const FACE_OPTIONS = [
  ["panaflex", "Panaflex"], ["tarp", "Tarp"], ["apc", "APC"], ["acrylic", "Acrylic"], ["metal", "Metal Sheet"], ["custom", "Custom Build Face"],
] as const;
const LIGHTING_OPTIONS = [["without", "Without Light"], ["with", "With Light"]] as const;
const PRINTING_OPTIONS = [["sticker", "Sticker print"], ["direct", "Direct print to materials"], ["uv", "UV print"]] as const;

function fmt(n: number) { return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function today() { return new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }); }
function labelOf(options: readonly (readonly [string, string])[], id: string) { return options.find(([v]) => v === id)?.[1] ?? id; }

export default function QuoteBuilder() {
  const [catalog, setCatalog] = useState<SignType[]>(DEFAULT_SIGN_TYPES);
  const [qs, setQs] = useState<QuoteSettings>(DEFAULT_QUOTE_SETTINGS);
  const [signTypeId, setSignTypeId] = useState("panaflex");
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(2);
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
  const [client, setClient] = useState<ClientInfo>({ name: "", company: "", email: "", phone: "", project: "" });
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

  const st = catalog.find((s) => s.id === signTypeId) ?? catalog[0];
  const areaSqft = Math.max(0, width * height);
  const activeLogo = logoPreview || logoUrl || undefined;
  const faceLabel = labelOf(FACE_OPTIONS, face);
  const lightingLabel = labelOf(LIGHTING_OPTIONS, lighting);
  const printingLabel = labelOf(PRINTING_OPTIONS, printing);
  const traits = useMemo(() => st ? deriveTraits(st, { lighting, mounting, face }, thicknessIn) : null, [st, lighting, mounting, face, thicknessIn]);

  const live = useMemo(() => {
    const p = qs.panaflexPricing;
    const rates = { construction: p.constructionPerSqft, face: p.face[face] ?? 0, lighting: p.lighting[lighting] ?? 0, printing: p.printing[printing] ?? 0 };
    const rawPerSqft = rates.construction + rates.face + rates.lighting + rates.printing;
    const raw = rawPerSqft * areaSqft;
    const marked = raw * (1 + qs.markupPct / 100);
    const unitCost = Math.max(p.minimumCharge || 0, marked);
    return { rates, raw, unitCost, hasTbd: Object.values(rates).some((v) => v <= 0) && raw === 0 };
  }, [qs, face, lighting, printing, areaSqft]);

  const onLogoFile = (file: File | null) => {
    if (!file) { setLogoPreview(""); return; }
    const reader = new FileReader(); reader.onload = () => setLogoPreview(String(reader.result || "")); reader.readAsDataURL(file);
  };

  const addLine = () => {
    if (!st || !traits || areaSqft <= 0) return;
    const mockupPng = sceneRef.current?.capturePng() ?? null;
    setLines((prev) => [...prev, {
      id: crypto.randomUUID(), signTypeId: st.id, signName: st.name, width, height, thicknessIn,
      areaSqft, qty, face: faceLabel, lighting: lightingLabel, printing: printingLabel, mounting,
      note, unitCost: live.unitCost,
      breakdown: {
        construction: live.rates.construction * areaSqft,
        face: live.rates.face * areaSqft,
        lighting: live.rates.lighting * areaSqft,
        printing: live.rates.printing * areaSqft,
        markup: live.unitCost - (live.rates.construction + live.rates.face + live.rates.lighting + live.rates.printing) * areaSqft,
      },
      hasTbd: live.hasTbd, mockupPng, logoUrl: activeLogo,
    }]);
    setNote(""); setMsg("Item added to quotation ✓"); setTimeout(() => setMsg(""), 2500);
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
    if (!quoteSheetRef.current) return;
    if (lines.length === 0) {
      setMsg("Add at least one sign before downloading.");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    setExporting(true);
    setMsg("");
    try {
      // Hide elements that should not appear on the client image
      const hideNodes = quoteSheetRef.current.querySelectorAll<HTMLElement>(".no-export");
      hideNodes.forEach((n) => { n.dataset._prevDisplay = n.style.display; n.style.display = "none"; });

      const { toPng, toJpeg } = await import("html-to-image");
      const options = {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        quality: format === "jpeg" ? 0.92 : 1,
      };
      const dataUrl = format === "png"
        ? await toPng(quoteSheetRef.current, options)
        : await toJpeg(quoteSheetRef.current, options);

      hideNodes.forEach((n) => { n.style.display = n.dataset._prevDisplay || ""; delete n.dataset._prevDisplay; });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${quoteNo}.${format === "png" ? "png" : "jpg"}`;
      a.click();
      setMsg(`Downloaded ${format.toUpperCase()} · ready to send to client`);
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setMsg("Image export failed. Try again or check the browser console.");
      setTimeout(() => setMsg(""), 4000);
    } finally {
      setExporting(false);
    }
  }, [lines.length, quoteNo]);

  const downloadMockupOnly = useCallback(() => {
    const first = lines.find((l) => l.mockupPng);
    if (!first?.mockupPng) {
      setMsg("No 3D mockup yet — add a sign first.");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    const a = document.createElement("a");
    a.href = first.mockupPng;
    a.download = `${quoteNo}-mockup.png`;
    a.click();
    setMsg("3D mockup PNG downloaded");
    setTimeout(() => setMsg(""), 2500);
  }, [lines, quoteNo]);

  const inputCls = "w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-white placeholder:text-fog/50 focus:border-teal outline-none";
  const labelCls = "block text-[11px] font-bold tracking-wider uppercase text-fog mb-1.5";

  return <div className="min-h-screen bg-ink text-white print-root">
    <header className="no-print sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Link href="/"><Image src="/logo-mark.png" alt="DW" width={120} height={58} className="h-8 w-auto" /></Link><span className="font-display font-bold text-sm hidden sm:inline">Quote Builder <span className="text-fog font-normal">· {site.name}</span></span>{supabaseOk === false && <span className="text-[10px] rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/40">Supabase offline</span>}</div>
        <div className="flex flex-wrap gap-2 items-center">
          <Link href="/buildersettings" className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:border-teal hover:text-white">Builder Settings</Link>
          <button onClick={downloadMockupOnly} className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:border-teal hover:text-white" title="Download 3D mockup only">3D Mockup PNG</button>
          <button disabled={exporting} onClick={() => downloadImage("jpeg")} className="rounded-full border border-gold/50 px-4 py-2 text-xs font-bold text-gold hover:bg-gold/10 disabled:opacity-50">Download JPG</button>
          <button disabled={exporting} onClick={() => downloadImage("png")} className="rounded-full bg-gold text-ink px-4 py-2 text-xs font-bold hover:bg-gold-dim disabled:opacity-50">{exporting ? "Exporting…" : "Download PNG"}</button>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-[1600px] p-4 lg:p-6 grid lg:grid-cols-[minmax(520px,0.95fr)_minmax(520px,1.05fr)] gap-6">
      <section className="space-y-5 no-print">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between gap-3 mb-4"><div><p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Step 1</p><h1 className="font-display text-2xl font-bold">Panaflex Sign Builder</h1></div><span className="rounded-full bg-teal/10 border border-teal/30 text-teal px-3 py-1 text-xs font-bold">3D Preview</span></div>
          <p className="text-sm text-fog">Build the sign from the physical dimensions first. Pricing is calculated by square foot from the rates stored in Supabase Builder Settings.</p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 space-y-5">
          <div><p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">1 · Dimensions</p><h2 className="font-display text-lg font-bold">Sign size</h2></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Height (ft)</label><input type="number" min={0.1} step={0.1} value={height} onChange={(e) => setHeight(Math.max(0.1, +e.target.value || 0))} className={inputCls} /></div>
            <div><label className={labelCls}>Width (ft)</label><input type="number" min={0.1} step={0.1} value={width} onChange={(e) => setWidth(Math.max(0.1, +e.target.value || 0))} className={inputCls} /></div>
            <div><label className={labelCls}>Thickness (in)</label><input type="number" min={0.25} step={0.25} value={thicknessIn} onChange={(e) => setThicknessIn(Math.max(0.25, +e.target.value || 0))} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-ink/50 border border-line px-2 py-2"><span className="text-fog block">Area</span><strong>{areaSqft.toFixed(2)} sqft</strong></div><div className="rounded-lg bg-ink/50 border border-line px-2 py-2"><span className="text-fog block">Thickness</span><strong>{thicknessIn}"</strong></div><div className="rounded-lg bg-ink/50 border border-line px-2 py-2"><span className="text-fog block">Qty</span><input className="bg-transparent text-center w-full outline-none font-bold" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} /></div></div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 space-y-5">
          <div><p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">2 · Build</p><h2 className="font-display text-lg font-bold">Face, lighting & printing</h2></div>
          <div><label className={labelCls}>Face</label><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{FACE_OPTIONS.map(([id, name]) => <button key={id} onClick={() => setFace(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold text-left transition ${face === id ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>{name}</button>)}</div></div>
          <div><label className={labelCls}>Lighting</label><div className="grid grid-cols-2 gap-2">{LIGHTING_OPTIONS.map(([id, name]) => <button key={id} onClick={() => setLighting(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${lighting === id ? "border-teal bg-teal text-ink" : "border-line bg-ink/30 text-fog hover:border-teal"}`}>{name}</button>)}</div></div>
          <div><label className={labelCls}>Printing</label><div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{PRINTING_OPTIONS.map(([id, name]) => <button key={id} onClick={() => setPrinting(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${printing === id ? "border-gold bg-gold text-ink" : "border-line bg-ink/30 text-fog hover:border-gold"}`}>{name}</button>)}</div></div>
          <div><label className={labelCls}>Mounting</label><select value={mounting} onChange={(e) => setMounting(e.target.value)} className={inputCls}><option value="wall">Wall-mounted</option><option value="pole">Pole / freestanding</option><option value="rooftop">Rooftop with steel support</option></select></div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 space-y-4">
          <div><p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">3 · Branding</p><h2 className="font-display text-lg font-bold">Client logo / design</h2></div>
          <div className="grid sm:grid-cols-[1fr_auto] gap-3"><input className={inputCls} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo / design image URL (optional)" /><label className="rounded-xl border border-line bg-ink/30 px-4 py-2.5 text-sm font-semibold cursor-pointer text-center hover:border-teal">Upload logo / design<input type="file" accept="image/*" className="hidden" onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)} /></label></div>
          {activeLogo && <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3"><img src={activeLogo} alt="Client logo" className="h-16 w-32 object-contain" /><button onClick={() => { setLogoUrl(""); setLogoPreview(""); }} className="text-xs text-red-500">Clear</button></div>}
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 space-y-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">4 · Notes</p></div><textarea className={`${inputCls} min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional fabrication / installation note" /><div className="flex items-center justify-between gap-4"><div className="text-xs text-fog">{areaSqft.toFixed(2)} sqft × configured rates + {qs.markupPct}% markup</div><button onClick={addLine} className="rounded-full bg-gold text-ink px-6 py-2.5 font-bold hover:bg-gold-dim">Add to Quote · ₱{fmt(live.unitCost)}</button></div></div>

        <div className="rounded-2xl border border-line bg-panel overflow-hidden">
          <div className="px-4 py-2 border-b border-line text-xs text-fog flex justify-between"><span>3D render · clean face, no visible frame</span><span>{height} × {width} ft · {thicknessIn}" thick</span></div>
          <div className="h-[440px]">{st && traits && <SignScene ref={sceneRef} widthFt={width} heightFt={height} preview="panaflex" traits={traits} text="Your Logo" logoUrl={activeLogo} showDimensions faceLabel={faceLabel} printingLabel={printingLabel} />}</div>
        </div>
        {msg && <div className="rounded-xl border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal">{msg}</div>}
      </section>

      <section ref={quoteSheetRef} className="quote-sheet rounded-2xl border border-line bg-white text-ink overflow-hidden">
        <div className="bg-[#011424] text-white px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <Image src="/logo-mark.png" alt="DW" width={100} height={48} className="h-10 w-auto mb-2" />
            <p className="font-display font-bold text-lg">Delight Works</p>
            <p className="text-xs text-fog tracking-widest uppercase">{site.descriptor}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-display font-bold text-gold text-lg">{quoteNo}</p>
            <p className="text-fog">{today()}</p>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg">Sign Specification</h2>
            <span className="text-xs text-gray-500">3D mockup + dimensions</span>
          </div>
          {lines.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 no-export">Add a Panaflex sign from the builder. The 3D render (with dimension arrows) will appear here for image download.</p>
          ) : (
            lines.map((l) => (
              <div key={l.id} className="mb-5 last:mb-0 border border-gray-200 rounded-xl overflow-hidden">
                {l.mockupPng && (
                  <img src={l.mockupPng} alt="3D sign mockup with dimensions" className="w-full h-56 object-contain bg-[#eef2f5]" />
                )}
                <div className="p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-bold">{l.signName}</p>
                      <p className="text-xs text-gray-500">{l.face} · {l.lighting} · {l.printing}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₱{fmt(l.unitCost * l.qty)}</p>
                      <p className="text-xs text-gray-500">Qty {l.qty}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
                    <div className="bg-gray-50 rounded p-2"><span className="block text-gray-500">Height</span><strong>{l.height} ft</strong></div>
                    <div className="bg-gray-50 rounded p-2"><span className="block text-gray-500">Width</span><strong>{l.width} ft</strong></div>
                    <div className="bg-gray-50 rounded p-2"><span className="block text-gray-500">Thickness</span><strong>{l.thicknessIn}&quot;</strong></div>
                    <div className="bg-gray-50 rounded p-2"><span className="block text-gray-500">Area</span><strong>{l.areaSqft.toFixed(2)} sqft</strong></div>
                  </div>
                  {l.note && <p className="text-xs text-gray-600 mt-3">Note: {l.note}</p>}
                  <button onClick={() => removeLine(l.id)} className="text-red-500 text-xs hover:underline no-export mt-3">Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-b border-gray-200 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₱{fmt(subtotal)}</span></div>
          <div className="flex justify-between items-center no-export">
            <span className="text-gray-500">Discount</span>
            <input type="number" min={0} value={discount} onChange={(e) => setDiscount(+e.target.value || 0)} className="w-28 border border-gray-200 rounded px-2 py-0.5 text-right text-sm" />
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Discount</span>
              <span>−₱{fmt(discount)}</span>
            </div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">VAT ({qs.vatPct}%)</span><span>₱{fmt(vat)}</span></div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span>Grand Total</span>
            <span>₱{fmt(grand)}</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 text-xs text-gray-600 space-y-1">
          {qs.terms.map((t, i) => <p key={i}>• {t}</p>)}
          <div className="pt-4 flex justify-between items-end">
            <div className="no-export">
              <label className="block text-[10px] font-semibold tracking-wider uppercase text-gray-500 mb-0.5">Prepared by</label>
              <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-sm w-40" placeholder="Your name" />
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink">{preparedBy || "—"}</p>
              <p>{qs.preparedByTitle}</p>
            </div>
          </div>
        </div>

        <div className="no-export px-6 py-4 flex flex-wrap justify-end gap-2">
          <button disabled={exporting || lines.length === 0} onClick={() => downloadImage("jpeg")} className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-bold text-ink hover:bg-gray-50 disabled:opacity-50">Download JPG</button>
          <button disabled={exporting || lines.length === 0} onClick={() => downloadImage("png")} className="rounded-full bg-gold text-ink px-5 py-2.5 text-sm font-bold hover:bg-gold-dim disabled:opacity-50">{exporting ? "Exporting…" : "Download PNG"}</button>
          <button disabled={saving} onClick={saveQuote} className="rounded-full bg-teal text-ink px-5 py-2.5 text-sm font-bold disabled:opacity-50">{saving ? "Saving…" : "Save to Supabase"}</button>
        </div>
      </section>
    </main>
  </div>;
}
