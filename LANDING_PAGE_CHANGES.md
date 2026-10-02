# Landing Page Rework

- Builder Settings → Landing Page now controls the header logo, company name, hero team image, section/service background images, and project URLs.
- Uploaded header logos are optimized for web display and a TIFF master is saved in `branding.logoTiffData`.
- Project links are stored in Supabase `site_settings.value.projects[].url`; no GitHub-root file is required.
- The hero no longer shows the floating DW mark; it uses the configurable team image.
- Services and work cards use glassmorphism and liquid/water hover motion.
- The supplied DW logo is installed as `public/dwlogo.png` and `public/logo-full.png`.
