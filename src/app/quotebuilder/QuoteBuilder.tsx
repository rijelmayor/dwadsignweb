"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_SIGN_TYPES,
  mergeCatalog,
  type SignType,
  type MaterialOption,
} from "@/lib/catalog";
import {
  DEFAULT_QUOTE_SETTINGS,
  mergeQuoteSettings,
  type QuoteSettings,
} from "@/lib/settings";
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
  depthIn: number;
  qty: number;
  selections: Record<string, string>;
  note: string;
  unitCost: number;
  hasTbd: boolean;
  mockupPng?: string | null;
  logoUrl?: string;
}

interface ClientInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
  project: string;
}

function qtyFor(opt: MaterialOption, w: number, h: number): number {
  if (opt.unit === "sqft") return Math.max(0.01, w * h);
  if (opt.unit === "lm") return Math.max(0.01, 2 * (w + h));
  return 1;
}

function computeUnitCost(
  st: SignType,
  selections: Record<string, string>,
  w: number,
  h: number,
  markupPct: number,
): { cost: number; hasTbd: boolean } {
  let raw = 0;
  let hasTbd = false;
  for (const c of st.components) {
    const opt = c.options.find((o) => o.id === selections[c.id]) ?? c.options[0];
    if (!opt) continue;
    if (opt.pricePerUnit <= 0) hasTbd = true;
    raw += opt.pricePerUnit * qtyFor(opt, w, h);
  }
  return { cost: raw * (1 + markupPct / 100), hasTbd };
}

