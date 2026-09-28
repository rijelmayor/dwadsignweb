# DWA Sign — dwadsign.com

Modern landing page + **visual sign configurator & quotation system** for the
advertising & signages business.

**Stack:** Next.js 15 (App Router) · Tailwind CSS 4 · Supabase · Deployed on Vercel via GitHub.

---

## 1. Quick start (local)

```bash
npm install
npm run dev          # http://localhost:3000
```

- Landing page → `http://localhost:3000`
- Quotation tool → `http://localhost:3000/quote`

No environment variables are required to run — until Supabase is configured,
quotes save to the browser's localStorage (so the tool works from day one).

## 2. Deploy to Vercel (from GitHub)

1. Create a new repo at github.com, push this project:
   ```bash
   git init && git add -A && git commit -m "init: dwadsign website"
   git branch -M main
   git remote add origin git@github.com:YOUR-USER/dwadsign.git
   git push -u origin main
   ```
2. vercel.com → **Add New Project** → import the repo → Deploy (zero config needed).
3. vercel.com → Project → Settings → Domains → add `dwadsign.com`,
   then point your DNS (A record `76.76.21.21`, or CNAME `cname.vercel-dns.com`).

Every push to `main` auto-deploys. Preview deployments are created per branch/PR.

## 3. Connect Supabase

1. supabase.com → New Project → get the **Project URL** + **anon public** key
   (Project Settings → API).
2. Copy `.env.example` to `.env.local`, fill in the values.
3. In the Supabase SQL Editor, run `supabase/schema.sql`.
4. `npm run dev` — the **Save Quote** button now writes to the `quotes` table.

## 4. The Quotation System (`/quote`) — how your sales team builds a sign

Instead of picking from a flat price list, the specialist **builds the product
layer by layer**, with a live mockup watching every choice:

1. **Pick the sign type** — Panaflex Sign, LED Lightbox, 3D Acrylic Letters, LED Neon Flex.
2. **Watch the mockup react** — a live SVG drawing of the sign shows real proportions
   from the width/height entered, frame thickness per metal choice, a glow when
   lighting is added, poles when freestanding, and dimension arrows in feet.
3. **Choose the build-up**, e.g. for a Panaflex sign:
   - *Frame (metal)* — 1×1 angle bar / 1×2 angle bar / metal stud → priced per **linear ft of perimeter**
   - *Face (panaflex)* — 13oz / 15oz / backlit film → priced per **sq ft of face**
   - *Lighting* — none / exposed LED / internal backlight → per sq ft
   - *Mounting* — wall / pole / rooftop support
   - *Frame finish* — primer + enamel / powder coat
4. **Set size, qty, markup, fees, discount** — the item total computes live from
   the component build-up.
5. **Add to Quotation** — each item lands on the quote sheet with a full
   component-by-component breakdown table (material, qty, unit cost, amount),
   ready to **Print / PDF** or **Save** (Supabase, or localStorage before setup).

### Adding your raw prices (the important part for later)

All pricing lives in **one file: `src/lib/catalog.ts`**.

Every material option currently has `pricePerUnit: 0`. When your raw price
build-up is ready, fill in the numbers:

```ts
{ id: "angle-1x1", name: "1×1 angle bar, welded + primer", pricePerUnit: 95, unit: "lm" },
{ id: "pf-13oz", name: "Panaflex 13oz, printed", pricePerUnit: 38, unit: "sqft" },
```

Commit → push → Vercel redeploys in ~30 seconds and the sales team quotes with
live prices. Options still at 0 show **"price TBD"** and a ⚠ warning on the
quote sheet, so nothing is quoted blind.

### Adding new sign types or materials

Copy a block in `SIGN_TYPES` — the tabs, mockup behavior, dropdowns, and math
all update automatically. Units per component:

| Unit | Billed on | Typical for |
|---|---|---|
| `sqft` | width × height | faces, print, neon |
| `lm` | 2 × (width + height) | frames, raceways, trims |
| `pcs` | flat per sign | power supplies, mounting |

## 5. Roadmap (future-proof hooks already in place)

- [ ] **Lock down `/quote`** — enable Supabase Auth (email invite per specialist),
      then gate the page by session in `src/app/quote/page.tsx`.
- [ ] **Supabase price sync** — move `catalog.ts` data into the `price_list`
      table so prices are edited from a dashboard instead of code.
- [ ] **Quote history** — list/filter the `quotes` table by status
      (`draft / sent / approved / won / lost`).
- [ ] **Client approval links** — public `/quote/[id]` view so clients approve online.
- [ ] **Photo upload on mockup** — let specialists drop the client's logo onto
      the SVG mockup for a realistic preview (Supabase Storage).
- [ ] **Contact form endpoint** — replace `mailto:` with a serverless route
      writing inquiries to Supabase.
- [ ] **Portfolio CMS** — swap placeholder work cards for Supabase Storage images.

## 6. Customizing the brand

| What | Where |
|---|---|
| Business name, phone, email, address | `src/lib/site.ts` |
| Colors, fonts | `src/app/globals.css` (`@theme`) |
| Sign types, materials, prices | `src/lib/catalog.ts` |
| Mockup rendering | `src/components/SignMockup.tsx` |
| Services list | `src/components/Services.tsx` |
| Portfolio projects | `src/components/Work.tsx` |
