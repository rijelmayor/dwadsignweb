"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_LANDING,
  DEFAULT_QUOTE_SETTINGS,
  mergeLanding,
  mergeQuoteSettings,
  type LandingSettings,
  type QuoteSettings,
} from "@/lib/settings";
import {
  DEFAULT_SIGN_TYPES,
  mergeCatalog,
  PREVIEW_KINDS,
  COMPONENT_ROLES,
  slug,
  type SignType,
  type UnitSystem,
  type PreviewKind,
  type ComponentRole,
} from "@/lib/catalog";
import { site } from "@/lib/site";

type Tab = "landing" | "quote" | "catalog";

const input =
  "w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white placeholder:text-fog/50 focus:border-teal outline-none";
const label = "block text-xs font-semibold tracking-wider uppercase text-fog mb-1.5";

export default function BuilderSettings() {
  const [tab, setTab] = useState<Tab>("landing");
  const [landing, setLanding] = useState<LandingSettings>(DEFAULT_LANDING);
  const [quote, setQuote] = useState<QuoteSettings>(DEFAULT_QUOTE_SETTINGS);
  const [catalog, setCatalog] = useState<SignType[]>(DEFAULT_SIGN_TYPES);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      if (!sb) {
        setLoading(false);
        return;
      }
      const { data } = await sb.from("site_settings").select("key,value").in("key", ["landing", "quote", "catalog"]);
      if (data) {
        for (const row of data) {
          if (row.key === "landing") setLanding(mergeLanding(row.value));
          if (row.key === "quote") setQuote(mergeQuoteSettings(row.value));
          if (row.key === "catalog") setCatalog(mergeCatalog(row.value));
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save(key: string, value: unknown) {
    setSaving(true);
    setStatus("");
    const sb = createClient();
    if (!sb) {
      setStatus("Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY in .env.local");
      setSaving(false);
      return;
    }
    const { error } = await sb.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
    setStatus(error ? `Error: ${error.message}` : `Saved "${key}" ✓`);
    setSaving(false);
    setTimeout(() => setStatus(""), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-fog">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/logo-mark.png" alt="DW" width={100} height={48} className="h-8 w-auto" />
            </Link>
            <span className="font-display font-bold text-sm">
              Builder Settings <span className="text-fog font-normal">· {site.name}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/quotebuilder" className="text-fog hover:text-gold transition">Quote Builder</Link>
            <Link href="/" className="text-fog hover:text-gold transition">Landing</Link>
          </div>
        </div>
        {status && (
          <div className={`text-center text-sm py-1.5 ${status.startsWith("Error") ? "bg-red-900/40 text-red-300" : "bg-teal/20 text-teal"}`}>
            {status}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex gap-2 mb-8">
          {([
            ["landing", "Landing Page"],
            ["quote", "Quote Defaults"],
            ["catalog", "Sign Catalog"],
          ] as const).map(([id, name]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                tab === id ? "bg-gold text-ink" : "border border-line text-fog hover:border-gold"
              }`}>
              {name}
            </button>
          ))}
        </div>

        {tab === "landing" && (
          <div className="space-y-8">
            <section className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">Hero</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Eyebrow</label>
                  <input className={input} value={landing.hero.eyebrow}
                    onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, eyebrow: e.target.value } })} />
                </div>
                <div>
                  <label className={label}>CTA label</label>
                  <input className={input} value={landing.hero.ctaLabel}
                    onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, ctaLabel: e.target.value } })} />
                </div>
                <div>
                  <label className={label}>Headline start</label>
                  <input className={input} value={landing.hero.headline}
                    onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, headline: e.target.value } })} />
                </div>
                <div>
                  <label className={label}>Accent word</label>
                  <input className={input} value={landing.hero.accent}
                    onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, accent: e.target.value } })} />
                </div>
                <div>
                  <label className={label}>Headline end</label>
                  <input className={input} value={landing.hero.headlineEnd}
                    onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, headlineEnd: e.target.value } })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Subtext</label>
                  <textarea className={`${input} min-h-[80px]`} value={landing.hero.sub}
                    onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, sub: e.target.value } })} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">Marquee items</h2>
              <p className="text-xs text-fog">Comma-separated</p>
              <input className={input} value={landing.marquee.join(", ")}
                onChange={(e) =>
                  setLanding({
                    ...landing,
                    marquee: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                } />
            </section>

            <section className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-xl font-bold">Services</h2>
                <button className="text-sm text-teal hover:underline"
                  onClick={() =>
                    setLanding({
                      ...landing,
                      services: [...landing.services, { title: "New service", desc: "", icon: "◆" }],
                    })
                  }>
                  + Add
                </button>
              </div>
              {landing.services.map((s, i) => (
                <div key={i} className="grid sm:grid-cols-[60px_1fr_1fr_auto] gap-3 items-start border-t border-line pt-4">
                  <div>
                    <label className={label}>Icon</label>
                    <input className={input} value={s.icon} onChange={(e) => {
                      const services = [...landing.services];
                      services[i] = { ...s, icon: e.target.value };
                      setLanding({ ...landing, services });
                    }} />
                  </div>
                  <div>
                    <label className={label}>Title</label>
                    <input className={input} value={s.title} onChange={(e) => {
                      const services = [...landing.services];
                      services[i] = { ...s, title: e.target.value };
                      setLanding({ ...landing, services });
                    }} />
                  </div>
                  <div>
                    <label className={label}>Description</label>
                    <input className={input} value={s.desc} onChange={(e) => {
                      const services = [...landing.services];
                      services[i] = { ...s, desc: e.target.value };
                      setLanding({ ...landing, services });
                    }} />
                  </div>
                  <button className="text-red-400 text-sm mt-6"
                    onClick={() => setLanding({ ...landing, services: landing.services.filter((_, j) => j !== i) })}>
                    Remove
                  </button>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-xl font-bold">Projects / Work</h2>
                <button className="text-sm text-teal hover:underline"
                  onClick={() =>
                    setLanding({
                      ...landing,
                      projects: [...landing.projects, { title: "New project", tag: "", image: "" }],
                    })
                  }>
                  + Add
                </button>
              </div>
              {landing.projects.map((p, i) => (
                <div key={i} className="grid sm:grid-cols-3 gap-3 border-t border-line pt-4">
                  <div>
                    <label className={label}>Title</label>
                    <input className={input} value={p.title} onChange={(e) => {
                      const projects = [...landing.projects];
                      projects[i] = { ...p, title: e.target.value };
                      setLanding({ ...landing, projects });
                    }} />
                  </div>
                  <div>
                    <label className={label}>Tag</label>
                    <input className={input} value={p.tag} onChange={(e) => {
                      const projects = [...landing.projects];
                      projects[i] = { ...p, tag: e.target.value };
                      setLanding({ ...landing, projects });
                    }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className={label}>Image URL</label>
                      <input className={input} value={p.image} onChange={(e) => {
                        const projects = [...landing.projects];
                        projects[i] = { ...p, image: e.target.value };
                        setLanding({ ...landing, projects });
                      }} />
                    </div>
                    <button className="text-red-400 text-sm self-end mb-2"
                      onClick={() => setLanding({ ...landing, projects: landing.projects.filter((_, j) => j !== i) })}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">Contact & Links</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(["phone", "email", "address", "hours"] as const).map((k) => (
                  <div key={k}>
                    <label className={label}>{k}</label>
                    <input className={input} value={landing.contact[k]}
                      onChange={(e) => setLanding({ ...landing, contact: { ...landing.contact, [k]: e.target.value } })} />
                  </div>
                ))}
                <div>
                  <label className={label}>Quote / CTA URL</label>
                  <input className={input} value={landing.links.quoteUrl}
                    onChange={(e) => setLanding({ ...landing, links: { ...landing.links, quoteUrl: e.target.value } })} />
                </div>
                <div>
                  <label className={label}>Facebook</label>
                  <input className={input} value={landing.links.facebook}
                    onChange={(e) => setLanding({ ...landing, links: { ...landing.links, facebook: e.target.value } })} />
                </div>
                <div>
                  <label className={label}>Instagram (optional)</label>
                  <input className={input} value={landing.links.instagram}
                    onChange={(e) => setLanding({ ...landing, links: { ...landing.links, instagram: e.target.value } })} />
                </div>
              </div>
            </section>

            <button disabled={saving} onClick={() => save("landing", landing)}
              className="rounded-full bg-gold px-8 py-3 font-semibold text-ink hover:bg-gold-dim transition disabled:opacity-50">
              {saving ? "Saving…" : "Save Landing Settings"}
            </button>
          </div>
        )}

        {tab === "quote" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Global quotation</p>
                <h2 className="font-display text-xl font-bold">Quote defaults</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className={label}>Markup %</label><input type="number" className={input} value={quote.markupPct} onChange={(e) => setQuote({ ...quote, markupPct: +e.target.value || 0 })} /></div>
                <div><label className={label}>VAT %</label><input type="number" className={input} value={quote.vatPct} onChange={(e) => setQuote({ ...quote, vatPct: +e.target.value || 0 })} /></div>
                <div><label className={label}>Quote # prefix</label><input className={input} value={quote.quotePrefix} onChange={(e) => setQuote({ ...quote, quotePrefix: e.target.value })} /></div>
                <div><label className={label}>Prepared-by title</label><input className={input} value={quote.preparedByTitle} onChange={(e) => setQuote({ ...quote, preparedByTitle: e.target.value })} /></div>
              </div>
              <div><label className={label}>Terms (one per line)</label><textarea className={`${input} min-h-[120px]`} value={quote.terms.join("\n")} onChange={(e) => setQuote({ ...quote, terms: e.target.value.split("\n").map((t) => t.trim()).filter(Boolean) })} /></div>
            </section>

            <section className="rounded-2xl border border-teal/30 bg-panel p-6 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-teal font-bold">Panaflex pricing engine</p>
                <h2 className="font-display text-xl font-bold">Square-foot pricing</h2>
                <p className="text-sm text-fog mt-1">These rates are stored in Supabase under <strong>site_settings → quote → panaflexPricing</strong>. The Quote Builder calculates area × rate, then applies the global markup.</p>
              </div>

              <div>
                <label className={label}>Internal construction / frame rate · per sqft</label>
                <input type="number" min={0} step={0.01} className={input} value={quote.panaflexPricing.constructionPerSqft} onChange={(e) => setQuote({ ...quote, panaflexPricing: { ...quote.panaflexPricing, constructionPerSqft: +e.target.value || 0 } })} />
                <p className="text-[11px] text-fog mt-1">Not shown as a customer-facing frame option. It remains part of the internal cost calculation.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Service / material rate · ₱ / sqft (per face)</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {([['panaflex','Panaflex'],['acrylic','Acrylic'],['neon','Neon LED'],['apc','APC'],['tarp','Tarp'],['sticker','Sticker'],['metal','Metal Sheet'],['custom','Custom']] as const).map(([id, name]) => (
                    <div key={id}><label className={label}>{name}</label><input type="number" min={0} step={0.01} className={input} value={quote.panaflexPricing.face[id]} onChange={(e) => setQuote({ ...quote, panaflexPricing: { ...quote.panaflexPricing, face: { ...quote.panaflexPricing.face, [id]: +e.target.value || 0 } } })} /></div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Lighting · ₱ / sqft</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {([['without','Without Light'],['with','With Light']] as const).map(([id, name]) => (
                    <div key={id}><label className={label}>{name}</label><input type="number" min={0} step={0.01} className={input} value={quote.panaflexPricing.lighting[id]} onChange={(e) => setQuote({ ...quote, panaflexPricing: { ...quote.panaflexPricing, lighting: { ...quote.panaflexPricing.lighting, [id]: +e.target.value || 0 } } })} /></div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Printing · ₱ / sqft</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {([['direct','Direct to materials'],['sticker','Sticker print'],['cutout','Sticker Cut Out'],['uv','UV Print']] as const).map(([id, name]) => (
                    <div key={id}><label className={label}>{name}</label><input type="number" min={0} step={0.01} className={input} value={quote.panaflexPricing.printing[id]} onChange={(e) => setQuote({ ...quote, panaflexPricing: { ...quote.panaflexPricing, printing: { ...quote.panaflexPricing.printing, [id]: +e.target.value || 0 } } })} /></div>
                  ))}
                </div>
              </div>

              <div><label className={label}>Minimum charge · per sign</label><input type="number" min={0} step={0.01} className={input} value={quote.panaflexPricing.minimumCharge} onChange={(e) => setQuote({ ...quote, panaflexPricing: { ...quote.panaflexPricing, minimumCharge: +e.target.value || 0 } })} /></div>
            </section>

            <section className="rounded-2xl border border-teal/30 bg-panel p-6 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-teal font-bold">Lightbox pricing</p>
                <h2 className="font-display text-xl font-bold">Lightbox · circle max 3 ft</h2>
                <p className="text-sm text-fog mt-1">Stored under <strong>site_settings → quote → lightboxRoundPricing</strong>. Quote Builder calculates face area (circle π × r², or W × H) × rate, then applies the global markup.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><label className={label}>Built-up · ₱ / sqft</label><input type="number" min={0} step={0.01} className={input} value={quote.lightboxRoundPricing.builtUp} onChange={(e) => setQuote({ ...quote, lightboxRoundPricing: { ...quote.lightboxRoundPricing, builtUp: +e.target.value || 0 } })} /></div>
                <div><label className={label}>Acrylic build · ₱ / sqft</label><input type="number" min={0} step={0.01} className={input} value={quote.lightboxRoundPricing.acrylic} onChange={(e) => setQuote({ ...quote, lightboxRoundPricing: { ...quote.lightboxRoundPricing, acrylic: +e.target.value || 0 } })} /></div>
                <div><label className={label}>Minimum charge · per sign</label><input type="number" min={0} step={0.01} className={input} value={quote.lightboxRoundPricing.minimumCharge} onChange={(e) => setQuote({ ...quote, lightboxRoundPricing: { ...quote.lightboxRoundPricing, minimumCharge: +e.target.value || 0 } })} /></div>
              </div>
            </section>

            <button disabled={saving} onClick={() => save("quote", quote)} className="rounded-full bg-gold px-8 py-3 font-semibold text-ink hover:bg-gold-dim transition disabled:opacity-50">
              {saving ? "Saving…" : "Save Quote, Panaflex & Lightbox Pricing to Supabase"}
            </button>
          </div>
        )}

        {tab === "catalog" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl font-bold">Sign types & materials</h2>
              <button className="text-sm text-teal hover:underline"
                onClick={() => {
                  const id = slug(`sign-${catalog.length + 1}`);
                  setCatalog([
                    ...catalog,
                    {
                      id,
                      name: "New Sign Type",
                      desc: "",
                      preview: "panaflex",
                      components: [
                        {
                          id: "face",
                          name: "Face",
                          role: "face",
                          options: [{ id: "opt-1", name: "Standard", pricePerUnit: 0, unit: "sqft" }],
                        },
                      ],
                    },
                  ]);
                }}>
                + Add sign type
              </button>
            </div>

            {catalog.map((st, si) => (
              <section key={st.id} className="rounded-2xl border border-line bg-panel p-6 space-y-4">
                <div className="flex justify-between gap-4">
                  <div className="grid sm:grid-cols-2 gap-3 flex-1">
                    <div>
                      <label className={label}>Name</label>
                      <input className={input} value={st.name} onChange={(e) => {
                        const next = [...catalog];
                        next[si] = { ...st, name: e.target.value };
                        setCatalog(next);
                      }} />
                    </div>
                    <div>
                      <label className={label}>Preview style</label>
                      <select className={input} value={st.preview} onChange={(e) => {
                        const next = [...catalog];
                        next[si] = { ...st, preview: e.target.value as PreviewKind };
                        setCatalog(next);
                      }}>
                        {PREVIEW_KINDS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>Description</label>
                      <input className={input} value={st.desc} onChange={(e) => {
                        const next = [...catalog];
                        next[si] = { ...st, desc: e.target.value };
                        setCatalog(next);
                      }} />
                    </div>
                  </div>
                  <button className="text-red-400 text-sm self-start"
                    onClick={() => setCatalog(catalog.filter((_, j) => j !== si))}>
                    Remove type
                  </button>
                </div>

                {st.components.map((c, ci) => (
                  <div key={c.id} className="border-t border-line pt-4 ml-2 space-y-3">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <label className={label}>Component</label>
                        <input className={input} value={c.name} onChange={(e) => {
                          const next = [...catalog];
                          const comps = [...st.components];
                          comps[ci] = { ...c, name: e.target.value };
                          next[si] = { ...st, components: comps };
                          setCatalog(next);
                        }} />
                      </div>
                      <div>
                        <label className={label}>3D role</label>
                        <select className={input} value={c.role ?? "other"} onChange={(e) => {
                          const next = [...catalog];
                          const comps = [...st.components];
                          comps[ci] = { ...c, role: e.target.value as ComponentRole };
                          next[si] = { ...st, components: comps };
                          setCatalog(next);
                        }}>
                          {COMPONENT_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                      <button className="text-red-400 text-xs mb-2" onClick={() => {
                        const next = [...catalog];
                        next[si] = { ...st, components: st.components.filter((_, j) => j !== ci) };
                        setCatalog(next);
                      }}>
                        Remove component
                      </button>
                    </div>

                    {c.options.map((o, oi) => (
                      <div key={o.id} className="grid grid-cols-[1fr_100px_80px_auto] gap-2 ml-4">
                        <input className={input} value={o.name} placeholder="Material name" onChange={(e) => {
                          const next = [...catalog];
                          const comps = [...st.components];
                          const opts = [...c.options];
                          opts[oi] = { ...o, name: e.target.value };
                          comps[ci] = { ...c, options: opts };
                          next[si] = { ...st, components: comps };
                          setCatalog(next);
                        }} />
                        <input type="number" className={input} value={o.pricePerUnit} placeholder="Price" onChange={(e) => {
                          const next = [...catalog];
                          const comps = [...st.components];
                          const opts = [...c.options];
                          opts[oi] = { ...o, pricePerUnit: +e.target.value || 0 };
                          comps[ci] = { ...c, options: opts };
                          next[si] = { ...st, components: comps };
                          setCatalog(next);
                        }} />
                        <select className={input} value={o.unit} onChange={(e) => {
                          const next = [...catalog];
                          const comps = [...st.components];
                          const opts = [...c.options];
                          opts[oi] = { ...o, unit: e.target.value as UnitSystem };
                          comps[ci] = { ...c, options: opts };
                          next[si] = { ...st, components: comps };
                          setCatalog(next);
                        }}>
                          <option value="sqft">sqft</option>
                          <option value="lm">lm</option>
                          <option value="pcs">pcs</option>
                        </select>
                        <button className="text-red-400 text-xs" onClick={() => {
                          const next = [...catalog];
                          const comps = [...st.components];
                          comps[ci] = { ...c, options: c.options.filter((_, j) => j !== oi) };
                          next[si] = { ...st, components: comps };
                          setCatalog(next);
                        }}>✕</button>
                      </div>
                    ))}
                    <button className="text-xs text-teal ml-4 hover:underline" onClick={() => {
                      const next = [...catalog];
                      const comps = [...st.components];
                      const opts = [...c.options, { id: slug("opt"), name: "New option", pricePerUnit: 0, unit: "sqft" as UnitSystem }];
                      comps[ci] = { ...c, options: opts };
                      next[si] = { ...st, components: comps };
                      setCatalog(next);
                    }}>
                      + Option
                    </button>
                  </div>
                ))}

                <button className="text-sm text-teal hover:underline" onClick={() => {
                  const next = [...catalog];
                  next[si] = {
                    ...st,
                    components: [
                      ...st.components,
                      {
                        id: slug("comp"),
                        name: "New component",
                        role: "other",
                        options: [{ id: slug("opt"), name: "Default", pricePerUnit: 0, unit: "pcs" }],
                      },
                    ],
                  };
                  setCatalog(next);
                }}>
                  + Component
                </button>
              </section>
            ))}

            <button disabled={saving} onClick={() => save("catalog", catalog)}
              className="rounded-full bg-gold px-8 py-3 font-semibold text-ink hover:bg-gold-dim transition disabled:opacity-50">
              {saving ? "Saving…" : "Save Catalog"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
