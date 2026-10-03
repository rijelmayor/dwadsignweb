const steps = [
  {
    n: "01",
    title: "Brief & Site Survey",
    desc: "Tell us the goal. We measure, photograph, and check mounting surfaces and power.",
  },
  {
    n: "02",
    title: "Design & Quotation",
    desc: "Concepts with exact pricing. Your sales specialist builds your quote in minutes.",
  },
  {
    n: "03",
    title: "Fabrication",
    desc: "In-house production with materials matched to your environment and budget.",
  },
  {
    n: "04",
    title: "Install & Handover",
    desc: "Certified installation, clean wiring, and a walkthrough before we leave.",
  },
];

export default function Process() {
  return (
    <section id="process" className="relative px-6 py-24 border-t border-white/10 overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <p className="text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-4">How it works</p>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-16">
          From idea to installed in four steps.
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="group relative border-l border-line pl-6 hover:border-teal/50 transition duration-300"
            >
              <span className="font-display text-gradient text-4xl font-bold transition duration-300 group-hover:scale-110 origin-left inline-block">
                {s.n}
              </span>
              <h3 className="font-display font-bold text-lg mt-4 mb-2 group-hover:text-gold transition-colors">
                {s.title}
              </h3>
              <p className="text-fog text-sm leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-8 text-line text-xl opacity-40 group-hover:opacity-70 transition">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
