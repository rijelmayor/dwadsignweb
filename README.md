# Delight Works AdSign — dwadsign.com

Landing page + **3D sign configurator & quotation system**.

## Brand

- **Delight Works · Advertising & Signages**
- Colors: deep navy `#011424`, gold `#f3b33c`, teal `#1ecac9`
- **Get a Quote** → https://www.facebook.com/DWSignages

## Pages

| Path | Purpose |
|------|---------|
| `/` | Public landing (content from DB or defaults) |
| `/quotebuilder` | Sales tool — configure signs, live 3D, build & print quotes |
| `/buildersettings` | Admin — landing copy, quote defaults, material catalog |

## Setup

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
# Run supabase/schema.sql in Supabase SQL Editor
npm run dev
```

Without Supabase the site uses built-in defaults; quotes save to `localStorage`.

## Filling prices

Edit materials at **/buildersettings → Sign Catalog**.  
`pricePerUnit: 0` shows as **TBD**.

## Stack

Next.js 15 · Tailwind 4 · React Three Fiber · Supabase

## Panaflex Quote Builder update

The builder now treats Panaflex as a dimension-first workflow:

1. Height, Width, Thickness
2. Face: Panaflex, Tarp, APC, Acrylic, Metal Sheet, Custom Build Face
3. Lighting: With Light / Without Light
4. Printing: Sticker print / Direct print to materials / UV print
5. Client logo
6. Clean white 3D face with dimension arrows
7. Quote specification directly below client details for print/PDF output

### Supabase pricing

`site_settings` continues to hold the builder configuration. The `quote` JSON now contains `panaflexPricing` with square-foot rates for internal construction, each face build, lighting, printing, and a minimum charge. Builder Settings saves these values to Supabase; Quote Builder reads them when calculating a quote.

No new pricing table is required for this first Panaflex implementation.
