"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_LANDING,
  DEFAULT_QUOTE_SETTINGS,
  LIGHTBOX_RATES,
  MATERIAL_RATES,
  PRINTING_RATES,
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
const input = "w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white placeholder:text-fog/50 focus:border-teal outline-none";
const label = "block text-xs font-semibold tracking-wider uppercase text-fog mb-1.5";

async function fileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const source = await fileAsDataUrl(file);
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The selected file is not a readable image."));
    img.src = source;
  });
}

/** Fast resize + JPEG compress for project portfolio images (web-optimized). */
async function compressProjectImage(file: File, maxEdge = 1600, quality = 0.82): Promise<File> {
  // Skip compress for already-small files under ~400KB
  if (file.size < 400_000 && (file.type === "image/jpeg" || file.type === "image/webp")) {
    return file;
  }
  const image = await loadImageFromFile(file);
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(image, 0, 0, width, height);
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg", lastModified: Date.now() });
}

async function imageFileToOptimizedPng(file: File): Promise<{ png: string; tiff: string }> {
  const image = await loadImageFromFile(file);

  const maxW = 1600;
  const maxH = 600;
  const scale = Math.min(1, maxW / image.naturalWidth, maxH / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.drawImage(image, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const png = canvas.toDataURL("image/png");

  // Small, dependency-free uncompressed RGB TIFF encoder. The browser still renders the PNG,
  // while Supabase keeps the TIFF copy as the saved master/archive requested in Builder Settings.
  const entries = 10;
  const ifdStart = 8;
  const ifdSize = 2 + entries * 12 + 4;
  const bitsOffset = ifdStart + ifdSize;
  const xResOffset = bitsOffset + 6;
  const yResOffset = xResOffset + 8;
  const pixelOffset = yResOffset + 8;
  const pixelBytes = width * height * 3;
  const out = new ArrayBuffer(pixelOffset + pixelBytes);
  const view = new DataView(out);
  const bytes = new Uint8Array(out);
  bytes[0] = 0x49; bytes[1] = 0x49; // II / little endian
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdStart, true);
  view.setUint16(ifdStart, entries, true);
  let e = ifdStart + 2;
  const tag = (id: number, type: number, count: number, value: number) => {
    view.setUint16(e, id, true); view.setUint16(e + 2, type, true); view.setUint32(e + 4, count, true);
    if (type === 3 && count === 1) view.setUint16(e + 8, value, true); else view.setUint32(e + 8, value, true);
    e += 12;
  };
  tag(256, 4, 1, width); tag(257, 4, 1, height); tag(258, 3, 3, bitsOffset);
  tag(259, 3, 1, 1); tag(262, 3, 1, 2); tag(273, 4, 1, pixelOffset);
  tag(277, 3, 1, 3); tag(278, 4, 1, height); tag(279, 4, 1, pixelBytes); tag(296, 3, 1, 2);
  view.setUint32(ifdStart + 2 + entries * 12, 0, true);
  view.setUint16(bitsOffset, 8, true); view.setUint16(bitsOffset + 2, 8, true); view.setUint16(bitsOffset + 4, 8, true);
  view.setUint32(xResOffset, 72, true); view.setUint32(xResOffset + 4, 1, true);
  view.setUint32(yResOffset, 72, true); view.setUint32(yResOffset + 4, 1, true);
  let px = pixelOffset;
  for (let i = 0; i < pixels.length; i += 4) { bytes[px++] = pixels[i]; bytes[px++] = pixels[i + 1]; bytes[px++] = pixels[i + 2]; }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  return { png, tiff: `data:image/tiff;base64,${btoa(binary)}` };
}

export default function BuilderSettings() {
  const [tab, setTab] = useState<Tab>("landing");
  const [landing, setLanding] = useState<LandingSettings>(DEFAULT_LANDING);
  const [quote, setQuote] = useState<QuoteSettings>(DEFAULT_QUOTE_SETTINGS);
  const setPricing = (patch: Partial<QuoteSettings["pricing"]>) => setQuote((q) => ({ ...q, pricing: { ...q.pricing, ...patch } }));
  const setRate = (group: "materials" | "lightbox", id: string, key: "without" | "with", value: number) => setQuote((q) => ({ ...q, pricing: { ...q.pricing, [group]: { ...q.pricing[group], [id]: { ...q.pricing[group][id], [key]: value } } } }));
  const [catalog, setCatalog] = useState<SignType[]>(DEFAULT_SIGN_TYPES);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [teamFile, setTeamFile] = useState<File | null>(null);
  const [teamPreview, setTeamPreview] = useState("");
  const [projectFiles, setProjectFiles] = useState<Record<number, File>>({});
  const [projectPreviews, setProjectPreviews] = useState<Record<number, string>>({});
  const [uploadProgress, setUploadProgress] = useState("");

  useEffect(() => {
    async function load() {
      const sb = createClient();
      if (!sb) { setLoading(false); return; }
      const { data } = await sb.from("site_settings").select("key,value").in("key", ["landing", "quote", "catalog"]);
      if (data) for (const row of data) {
        if (row.key === "landing") { const merged = mergeLanding(row.value); setLanding(merged); setLogoPreview(merged.branding.logoUrl); setTeamPreview(merged.branding.teamImage); }
        if (row.key === "quote") setQuote(mergeQuoteSettings(row.value));
        if (row.key === "catalog") setCatalog(mergeCatalog(row.value));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save(key: string, value: unknown) {
    setSaving(true); setStatus("");
    const sb = createClient();
    if (!sb) { setStatus("Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY in .env.local"); setSaving(false); return; }
    const { error } = await sb.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
    setStatus(error ? `Error: ${error.message}` : `Saved "${key}" ✓`);
    setSaving(false); setTimeout(() => setStatus(""), 3000);
  }

  async function saveLanding() {
    setSaving(true); setStatus(""); setUploadProgress("");
    try {
      let next = landing;
      if (logoFile) {
        setUploadProgress("Optimizing logo…");
        const converted = await imageFileToOptimizedPng(logoFile);
        next = { ...next, branding: { ...next.branding, logoUrl: converted.png, logoTiffData: converted.tiff } };
      }
      if (teamFile) {
        setUploadProgress("Optimizing team image…");
        const team = await imageFileToOptimizedPng(teamFile);
        next = { ...next, branding: { ...next.branding, teamImage: team.png } };
      }
      const sb = createClient();
      if (!sb) { setStatus("Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY in .env.local"); setSaving(false); setUploadProgress(""); return; }

      // Project images: compress client-side, then upload in parallel for speed.
      const fileEntries = Object.entries(projectFiles);
      if (fileEntries.length) {
        setUploadProgress(`Compressing ${fileEntries.length} project image${fileEntries.length > 1 ? "s" : ""}…`);
        const uploaded = [...next.projects];
        const results = await Promise.all(
          fileEntries.map(async ([indexText, file]) => {
            const index = Number(indexText);
            if (!uploaded[index]) return null;
            const compressed = await compressProjectImage(file);
            const safeTitle =
              uploaded[index].title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
            const ext = compressed.type === "image/png" ? "png" : compressed.type === "image/webp" ? "webp" : "jpg";
            const path = `projects/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeTitle}.${ext}`;
            const { error: uploadError } = await sb.storage
              .from("landing-assets")
              .upload(path, compressed, {
                upsert: false,
                contentType: compressed.type || "image/jpeg",
                cacheControl: "31536000",
              });
            if (uploadError)
              throw new Error(
                `Project image upload failed: ${uploadError.message}. Run the landing-assets storage migration first.`
              );
            const { data: publicData } = sb.storage.from("landing-assets").getPublicUrl(path);
            return { index, url: publicData.publicUrl };
          })
        );
        setUploadProgress("Uploading to storage…");
        for (const r of results) {
          if (r) uploaded[r.index] = { ...uploaded[r.index], image: r.url };
        }
        next = { ...next, projects: uploaded };
      }

      setUploadProgress("Saving settings…");
      setLanding(next);
      setLogoPreview(next.branding.logoUrl);
      setTeamPreview(next.branding.teamImage);
      setLogoFile(null);
      setTeamFile(null);
      setProjectFiles({});
      setProjectPreviews({});
      const { error } = await sb
        .from("site_settings")
        .upsert({ key: "landing", value: next, updated_at: new Date().toISOString() });
      setStatus(error ? `Error: ${error.message}` : "Landing page saved ✓");
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unable to save landing page"}`);
    }
    setSaving(false);
    setUploadProgress("");
    setTimeout(() => setStatus(""), 4000);
  }

  function handleLogo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setLogoFile(f);
      setLogoPreview(URL.createObjectURL(f));
    }
  }
  function handleTeam(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setTeamFile(f);
      setTeamPreview(URL.createObjectURL(f));
    }
  }
  function handleProjectImage(index: number, file: File | undefined) {
    if (!file) return;
    setProjectFiles((files) => ({ ...files, [index]: file }));
    setProjectPreviews((previews) => {
      if (previews[index]) URL.revokeObjectURL(previews[index]);
      return { ...previews, [index]: URL.createObjectURL(file) };
    });
  }

  if (loading) return <div className="min-h-screen bg-ink flex items-center justify-center text-fog">Loading settings…</div>;

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/"><Image src="/dwlogo.png" alt="Delight Works" width={1016} height={240} className="h-8 w-auto max-w-[180px] object-contain" /></Link>
            <span className="hidden sm:block font-display font-bold text-sm truncate">Builder Settings <span className="text-fog font-normal">· {site.name}</span></span>
          </div>
          <div className="flex items-center gap-3 text-sm"><Link href="/quotebuilder" className="text-fog hover:text-gold transition">Quote Builder</Link><Link href="/" className="text-fog hover:text-gold transition">Landing</Link></div>
        </div>
        {(status || uploadProgress) && (
          <div className={`text-center text-sm py-1.5 ${status.startsWith("Error") ? "bg-red-900/40 text-red-300" : "bg-teal/20 text-teal"}`}>
            {uploadProgress || status}
            {uploadProgress && <div className="mx-auto mt-1 h-0.5 w-48 overflow-hidden rounded-full bg-white/10"><div className="upload-bar h-full w-full" /></div>}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {([["landing", "Landing Page"], ["quote", "Quote Defaults"], ["catalog", "Sign Catalog"]] as const).map(([id, name]) => <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${tab === id ? "bg-gold text-ink" : "border border-line text-fog hover:border-gold"}`}>{name}</button>)}
        </div>

        {tab === "landing" && (
          <div className="space-y-8">
            <section className="rounded-2xl border border-teal/30 bg-panel p-6 space-y-5">
              <div><p className="text-[10px] uppercase tracking-[0.2em] text-teal font-bold">Brand system</p><h2 className="font-display text-xl font-bold">Header logo & company name</h2><p className="text-xs text-fog mt-1">The web version is optimized as PNG. When you save a new logo, a TIFF master is generated and stored with the landing settings.</p></div>
              <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
                <div className="space-y-4">
                  <div><label className={label}>Company name beside logo</label><input className={input} value={landing.branding.companyName} onChange={(e) => setLanding({ ...landing, branding: { ...landing.branding, companyName: e.target.value } })} /></div>
                  <div><label className={label}>Header logo · PNG/JPG</label><input type="file" accept="image/png,image/jpeg" onChange={handleLogo} className="block w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-fog file:mr-3 file:rounded-md file:border-0 file:bg-gold file:px-3 file:py-1.5 file:font-semibold file:text-ink" /><p className="text-[11px] text-fog mt-2">Choose your attached DW logo or a replacement. Save Landing Settings to process it.</p></div>
                </div>
                <div className="rounded-xl border border-line bg-ink/60 p-4 min-h-28 flex items-center justify-center"><img src={logoPreview || landing.branding.logoUrl} alt="Logo preview" className="max-h-24 w-full object-contain" /></div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-panel p-6 space-y-5">
              <div><p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Hero</p><h2 className="font-display text-xl font-bold">Hero copy & team image</h2><p className="text-xs text-fog mt-1">The old floating DW mark has been removed. Use a real team photo here.</p></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={label}>Eyebrow</label><input className={input} value={landing.hero.eyebrow} onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, eyebrow: e.target.value } })} /></div>
                <div><label className={label}>CTA label</label><input className={input} value={landing.hero.ctaLabel} onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, ctaLabel: e.target.value } })} /></div>
                <div><label className={label}>Headline start</label><input className={input} value={landing.hero.headline} onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, headline: e.target.value } })} /></div>
                <div><label className={label}>Accent word</label><input className={input} value={landing.hero.accent} onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, accent: e.target.value } })} /></div>
                <div><label className={label}>Headline end</label><input className={input} value={landing.hero.headlineEnd} onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, headlineEnd: e.target.value } })} /></div>
                <div className="sm:col-span-2"><label className={label}>Subtext</label><textarea className={`${input} min-h-[80px]`} value={landing.hero.sub} onChange={(e) => setLanding({ ...landing, hero: { ...landing.hero, sub: e.target.value } })} /></div>
              </div>
              <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start border-t border-line pt-5">
                <div><label className={label}>Team photo · PNG/JPG</label><input type="file" accept="image/png,image/jpeg" onChange={handleTeam} className="block w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-fog file:mr-3 file:rounded-md file:border-0 file:bg-teal file:px-3 file:py-1.5 file:font-semibold file:text-ink" /><p className="text-[11px] text-fog mt-2">You can also leave this blank and paste an image URL in the field below.</p><input className={`${input} mt-3`} placeholder="Or paste team image URL" value={landing.branding.teamImage} onChange={(e) => setLanding({ ...landing, branding: { ...landing.branding, teamImage: e.target.value } })} /></div>
                <div className="rounded-xl border border-line bg-ink/60 overflow-hidden aspect-[4/3] flex items-center justify-center">{teamPreview || landing.branding.teamImage ? <img src={teamPreview || landing.branding.teamImage} alt="Team preview" className="h-full w-full object-cover" /> : <span className="text-xs text-fog">Team photo preview</span>}</div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-panel p-6 space-y-5">
              <h2 className="font-display text-xl font-bold">Marquee items</h2><p className="text-xs text-fog">Comma-separated</p>
              <input className={input} value={landing.marquee.join(", ")} onChange={(e) => setLanding({ ...landing, marquee: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </section>

            <section className="rounded-2xl border border-teal/30 bg-panel p-6 space-y-6">
              <div><p className="text-[10px] uppercase tracking-[0.2em] text-teal font-bold">Visual sections</p><h2 className="font-display text-xl font-bold">Background images</h2><p className="text-xs text-fog mt-1">Paste image URLs. These are stored in Supabase with the rest of your landing settings, so you do not need to put them in the root of GitHub.</p></div>
              <div><label className={label}>What we do · section background</label><input className={input} value={landing.sectionBackgrounds.whatWeDo} onChange={(e) => setLanding({ ...landing, sectionBackgrounds: { ...landing.sectionBackgrounds, whatWeDo: e.target.value } })} /></div>
              {landing.services.map((s, i) => <div key={i} className="grid lg:grid-cols-[180px_1fr] gap-4 border-t border-line pt-4"><div><label className={label}>Service</label><div className="rounded-lg border border-line bg-ink px-3 py-2 text-sm font-semibold">{s.title}</div></div><div><label className={label}>Background image URL</label><input className={input} value={s.background} onChange={(e) => { const services = [...landing.services]; services[i] = { ...s, background: e.target.value }; setLanding({ ...landing, services }); }} /></div></div>)}
            </section>

            <section className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <div className="flex justify-between items-center"><div><h2 className="font-display text-xl font-bold">Services</h2><p className="text-xs text-fog mt-1">Each service now supports its own background image.</p></div><button className="text-sm text-teal hover:underline" onClick={() => setLanding({ ...landing, services: [...landing.services, { title: "New service", desc: "", icon: "◆", background: "" }] })}>+ Add</button></div>
              {landing.services.map((s, i) => <div key={i} className="grid lg:grid-cols-[60px_1fr_1fr_auto] gap-3 items-start border-t border-line pt-4"><div><label className={label}>Icon</label><input className={input} value={s.icon} onChange={(e) => { const services = [...landing.services]; services[i] = { ...s, icon: e.target.value }; setLanding({ ...landing, services }); }} /></div><div><label className={label}>Title</label><input className={input} value={s.title} onChange={(e) => { const services = [...landing.services]; services[i] = { ...s, title: e.target.value }; setLanding({ ...landing, services }); }} /></div><div><label className={label}>Description</label><input className={input} value={s.desc} onChange={(e) => { const services = [...landing.services]; services[i] = { ...s, desc: e.target.value }; setLanding({ ...landing, services }); }} /></div><button className="text-red-400 text-sm mt-6" onClick={() => setLanding({ ...landing, services: landing.services.filter((_, j) => j !== i) })}>Remove</button></div>)}
            </section>

            <section className="rounded-2xl border border-teal/30 bg-panel p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-teal font-bold">Portfolio manager</p>
                  <h2 className="font-display text-xl font-bold">Projects / Work</h2>
                  <p className="text-xs text-fog mt-1">
                    Images are compressed in-browser and uploaded in parallel — much faster. Preview appears instantly.
                  </p>
                </div>
                <button
                  className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-ink hover:opacity-90 transition hover:shadow-[0_0_20px_rgba(30,202,201,0.4)]"
                  onClick={() =>
                    setLanding({
                      ...landing,
                      projects: [...landing.projects, { title: "New project", tag: "", image: "", url: "" }],
                    })
                  }
                >
                  + Add Project
                </button>
              </div>
              <div className="rounded-xl border border-line bg-ink/40 p-4 text-xs text-fog">
                Tip: add as many projects as you want. The public portfolio groups them by category, shows a polished
                gallery with keyboard navigation, and adds <strong className="text-white">Load more</strong> when the
                collection gets large. Large images are auto-resized to ~1600px and JPEG-compressed before upload.
              </div>
              <div className="space-y-4">
                {landing.projects.map((p, i) => {
                  const previewSrc = projectPreviews[i] || p.image;
                  const hasPending = Boolean(projectFiles[i]);
                  return (
                    <div
                      key={i}
                      className="grid lg:grid-cols-[120px_1fr_1fr_auto] gap-4 border-t border-line pt-4 items-start"
                    >
                      <label
                        className={`relative block aspect-[4/3] rounded-xl overflow-hidden border bg-ink cursor-pointer transition group ${
                          hasPending ? "border-teal ring-2 ring-teal/30" : "border-line hover:border-teal/50"
                        }`}
                      >
                        {previewSrc ? (
                          <img
                            src={previewSrc}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[11px] text-fog group-hover:text-teal transition">
                            <span className="text-lg opacity-50">+</span>
                            <span>No image</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(e) => handleProjectImage(i, e.target.files?.[0])}
                        />
                        <span
                          className={`absolute inset-x-1 bottom-1 rounded-lg px-2 py-1 text-center text-[10px] font-bold backdrop-blur transition ${
                            hasPending
                              ? "bg-teal/90 text-ink"
                              : "bg-ink/80 text-white group-hover:bg-teal/80 group-hover:text-ink"
                          }`}
                        >
                          {hasPending ? "Ready to save" : previewSrc ? "Replace image" : "Choose image"}
                        </span>
                      </label>
                      <div>
                        <label className={label}>Project title</label>
                        <input
                          className={input}
                          value={p.title}
                          onChange={(e) => {
                            const projects = [...landing.projects];
                            projects[i] = { ...p, title: e.target.value };
                            setLanding({ ...landing, projects });
                          }}
                        />
                      </div>
                      <div>
                        <label className={label}>Category</label>
                        <input
                          className={input}
                          placeholder="Signage, Branding, LED Neon…"
                          value={p.tag}
                          onChange={(e) => {
                            const projects = [...landing.projects];
                            projects[i] = { ...p, tag: e.target.value };
                            setLanding({ ...landing, projects });
                          }}
                        />
                        <p className="text-[10px] text-fog mt-1">Used for portfolio filters.</p>
                      </div>
                      <button
                        className="text-red-400 text-sm lg:mt-7 hover:text-red-300 transition"
                        onClick={() => {
                          const projects = landing.projects.filter((_, j) => j !== i);
                          const files = { ...projectFiles };
                          delete files[i];
                          const shifted: Record<number, File> = {};
                          Object.entries(files).forEach(([k, v]) => {
                            const n = Number(k);
                            shifted[n > i ? n - 1 : n] = v;
                          });
                          setProjectFiles(shifted);
                          if (projectPreviews[i]) URL.revokeObjectURL(projectPreviews[i]);
                          const prevs = { ...projectPreviews };
                          delete prevs[i];
                          const shiftedPrev: Record<number, string> = {};
                          Object.entries(prevs).forEach(([k, v]) => {
                            const n = Number(k);
                            shiftedPrev[n > i ? n - 1 : n] = v;
                          });
                          setProjectPreviews(shiftedPrev);
                          setLanding({ ...landing, projects });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-panel p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">Contact & Links</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(["phone", "email", "address", "hours"] as const).map((k) => <div key={k}><label className={label}>{k}</label><input className={input} value={landing.contact[k]} onChange={(e) => setLanding({ ...landing, contact: { ...landing.contact, [k]: e.target.value } })} /></div>)}
                <div><label className={label}>Quote / CTA URL</label><input className={input} value={landing.links.quoteUrl} onChange={(e) => setLanding({ ...landing, links: { ...landing.links, quoteUrl: e.target.value } })} /></div>
                <div><label className={label}>Facebook</label><input className={input} value={landing.links.facebook} onChange={(e) => setLanding({ ...landing, links: { ...landing.links, facebook: e.target.value } })} /></div>
                <div><label className={label}>Instagram (optional)</label><input className={input} value={landing.links.instagram} onChange={(e) => setLanding({ ...landing, links: { ...landing.links, instagram: e.target.value } })} /></div>
              </div>
            </section>

            <button disabled={saving} onClick={saveLanding} className="rounded-full bg-gold px-8 py-3 font-semibold text-ink hover:bg-gold-dim transition disabled:opacity-50">{saving ? "Saving…" : "Save Landing Settings"}</button>
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

            <section className="rounded-2xl border border-teal/30 bg-panel p-6 space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-teal font-bold">Pricing engine</p>
                <h2 className="font-display text-xl font-bold">Square-foot pricing · without / with light</h2>
                <p className="text-sm text-fog mt-1">Stored in Supabase under <strong>site_settings → quote → pricing</strong>. Every material has one rate per sqft for <strong>Without Light</strong> and one for <strong>With Light</strong>. The Quote Builder multiplies area × the matching rate (+ construction + printing), then applies the global markup.</p>
              </div>

              <div>
                <label className={label}>Internal construction / frame rate · ₱ per sqft</label>
                <input type="number" min={0} step={0.01} className={input} value={quote.pricing.constructionPerSqft} onChange={(e) => setPricing({ constructionPerSqft: +e.target.value || 0 })} />
                <p className="text-[11px] text-fog mt-1">Not shown to the customer. Added to every material except Sticker, Neon LED and Lightbox (their rate already covers the build).</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Material rates · ₱ / sqft</h3>
                <div className="rounded-xl border border-line overflow-hidden">
                  <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-3 bg-ink/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-fog">
                    <span>Material type</span><span>Without light</span><span>With light</span>
                  </div>
                  {[...MATERIAL_RATES.map(([id, name]) => ({ group: "materials" as const, id, name })), ...LIGHTBOX_RATES.map(([id, name]) => ({ group: "lightbox" as const, id, name }))].map(({ group, id, name }) => (
                    <div key={`${group}-${id}`} className="grid grid-cols-[1.2fr_1fr_1fr] gap-3 items-center px-4 py-2 border-t border-line">
                      <span className="text-sm font-semibold">{name}</span>
                      <input type="number" min={0} step={0.01} className={input} value={quote.pricing[group][id].without} onChange={(e) => setRate(group, id, "without", +e.target.value || 0)} />
                      <input type="number" min={0} step={0.01} className={input} value={quote.pricing[group][id].with} onChange={(e) => setRate(group, id, "with", +e.target.value || 0)} />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-fog mt-2">Lightbox circles are capped at 3 ft diameter in the builder. Double-face signs double the material and printing rates.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Printing · ₱ / sqft</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PRINTING_RATES.map(([id, name]) => (
                    <div key={id}><label className={label}>{name}</label><input type="number" min={0} step={0.01} className={input} value={quote.pricing.printing[id]} onChange={(e) => setPricing({ printing: { ...quote.pricing.printing, [id]: +e.target.value || 0 } })} /></div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className={label}>Minimum charge · per sign</label><input type="number" min={0} step={0.01} className={input} value={quote.pricing.minimumCharge} onChange={(e) => setPricing({ minimumCharge: +e.target.value || 0 })} /></div>
                <div><label className={label}>Lightbox minimum charge · per sign</label><input type="number" min={0} step={0.01} className={input} value={quote.pricing.lightboxMinimumCharge} onChange={(e) => setPricing({ lightboxMinimumCharge: +e.target.value || 0 })} /></div>
              </div>
            </section>

            <button disabled={saving} onClick={() => save("quote", quote)} className="rounded-full bg-gold px-8 py-3 font-semibold text-ink hover:bg-gold-dim transition disabled:opacity-50">
              {saving ? "Saving…" : "Save Quote & Pricing to Supabase"}
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
