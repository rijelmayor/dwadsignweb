import type { Metadata } from "next";
import QuoteBuilder from "./QuoteBuilder";

export const metadata: Metadata = {
  title: "Quotation Builder",
  robots: { index: false }, // keep the tool out of search engines
};

export default function QuotePage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="no-print mb-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-volt text-xs font-semibold tracking-[0.3em] uppercase">
              Internal Tool — Sales Team
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">
              Quotation Builder
            </h1>
          </div>
          <a
            href="/"
            className="text-sm text-fog hover:text-volt transition"
          >
            ← Back to site
          </a>
        </div>
        <QuoteBuilder />
      </div>
    </main>
  );
}
