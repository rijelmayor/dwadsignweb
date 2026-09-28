"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_MARKUP_PCT,
  SIGN_TYPES,
  findOption,
  findSignType,
  type UnitSystem,
} from "@/lib/catalog";
import SignMockup from "@/components/SignMockup";
import { createClient } from "@/lib/supabase/client";
import { site } from "@/lib/site";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Config {
  signTypeId: string;
  selections: Record<string, string>; // componentId -> optionId
  w: number;
  h: number;
  qty: number;
}

interface BreakdownRow {
  component: string;
  option: string;
  units: number;
  unit: UnitSystem;
  unitCost: number;
  cost: number;
}

interface QuoteItem {
  id: string;
  signTypeId: string;
  name: string;
  w: number;
  h: number;
  qty: number;
  mockupKind: string;
  selections: Record<string, string>;
  breakdown: BreakdownRow[];
  materialCost: number;
  markupPct: number;
  installFee: number;
  designFee: number;
  discountPct: number;
  notes: string;
  total: number;
}

interface ClientInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
  project: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const money = (n: number) =>
  n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const unitLabel: Record<UnitSystem, string> = { sqft: "sq ft", lm: "lin. ft", pcs: "pcs" };

function defaultSelections(signTypeId: string): Record<string, string> {
  const st = findSignType(signTypeId)!;
  return Object.fromEntries(st.components.map((c) => [c.id, c.options[0].id]));
}

function calcConfig(cfg: Config) {
  const st = findSignType(cfg.signTypeId);
  if (!st) return { breakdown: [] as BreakdownRow[], materialCost: 0 };
  const area = cfg.w * cfg.h;
  const perimeter = 2 * (cfg.w + cfg.h);
  const breakdown: BreakdownRow[] = st.components.map((comp) => {
    const opt = comp.options.find((o) => o.id === cfg.selections[comp.id]) ?? comp.options[0];
    const base = opt.unit === "sqft" ? area : opt.unit === "lm" ? perimeter : 1;
    const units = base * cfg.qty;
    return {
      component: comp.name,
      option: opt.name,
      units: +units.toFixed(2),
      unit: opt.unit,
      unitCost: opt.pricePerUnit,
      cost: opt.pricePerUnit * units,
    };
  });
  return { breakdown, materialCost: breakdown.reduce((s, b) => s + b.cost, 0) };
}

