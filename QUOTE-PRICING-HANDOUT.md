# Delight Works / AdSign — Quote Builder Pricing Handout

## 1. The rule to follow

Keep pricing in simple **₱ per square foot** tables. The Quote Builder calculates: **measured area (sq ft) × the selected rate × quantity**. It selects the “With light” rate when lighting is enabled and “Without light” when lighting is off. Light/no-light remains available.

Acrylic has a separate per-sqft table because its rate depends on the selected acrylic build (flat panel, flat-cut letters, build-up letters, LED letters, or acrylic box).

## 2. Optional adjustments

- **Double face:** adds an editable percentage to the single-face amount. Default setting: 25%. For example, a ₱1,000 single-face amount with a 25% add-on becomes ₱1,250. Set the percentage to 0 to disable it. This is not a 2× multiplier.
- **LED neon with more than two colours:** applies the editable “Neon: more than 2 colors +%” percentage to the measured per-sqft neon rate. Default: 0%. One or two colours do not trigger it.
- **Mobilization, rush surcharge, construction/frame rate, printing rates, and minimum charges:** default to ₱0 / 0% so they do not silently add cost. Add values only when you intentionally want them included.
- **VAT:** currently not added to the Quote Builder total; the existing UI notes VAT is handled manually on the Official Receipt.

## 3. Where to edit rates

1. Open **Builder Settings → Quote**.
2. Edit **Material rates · ₱ / sqft** for Panaflex, Neon LED, APC, Tarp, Sticker, Metal Sheet, Custom, and Lightbox types. Fill both “Without light” and “With light” as required.
3. Edit **Acrylic rates · ₱ / sqft** separately. Select the matching acrylic build in Quote Builder.
4. Set **Double-face surcharge %** and **Neon: more than 2 colors +%** only if needed.
5. Leave extras at zero if you want only the rate-table computation.
6. Click **Save Quote & Pricing to Supabase** and wait for the success message. The saved record is `site_settings` → `quote`.
7. Set roll-up banner prices and the Signage Repair rate under Additional products & services if you use them.
8. Refresh Quote Builder and test a known size. Confirm the chosen material, lighting option, area, quantity, and final line price.

## 4. Important distinction: main tables vs legacy presets

The **simple per-sqft tables above are the intended source of truth** for the pricing rule. The legacy “Build presets · cost per sqft” section remains in settings for compatibility with existing presets and older saved configurations; it is not the place to maintain the main material rate card. Keep its rates/markup/minimums at zero unless you specifically use a legacy preset workflow. Acrylic pricing is separate in the dedicated Acrylic table.

## 5. Products and services not yet part of the standard rate card

Roll-up banners are selectable Quote Builder line items with three fixed-size options: Small (2 × 5 ft), Medium (2.5 × 6 ft), and Large (3 × 6 ft). Each size has its own editable fixed price in Builder Settings → Quote, all defaulting to ₱0. Signage Repair is a selectable service priced by measured width × height × editable ₱/sqft rate; its default rate is ₱0. Set the rates under Additional products & services, then save Quote & Pricing to Supabase.

## 6. Save troubleshooting

- Check the page shows a successful “Saved quote” status; an error means it did not save.
- Confirm Supabase environment variables are configured and the signed-in account has permission to upsert `site_settings`.
- After saving, reload Builder Settings and confirm the values persist; then reload Quote Builder.
- If values persist in settings but the quote total does not change, verify the chosen service/build and light/no-light selection use the rate row you edited.
