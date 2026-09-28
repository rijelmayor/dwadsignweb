import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Not configured yet — the app gracefully falls back to localStorage mode.
  if (!url || !key || url.includes("YOUR-PROJECT")) return null;

  return createBrowserClient(url, key);
}
