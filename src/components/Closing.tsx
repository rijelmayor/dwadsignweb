const words = [
  { word: "Create.", line: "Ideas become visual identities." },
  { word: "Achieve.", line: "Brands become visible." },
  { word: "Live.", line: "Businesses become memorable." },
];

export default function Closing() {
  return (
    <section aria-label="Create. Achieve. Live." className="relative overflow-hidden border-t border-white/10 py-20 sm:py-28 lg:py-36">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[60rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {words.map((w, i) => (
            <div key={w.word} className="border-t border-white/15 pt-5">
              <p
                className={`font-display text-[clamp(3rem,9vw,6.5rem)] font-extrabold uppercase leading-none tracking-[-0.035em] ${
                  i === 2 ? "text-white [text-shadow:0_0_.3em_rgba(30,202,201,.7),0_0_.9em_rgba(30,202,201,.35)]" : "outline-text"
                }`}
              >
                {w.word}
              </p>
              <p className="mt-4 text-fog sm:text-lg">{w.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
