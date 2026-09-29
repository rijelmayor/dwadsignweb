# Delight Works AdSign — dwadsign.com

Landing page + **3D Panaflex sign configurator & quotation system**.

## Brand

- **Delight Works · Advertising & Signages**
- Colors: deep navy `#011424`, gold `#f3b33c`, teal `#1ecac9`
- **Get a Quote** → https://www.facebook.com/DWSignages

## Pages

| Path | Purpose |
|------|---------|
| `/` | Public landing (content from DB or defaults) |
| `/quotebuilder` | Panaflex 3D builder — dimensions, face, lighting, printing, live 3D, download PNG/JPG for client |
| `/buildersettings` | Admin — landing copy, Panaflex pricing rates, material catalog |

## Setup

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
# Run supabase/schema.sql in Supabase SQL Editor (creates tables + seeds pricing)
npm run dev
```

Without Supabase the site uses built-in defaults (prices = 0 / TBD).

## Panaflex Quote Builder (focus)

Dimension-first workflow — focus is on **3D design + pricing**, not client forms:

1. **Height, Width, Thickness** (ft / in)
2. **Face**: Panaflex · Tarp · APC · Acrylic · Metal Sheet · Custom
3. **Lighting**: With Light / Without Light
4. **Printing**: Sticker · Direct print · UV print
5. Optional logo / design upload
6. **3D preview** — clean face with dimension arrows on **all sides** (W / H / T) and visible numbers
7. Capture 3D PNG into the quote line → **Download PNG or JPG** image to send to the client

### Client image export

| Button | Output |
|--------|--------|
| **Download PNG** | Full quote sheet (logo, 3D mockup, specs, totals) as high-res PNG |
| **Download JPG** | Same sheet as JPEG (smaller file, good for chat/email) |
| **3D Mockup PNG** | Only the 3D render with dimension arrows |

No PDF / print flow — image is the deliverable for the client.

### Supabase tables

Run `supabase/schema.sql` once. It creates:

| Table | Purpose |
|-------|---------|
| `site_settings` | key/value JSONB. Key `quote` holds `panaflexPricing` (sqft rates) + markup/VAT. Key `catalog` holds sign types. |
| `quotes` | Saved quotations (`quote_no`, `client`, `lines` with `mockupPng`, `totals`, `status`) |

Pricing formula:

```
unit = max(minimumCharge, (construction + face + lighting + printing) × sqft × (1 + markup%))
```

Starter rates are seeded in the schema. Edit anytime at **/buildersettings → Quote**.

## Stack

Next.js 15 · Tailwind 4 · React Three Fiber · Supabase · html-to-image
