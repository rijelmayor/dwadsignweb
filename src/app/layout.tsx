import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

const display = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const body = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(`https://${site.domain}`),
  title: { default: `${site.name} — ${site.descriptor}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.descriptor}`,
    description: site.description,
    url: `https://${site.domain}`,
    siteName: site.name,
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
