# DW AdSign Landing Page Changes

## v3 — studio redesign + mobile/tablet fixes
- Page order: Hero → Selected work → What we create → From idea to installation → Why Delight Works → (Trusted by) → Have a project in mind? → Create. Achieve. Live.
- Hero: full-screen photo (Builder Settings, else first project photo), headline "powers on" like a lit sign, cursor-reactive light on desktop only.
- Selected work: swipeable on phones, editorial grid on tablet/desktop, optional Location + "What we did" per project, swipe/keys in the viewer.
- What we create: expanding panels (hover on desktop, tap on phone) with an editable "included items" list per service.
- Process is now 5 steps; "Why Delight Works" holds the team photo and optional verified numbers.
- Trust numbers and client logos are hidden until you add real ones in Builder Settings.
- Project form saves to Supabase `inquiries` (run `supabase/migrations/20261003_project_inquiries.sql`); falls back to the visitor's email app if not set up.
- "Get a Quote" buttons still go to the Facebook page.

### Responsiveness fixes
- Viewport + theme-color defined; sideways scrolling blocked; iOS no longer zooms into form fields.
- `100vh` replaced with `dvh` so phone address bars no longer cut off the menu, viewer or 3D view.
- Hover-only information (project details, button states) now always visible on touch screens.
- Mobile menu is a full-screen sheet with scroll lock and 44px+ touch targets.
- Quote Builder: header buttons scroll instead of overflowing, and the live 3D view sits at the top (sticky) on phones/tablets.

## v2
- Header uses the supplied DW logo only.
- Projects / Work uses direct image uploads to Supabase Storage.
- Project categories drive automatic portfolio filters.
