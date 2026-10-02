# DW AdSign Project Gallery

## New workflow

Builder Settings → Landing Page → Projects / Work:

1. Click **+ Add Project**.
2. Enter the project title.
3. Enter a category such as Signage, LED Neon, Large Format, Branding, or Wall Mural.
4. Click **Choose image** and select the project image from your computer.
5. Click **Save Landing Settings**.

There is no Project URL field and no need to place portfolio images in GitHub.

## Supabase

Run the complete `supabase/schema.sql` once in the Supabase SQL Editor. The appended section creates the public `landing-assets` bucket and the policies required for the Builder Settings upload.

Each project image is stored as a separate object under `landing-assets/projects/`. The landing settings JSON stores only the resulting public image URL.

## Portfolio behavior

The public Projects / Work section automatically:

- creates category filters from project tags;
- initially shows 9 projects;
- adds a Load More button when there are more projects;
- uses a varied editorial card layout instead of a monotonous grid;
- opens each project in a full-screen glass viewer;
- lazy-loads portfolio images.

Existing project `url` values are preserved for compatibility, but the Builder Settings interface no longer asks you for them.
