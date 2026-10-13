# DW AdSign — Projects / Work gallery

## Supabase setup

Run this migration once in your Supabase SQL Editor:

`supabase/migrations/20261002_landing_project_storage.sql`

It creates the public `landing-assets` Storage bucket and the policies required for the Builder Settings uploader.

You do **not** need to create the bucket manually.

## Adding a project

Go to:

**Builder Settings → Landing Page → Projects / Work**

For each project:

1. Add the project title.
2. Select a category/tag.
3. Choose an **image** (PNG / JPEG / WebP) **or a short video** (MP4 / WebM / MOV, max ~80 MB).
4. Save Landing Settings.

Media is uploaded to Supabase Storage under `landing-assets/projects/`. The landing-page settings store the resulting public URL as project metadata.

There is no need to enter a media URL and no need to place project files in GitHub.

## Video behavior

- Videos play **muted** in the grid (loop + autoplay) and in the full-screen lightbox.
- Lightbox includes standard controls (still muted by default so the site stays quiet).
- A small play badge appears on video cards so visitors know it’s a clip.

## Gallery behavior

- Projects are displayed in an editorial/masonry-style portfolio.
- Category filters are generated from project categories.
- The first 9 projects are shown initially.
- Additional projects are revealed with **Load More**.
- Images are lazy-loaded where supported.
- Clicking a project opens the larger glassmorphism viewer.
