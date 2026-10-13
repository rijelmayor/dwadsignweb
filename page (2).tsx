import QuoteBuilder from "./QuoteBuilder";

export const metadata = {
  title: "Quote Builder",
  description: "Build and print sign quotations with live 3D preview.",
  robots: "noindex" as const,
};

export default function QuoteBuilderPage() {
  return <QuoteBuilder />;
}