function fmt(n: number) {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default function QuoteBuilder() {
  const [catalog, setCatalog] = useState<SignType[]>(DEFAULT_SIGN_TYPES);
  const [qs, setQs] = useState<QuoteSettings>(DEFAULT_QUOTE_SETTINGS);
  const [signTypeId, setSignTypeId] = useState(DEFAULT_SIGN_TYPES[0].id);
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(2);
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [client, setClient] = useState<ClientInfo>({
    name: "",
    company: "",
    email: "",
    phone: "",
    project: "",
  });
  const [discount, setDiscount] = useState(0);
  const [preparedBy, setPreparedBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);

  const sceneRef = useRef<SignSceneHandle>(null);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      setSupabaseOk(!!sb);
      if (!sb) return;
      const { data } = await sb.from("site_settings").select("key,value").in("key", ["catalog", "quote"]);
      if (!data) return;
      for (const row of data) {
        if (row.key === "catalog") setCatalog(mergeCatalog(row.value));
        if (row.key === "quote") setQs(mergeQuoteSettings(row.value));
      }
    }
    load();
  }, []);

  const st = catalog.find((s) => s.id === signTypeId) ?? catalog[0];

  useEffect(() => {
    if (!st) return;
    const next: Record<string, string> = {};
    for (const c of st.components) {
      next[c.id] =
        selections[c.id] && c.options.some((o) => o.id === selections[c.id])
          ? selections[c.id]
          : c.options[0]?.id ?? "";
    }
    setSelections(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signTypeId, catalog]);

  const traits = useMemo(() => (st ? deriveTraits(st, selections) : null), [st, selections]);
  const depthIn = Math.round((traits?.frameThickness ?? 0.12) * 12 * 10) / 10;
  const live = useMemo(
    () => (st ? computeUnitCost(st, selections, width, height, qs.markupPct) : { cost: 0, hasTbd: true }),
    [st, selections, width, height, qs.markupPct],
  );

  const activeLogo = logoPreview || logoUrl || undefined;

  const onLogoFile = (file: File | null) => {
    if (!file) {
      setLogoPreview("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const addLine = () => {
    if (!st || !traits) return;
    const { cost, hasTbd } = computeUnitCost(st, selections, width, height, qs.markupPct);
    const mockupPng = sceneRef.current?.capturePng() ?? null;
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        signTypeId: st.id,
        signName: st.name,
        width,
        height,
        depthIn: Math.round(traits.frameThickness * 12 * 10) / 10,
        qty,
        selections: { ...selections },
        note,
        unitCost: cost,
        hasTbd,
        mockupPng,
        logoUrl: activeLogo,
      },
    ]);
    setNote("");
    setMsg("Item added with mockup snapshot");
    setTimeout(() => setMsg(""), 2500);
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));

  const subtotal = lines.reduce((s, l) => s + l.unitCost * l.qty, 0);
  const afterDisc = Math.max(0, subtotal - discount);
  const vat = afterDisc * (qs.vatPct / 100);
  const grand = afterDisc + vat;
  const quoteNo = `${qs.quotePrefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
    lines.length || 1,
  ).padStart(2, "0")}`;

  const saveQuote = useCallback(async () => {
    setSaving(true);
    setMsg("");
    const sb = createClient();
    if (!sb) {
      setMsg("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY, then run schema.sql.");
      setSaving(false);
      return;
    }

    // Capture latest mockup if lines empty of images
    const linesPayload = lines.map((l) => ({
      sign: l.signName,
      size: `${l.width}×${l.height} ft × ${l.depthIn}" deep`,
      width: l.width,
      height: l.height,
      depthIn: l.depthIn,
      qty: l.qty,
      unitCost: l.unitCost,
      amount: l.unitCost * l.qty,
      note: l.note,
      selections: l.selections,
      hasTbd: l.hasTbd,
      mockupPng: l.mockupPng ?? null,
      logoUrl: l.logoUrl ?? null,
    }));

    const payload = {
      quote_no: quoteNo,
      client,
      lines: linesPayload,
      totals: { sub: subtotal, discount, vat, grand, preparedBy, preparedByTitle: qs.preparedByTitle },
      status: "draft",
    };

    const { error } = await sb.from("quotes").insert(payload);
    if (error) {
      setMsg(`Save failed: ${error.message}`);
    } else {
      setMsg("Saved to Supabase ✓");
    }
    setSaving(false);
  }, [quoteNo, client, lines, subtotal, discount, vat, grand, preparedBy, qs.preparedByTitle]);

  const handlePrint = () => {
    // Ensure each line has a snapshot if possible
    window.print();
  };

  const inputCls =
    "w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white placeholder:text-fog/50 focus:border-teal outline-none";
  const labelCls = "block text-xs font-semibold tracking-wider uppercase text-fog mb-1.5";

  return (
    <div className="min-h-screen bg-ink text-white print-root">
      <header className="no-print sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/logo-mark.png" alt="DW" width={120} height={58} className="h-8 w-auto" />
            </Link>
            <span className="font-display font-bold text-sm hidden sm:inline">
              Quote Builder <span className="text-fog font-normal">· {site.name}</span>
            </span>
            {supabaseOk === false && (
              <span className="text-[10px] rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/40">
                Supabase offline
              </span>
            )}
            {supabaseOk === true && (
              <span className="text-[10px] rounded bg-teal/20 text-teal px-2 py-0.5 border border-teal/40">
                Supabase connected
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/buildersettings" className="text-fog hover:text-gold transition">
              Settings
            </Link>
            <button
              onClick={handlePrint}
              className="rounded-full border border-line px-4 py-1.5 hover:border-gold transition"
            >
              Print / PDF
            </button>
            <button
              onClick={saveQuote}
              disabled={saving || lines.length === 0}
              className="rounded-full bg-gold px-4 py-1.5 font-semibold text-ink hover:bg-gold-dim transition disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save to Supabase"}
            </button>
          </div>
        </div>
        {msg && (
          <div
            className={`text-center text-sm py-1.5 no-print ${
              msg.includes("fail") || msg.includes("not configured") ? "bg-red-900/40 text-red-300" : "bg-teal/20 text-teal"
            }`}
          >
            {msg}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 grid lg:grid-cols-[1fr_400px] gap-6">
        {/* LEFT: configurator + 3D */}
        <div className="space-y-6 no-print">
          <div className="flex flex-wrap gap-2">
            {catalog.map((s) => (
              <button
                key={s.id}
                onClick={() => setSignTypeId(s.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  signTypeId === s.id ? "bg-gold text-ink" : "border border-line text-fog hover:border-gold"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-line bg-panel p-5 space-y-4">
              <p className="text-sm text-fog">{st?.desc}</p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Width (ft)</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.1}
                    value={width}
                    onChange={(e) => setWidth(+e.target.value || 0)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Height (ft)</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.1}
                    value={height}
                    onChange={(e) => setHeight(+e.target.value || 0)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(+e.target.value || 1)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-line/60 bg-ink/40 px-3 py-2 text-xs text-fog flex flex-wrap gap-3">
                <span>
                  Frame depth: <strong className="text-teal">{depthIn}&quot;</strong>
                </span>
                <span>
                  Face: <strong className="text-gold">{width}×{height} ft</strong>
                </span>
                <span>
                  Area: <strong className="text-white">{(width * height).toFixed(2)} sqft</strong>
                </span>
              </div>

              {st?.components.map((c) => (
                <div key={c.id}>
                  <label className={labelCls}>{c.name}</label>
                  <select
                    value={selections[c.id] ?? ""}
                    onChange={(e) => setSelections((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    className={inputCls}
                  >
                    {c.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} {o.pricePerUnit > 0 ? `· ₱${o.pricePerUnit}/${o.unit}` : "· TBD"}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Client logo on face */}
              <div className="space-y-2 border-t border-line pt-4">
                <label className={labelCls}>Client logo on face (optional)</label>
                <input
                  type="url"
                  placeholder="https://… logo image URL"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className={inputCls}
                />
                <div className="flex items-center gap-3">
                  <label className="text-xs text-fog cursor-pointer rounded border border-line px-3 py-1.5 hover:border-teal">
                    Upload logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {(logoPreview || logoUrl) && (
                    <button
                      type="button"
                      className="text-xs text-red-400 hover:underline"
                      onClick={() => {
                        setLogoPreview("");
                        setLogoUrl("");
                      }}
                    >
                      Clear logo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Note (optional)</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. dual-sided, custom color…"
                  className={inputCls}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line">
                <div>
                  <p className="text-xs text-fog uppercase tracking-wider">
                    Unit price (w/ {qs.markupPct}% markup)
                  </p>
                  <p className="font-display text-2xl font-bold text-gold">
                    ₱{fmt(live.cost)}
                    {live.hasTbd && <span className="text-sm text-fog ml-2">⚠ TBD prices</span>}
                  </p>
                </div>
                <button
                  onClick={addLine}
                  className="rounded-full bg-teal px-6 py-2.5 font-semibold text-ink hover:bg-teal-dim transition"
                >
                  Add to Quote
                </button>
              </div>
            </div>

            {/* 3D preview */}
            <div className="rounded-2xl border border-line bg-panel overflow-hidden flex flex-col">
              <div className="px-4 py-2 border-b border-line text-xs text-fog flex justify-between">
                <span>Live 3D · drag to orbit · dimensions on</span>
                <span>
                  {width}×{height} ft · {depthIn}&quot; deep
                </span>
              </div>
              <div className="flex-1 min-h-[360px]">
                {st && traits && (
                  <SignScene
                    ref={sceneRef}
                    widthFt={width}
                    heightFt={height}
                    preview={st.preview}
                    traits={traits}
                    text={client.company?.slice(0, 8) || "DW"}
                    logoUrl={activeLogo}
                    showDimensions
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: quote sheet */}
        <div className="print-sheet rounded-2xl border border-line bg-white text-ink overflow-hidden">
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

          <div className="px-6 py-4 border-b border-gray-200 grid grid-cols-2 gap-3 no-print">
            {(["name", "company", "email", "phone", "project"] as const).map((k) => (
              <div key={k} className={k === "project" ? "col-span-2" : ""}>
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-gray-500 mb-0.5">
                  {k === "name" ? "Client name" : k}
                </label>
                <input
                  value={client[k]}
                  onChange={(e) => setClient((c) => ({ ...c, [k]: e.target.value }))}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                  placeholder={k}
                />
              </div>
            ))}
          </div>
          <div className="hidden print:block px-6 py-3 border-b border-gray-200 text-sm">
            <p>
              <strong>{client.name || "—"}</strong>
              {client.company ? ` · ${client.company}` : ""}
            </p>
            <p className="text-gray-600">{[client.email, client.phone].filter(Boolean).join(" · ")}</p>
            {client.project && <p className="text-gray-600">Project: {client.project}</p>}
          </div>

          <div className="px-6 py-4 space-y-4">
            {lines.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 no-print">Add items from the configurator →</p>
            ) : (
              lines.map((l) => (
                <div key={l.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  {l.mockupPng && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.mockupPng}
                      alt={`${l.signName} mockup`}
                      className="w-full max-h-48 object-contain bg-[#011424]"
                    />
                  )}
                  <div className="p-3 flex justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold">{l.signName}</p>
                      <p className="text-xs text-gray-500">
                        {l.width}×{l.height} ft · {l.depthIn}&quot; deep
                        {l.note ? ` · ${l.note}` : ""}
                      </p>
                      {l.hasTbd && <p className="text-xs text-amber-600">⚠ Contains TBD prices</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">Qty {l.qty}</p>
                      <p className="font-semibold">₱{fmt(l.unitCost * l.qty)}</p>
                      <button
                        onClick={() => removeLine(l.id)}
                        className="text-red-500 text-xs hover:underline no-print mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>₱{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center no-print">
              <span className="text-gray-500">Discount</span>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(+e.target.value || 0)}
                className="w-28 border border-gray-200 rounded px-2 py-0.5 text-right text-sm"
              />
            </div>
            {discount > 0 && (
              <div className="flex justify-between print:flex hidden">
                <span className="text-gray-500">Discount</span>
                <span>−₱{fmt(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">VAT ({qs.vatPct}%)</span>
              <span>₱{fmt(vat)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Grand Total</span>
              <span className="text-[#011424]">₱{fmt(grand)}</span>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 text-xs text-gray-600 space-y-1">
            {qs.terms.map((t, i) => (
              <p key={i}>• {t}</p>
            ))}
            <div className="pt-4 flex justify-between items-end">
              <div className="no-print">
                <label className="block text-[10px] font-semibold tracking-wider uppercase text-gray-500 mb-0.5">
                  Prepared by
                </label>
                <input
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-sm w-40"
                  placeholder="Your name"
                />
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink">{preparedBy || "—"}</p>
                <p>{qs.preparedByTitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
