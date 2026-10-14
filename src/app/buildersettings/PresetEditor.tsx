"use client";

import type { Dispatch, SetStateAction } from "react";
import type { QuoteSettings } from "@/lib/settings";
import { FAMILIES, PRESETS } from "@/lib/presets";

const input = "w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white focus:border-teal outline-none";
const label = "block text-xs font-semibold tracking-wider uppercase text-fog mb-1.5";

export default function PresetEditor({ quote, setQuote }: { quote: QuoteSettings; setQuote: Dispatch<SetStateAction<QuoteSettings>> }) {
  const ps = quote.presetSettings;
  const patch = (p: Partial<typeof ps>) => setQuote((q) => ({ ...q, presetSettings: { ...q.presetSettings, ...p } }));
  const setRate = (id: string, key: "rate" | "rateDouble", v: number) =>
    patch({ rates: { ...ps.rates, [id]: { ...ps.rates[id], [key]: v } } });
  const num = (v: string) => +v || 0;
  return (
    <section className="rounded-2xl border border-line bg-panel/50 p-5 space-y-5">
      <div>
        <h3 className="font-display text-lg font-bold">Build presets · cost per sqft</h3>
        <p className="text-xs text-fog mt-1">Cost before markup. Starter values are placeholders. For acrylic and LED neon enter the fabrication rate only (print, labor, LED); the acrylic sheet is added from the sheet prices below. Double-face 0 = single × 2.</p>
      </div>
      {FAMILIES.map(([fid, fname]) => (
        <div key={fid} className="space-y-2 border-t border-line pt-3">
          <div className="flex flex-wrap items-end gap-3">
            <p className="font-semibold text-sm w-44">{fname}</p>
            <div className="w-28"><label className={label}>Markup %</label><input type="number" min={0} className={input} value={ps.markup[fid]} onChange={(e) => patch({ markup: { ...ps.markup, [fid]: num(e.target.value) } })} /></div>
            <div className="w-36"><label className={label}>Minimum / sign ₱</label><input type="number" min={0} className={input} value={ps.minimum[fid]} onChange={(e) => patch({ minimum: { ...ps.minimum, [fid]: num(e.target.value) } })} /></div>
          </div>
          {PRESETS.filter((p) => p.family === fid).map((p) => (
            <div key={p.id} className="grid sm:grid-cols-[1fr_8rem_8rem] gap-3 items-end">
              <p className="text-xs text-fog">{p.name}</p>
              <div><label className={label}>Single ₱/sqft</label><input type="number" min={0} className={input} value={ps.rates[p.id]?.rate ?? 0} onChange={(e) => setRate(p.id, "rate", num(e.target.value))} /></div>
              <div><label className={label}>Double ₱/sqft</label><input type="number" min={0} className={input} value={ps.rates[p.id]?.rateDouble ?? 0} onChange={(e) => setRate(p.id, "rateDouble", num(e.target.value))} /></div>
            </div>
          ))}
        </div>
      ))}
      <div className="border-t border-line pt-3 grid sm:grid-cols-3 gap-3">
        <div><label className={label}>3mm piece (4×2 ft) ₱</label><input type="number" min={0} className={input} value={ps.sheets.thinPiece} onChange={(e) => patch({ sheets: { ...ps.sheets, thinPiece: num(e.target.value) } })} /></div>
        <div><label className={label}>3mm whole sheet ₱</label><input type="number" min={0} className={input} value={ps.sheets.thinFull} onChange={(e) => patch({ sheets: { ...ps.sheets, thinFull: num(e.target.value) } })} /></div>
        <div><label className={label}>Above 3mm whole sheet ₱</label><input type="number" min={0} className={input} value={ps.sheets.thickFull} onChange={(e) => patch({ sheets: { ...ps.sheets, thickFull: num(e.target.value) } })} /></div>
        <div><label className={label}>Neon: more than 2 colors +%</label><input type="number" min={0} className={input} value={ps.neonColorAddonPct} onChange={(e) => patch({ neonColorAddonPct: num(e.target.value) })} /></div>
        <div><label className={label}>Rush order surcharge %</label><input type="number" min={0} className={input} value={ps.rushPct} onChange={(e) => patch({ rushPct: num(e.target.value) })} /></div>
        <div><label className={label}>Mobilization default ₱</label><input type="number" min={0} className={input} value={ps.mobilSmall} onChange={(e) => patch({ mobilSmall: num(e.target.value) })} /></div>
        <div><label className={label}>Mobilization, large sign ₱</label><input type="number" min={0} className={input} value={ps.mobilLarge} onChange={(e) => patch({ mobilLarge: num(e.target.value) })} /></div>
        <div><label className={label}>Large sign above (sqft)</label><input type="number" min={0} className={input} value={ps.mobilThresholdSqft} onChange={(e) => patch({ mobilThresholdSqft: num(e.target.value) })} /></div>
      </div>
    </section>
  );
}