function itemTotal(item: QuoteItem) {
  const markedUp = item.materialCost * (1 + item.markupPct / 100);
  return (markedUp + item.installFee + item.designFee) * (1 - item.discountPct / 100);
}

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-white placeholder:text-fog/60 focus:border-volt outline-none";
const labelCls = "block text-xs text-fog mb-1.5";
const selectCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-white focus:border-volt outline-none";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function QuoteBuilder() {
  const [client, setClient] = useState<ClientInfo>({ name: "", company: "", email: "", phone: "", project: "" });
  const [cfg, setCfg] = useState<Config>({
    signTypeId: SIGN_TYPES[0].id,
    selections: defaultSelections(SIGN_TYPES[0].id),
    w: 8,
    h: 3,
    qty: 1,
  });
  const [markupPct, setMarkupPct] = useState(DEFAULT_MARKUP_PCT);
  const [installFee, setInstallFee] = useState(0);
  const [designFee, setDesignFee] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [savedMsg, setSavedMsg] = useState("");
  const [quoteNo, setQuoteNo] = useState("");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setQuoteNo(`DWA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  }, []);

  const st = findSignType(cfg.signTypeId)!;
  const calc = calcConfig(cfg);

  const previewTotal = (() => {
    const markedUp = calc.materialCost * (1 + markupPct / 100);
    return (markedUp + installFee + designFee) * (1 - discountPct / 100);
  })();

  const setSelection = (componentId: string, optionId: string) =>
    setCfg({ ...cfg, selections: { ...cfg.selections, [componentId]: optionId } });

  const changeSignType = (id: string) =>
    setCfg({ ...cfg, signTypeId: id, selections: defaultSelections(id) });

  const addToQuote = () => {
    const item: QuoteItem = {
      id: Math.random().toString(36).slice(2),
      signTypeId: cfg.signTypeId,
      name: st.name,
      w: cfg.w,
      h: cfg.h,
      qty: cfg.qty,
      mockupKind: st.preview,
      selections: { ...cfg.selections },
      breakdown: calc.breakdown,
      materialCost: calc.materialCost,
      markupPct,
      installFee,
      designFee,
      discountPct,
      notes,
      total: 0,
    };
    item.total = itemTotal(item);
    setItems([...items, item]);
    setSavedMsg("");
  };

  const updateItem = (id: string, patch: Partial<QuoteItem>) =>
    setItems((its) => its.map((it) => (it.id === id ? { ...it, ...patch, total: itemTotal({ ...it, ...patch }) } : it)));

  const totals = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.total, 0);
    const vat = sub * 0.12;
    return { sub, vat, grand: sub + vat };
  }, [items]);

  const saveQuote = async () => {
    const payload = { quote_no: quoteNo, client, items, totals, created_at: new Date().toISOString() };
    if (supabase) {
      const { error } = await supabase.from("quotes").insert(payload);
      if (error) { setSavedMsg(`Supabase error: ${error.message}`); return; }
      setSavedMsg(`Quote ${quoteNo} saved to Supabase.`);
    } else {
      const key = "dwadsign-quotes";
      const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
      existing.push(payload);
      localStorage.setItem(key, JSON.stringify(existing));
      setSavedMsg(`Quote ${quoteNo} saved locally (Supabase not configured yet).`);
    }
  };

  return (
    <div className="grid xl:grid-cols-[380px_1fr] gap-8">
      {/* ================= LEFT: client + configurator ================= */}
      <div className="no-print space-y-4">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-bold mb-4">Client</h2>
          {(["name", "company", "email", "phone", "project"] as const).map((f) => (
            <input
              key={f}
              placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
              value={client[f]}
              onChange={(e) => setClient({ ...client, [f]: e.target.value })}
              className={`${inputCls} mb-3`}
            />
          ))}
        </div>

        {/* ---- Sign configurator ---- */}
        <div className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-bold mb-1">Build the Sign</h2>
          <p className="text-xs text-fog mb-4">Configure materials — the mockup and price update live.</p>

          <div className="flex flex-wrap gap-2 mb-5">
            {SIGN_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => changeSignType(t.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition ${
                  t.id === cfg.signTypeId
                    ? "bg-volt text-ink border-volt"
                    : "border-line text-fog hover:border-volt hover:text-white"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* mockup */}
          <div className="rounded-xl bg-ink border border-line p-3 mb-5">
            <SignMockup
              kind={st.preview}
              w={cfg.w}
              h={cfg.h}
              frameId={cfg.selections.frame ?? ""}
              lightingId={cfg.selections.lighting ?? ""}
              mountingId={cfg.selections.mounting ?? ""}
              faceLabel={st.preview === "panaflex" ? "PANAFLEX" : st.name.toUpperCase()}
            />
            <p className="text-center text-xs text-fog mt-1">{st.desc}</p>
          </div>

          {/* dimensions */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <label className={labelCls}>
              Width (ft)
              <input type="number" min="0.5" step="0.5" value={cfg.w}
                onChange={(e) => setCfg({ ...cfg, w: +e.target.value })} className={inputCls} />
            </label>
            <label className={labelCls}>
              Height (ft)
              <input type="number" min="0.5" step="0.5" value={cfg.h}
                onChange={(e) => setCfg({ ...cfg, h: +e.target.value })} className={inputCls} />
            </label>
            <label className={labelCls}>
              Qty
              <input type="number" min="1" value={cfg.qty}
                onChange={(e) => setCfg({ ...cfg, qty: +e.target.value })} className={inputCls} />
            </label>
          </div>

          {/* components */}
          <div className="space-y-3 mb-5">
            {st.components.map((comp) => (
              <label key={comp.id} className={labelCls}>
                {comp.name}
                <select
                  value={cfg.selections[comp.id]}
                  onChange={(e) => setSelection(comp.id, e.target.value)}
                  className={`${selectCls} mt-1`}
                >
                  {comp.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {o.pricePerUnit > 0
                        ? ` — ₱${money(o.pricePerUnit)}/${unitLabel[o.unit]}`
                        : " — price TBD"}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {/* commercial terms */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className={labelCls}>
              Markup %
              <input type="number" min="0" value={markupPct}
                onChange={(e) => setMarkupPct(+e.target.value)} className={inputCls} />
            </label>
            <label className={labelCls}>
              Discount %
              <input type="number" min="0" max="100" value={discountPct}
                onChange={(e) => setDiscountPct(+e.target.value)} className={inputCls} />
            </label>
            <label className={labelCls}>
              Install fee (₱)
              <input type="number" min="0" value={installFee}
                onChange={(e) => setInstallFee(+e.target.value)} className={inputCls} />
            </label>
            <label className={labelCls}>
              Design fee (₱)
              <input type="number" min="0" value={designFee}
                onChange={(e) => setDesignFee(+e.target.value)} className={inputCls} />
            </label>
          </div>
          <input
            placeholder="Notes (e.g. double-sided, rush job)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
          />

          {/* live build-up preview */}
          <div className="mt-4 rounded-xl border border-line bg-ink p-4 text-xs space-y-1.5">
            {calc.breakdown.map((b) => (
              <div key={b.component} className="flex justify-between text-fog">
                <span>
                  {b.component}: {b.option}
                  <span className="opacity-60"> ({b.units} {unitLabel[b.unit]})</span>
                </span>
                <span className={b.unitCost === 0 ? "text-volt" : "text-white"}>
                  {b.unitCost === 0 ? "TBD" : `₱${money(b.cost)}`}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-line font-display font-bold text-sm">
              <span className="text-white">Item total</span>
              <span className="text-volt">₱{money(previewTotal)}</span>
            </div>
          </div>

          <button
            onClick={addToQuote}
            className="mt-4 w-full rounded-xl bg-volt px-4 py-3.5 font-semibold text-ink text-sm hover:bg-volt-dim transition"
          >
            + Add to Quotation
          </button>
        </div>

        {/* actions */}
        <div className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-bold mb-4">Actions</h2>
          <div className="space-y-3">
            <button onClick={saveQuote} disabled={items.length === 0}
              className="w-full rounded-xl bg-volt px-4 py-3 font-semibold text-ink text-sm hover:bg-volt-dim transition disabled:opacity-40">
              Save Quote
            </button>
            <button onClick={() => window.print()} disabled={items.length === 0}
              className="w-full rounded-xl border border-line px-4 py-3 font-semibold text-sm hover:border-volt hover:text-volt transition disabled:opacity-40">
              Print / PDF
            </button>
          </div>
          {savedMsg && <p className="mt-4 text-xs text-volt">{savedMsg}</p>}
        </div>
      </div>

      {/* ================= RIGHT: printable quotation sheet ================= */}
      <div className="print-sheet rounded-2xl border border-line bg-panel p-6 sm:p-8">
        <div className="flex justify-between items-start pb-6 border-b border-line mb-6">
          <div>
            <p className="font-display font-bold text-xl">
              {site.name.toUpperCase()}<span className="text-volt">.</span>
            </p>
            <p className="text-fog text-xs mt-1">{site.domain} · {site.phone}</p>
          </div>
          <div className="text-right">
            <p className="font-display font-bold">QUOTATION</p>
            <p className="text-fog text-xs mt-1">{quoteNo}</p>
            <p className="text-fog text-xs">
              {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {(client.name || client.company) && (
          <p className="text-sm text-fog mb-6">
            Prepared for:{" "}
            <span className="text-white">
              {client.name} {client.company && `· ${client.company}`}
            </span>
          </p>
        )}

        {items.length === 0 && (
          <p className="text-fog text-sm py-16 text-center">
            No items yet — build a sign on the left and press &quot;Add to Quotation&quot;.
          </p>
        )}

        <div className="space-y-8">
          {items.map((item, idx) => (
            <div key={item.id} className="rounded-xl border border-line p-5 break-inside-avoid">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-fog uppercase">Item {idx + 1}</p>
                  <h3 className="font-display font-bold text-lg">{item.name}</h3>
                  <p className="text-xs text-fog mt-0.5">
                    {item.w} ft × {item.h} ft · qty {item.qty}
                  </p>
                </div>
                <div className="no-print flex gap-3 text-xs">
                  <button onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                    className="text-fog hover:text-red-400">Remove</button>
                </div>
              </div>

              {/* build-up table */}
              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="text-fog text-left border-b border-line">
                    <th className="py-1.5 font-medium">Component</th>
                    <th className="py-1.5 font-medium">Material</th>
                    <th className="py-1.5 font-medium text-right">Qty</th>
                    <th className="py-1.5 font-medium text-right">Unit cost</th>
                    <th className="py-1.5 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {item.breakdown.map((b) => (
                    <tr key={b.component} className="border-b border-line/50 text-white">
                      <td className="py-1.5">{b.component}</td>
                      <td className="py-1.5 text-fog">{b.option}</td>
                      <td className="py-1.5 text-right">{b.units} {unitLabel[b.unit]}</td>
                      <td className="py-1.5 text-right">{b.unitCost === 0 ? "TBD" : `₱${money(b.unitCost)}`}</td>
                      <td className="py-1.5 text-right">{b.unitCost === 0 ? "—" : `₱${money(b.cost)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* per-item commercial terms (editable on screen) */}
              <div className="no-print grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                <label className={labelCls}>Markup %
                  <input type="number" min="0" value={item.markupPct}
                    onChange={(e) => updateItem(item.id, { markupPct: +e.target.value })} className={inputCls} />
                </label>
                <label className={labelCls}>Install (₱)
                  <input type="number" min="0" value={item.installFee}
                    onChange={(e) => updateItem(item.id, { installFee: +e.target.value })} className={inputCls} />
                </label>
                <label className={labelCls}>Design (₱)
                  <input type="number" min="0" value={item.designFee}
                    onChange={(e) => updateItem(item.id, { designFee: +e.target.value })} className={inputCls} />
                </label>
                <label className={labelCls}>Discount %
                  <input type="number" min="0" max="100" value={item.discountPct}
                    onChange={(e) => updateItem(item.id, { discountPct: +e.target.value })} className={inputCls} />
                </label>
                <label className={labelCls}>Notes
                  <input value={item.notes}
                    onChange={(e) => updateItem(item.id, { notes: e.target.value })} className={inputCls} />
                </label>
              </div>

              <div className="flex justify-between items-center text-sm">
                <p className="text-xs text-fog">
                  Materials ₱{money(item.materialCost)}
                  {item.breakdown.some((b) => b.unitCost === 0) && (
                    <span className="text-volt ml-2">⚠ some material prices TBD</span>
                  )}
                </p>
                <p className="font-display font-bold text-volt text-lg">₱{money(item.total)}</p>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-8 pt-6 border-t border-line flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-fog">
                <span>Subtotal</span><span className="text-white">₱{money(totals.sub)}</span>
              </div>
              <div className="flex justify-between text-fog">
                <span>VAT (12%)</span><span className="text-white">₱{money(totals.vat)}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-xl pt-2 border-t border-line">
                <span>Total</span><span className="text-volt">₱{money(totals.grand)}</span>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-xs text-fog">
          Valid for 30 days. 50% downpayment required to commence production.
          Prices subject to site survey confirmation.
        </p>
      </div>
    </div>
  );
}
