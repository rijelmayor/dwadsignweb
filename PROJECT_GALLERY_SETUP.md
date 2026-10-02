# DW AdSign — Projects / Work image gallery

## Supabase setup

Run this migration once in your Supabase SQL Editor:

`supabase/migrations/20261002_landing_project_storage.sql`

It creates the public `landing-assets` Storage bucket and the policies required for the Builder Settings image uploader.

You do **not** need to create the bucket manually.

## Adding a project

Go to:

**Builder Settings → Landing Page → Projects / Work**

For each project:

1. Add the project title.
2. Select a category/tag.
3. Choose the project image from your computer.
4. Save Landing Settings.

The image is uploaded individually to Supabase Storage under `landing-assets/projects/`. The landing-page settings store the resulting public image address as project metadata.

There is no need to enter an image URL and no need to place project images in GitHub.

## Gallery behavior

- Projects are displayed in an editorial/masonry-style portfolio.
- Category filters are generated from project categories.
- The first 9 projects are shown initially.
- Additional projects are revealed with **Load More**.
- Project images are lazy-loaded where supported.
- Clicking a project opens the larger glassmorphism viewer.
