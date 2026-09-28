const steps = [
  { n: "01", title: "Brief & Site Survey", desc: "Tell us the goal. We measure, photograph, and check mounting surfaces and power." },
  { n: "02", title: "Design & Quotation", desc: "Concepts with exact pricing. Your sales specialist builds your quote in minutes." },
  { n: "03", title: "Fabrication", desc: "In-house production with materials matched to your environment and budget." },
  { n: "04", title: "Install & Handover", desc: "Certified installation, clean wiring, and a walkthrough before we leave." },
];

export default function Process() {
  return (
    <section id="process" className="px-6 py-24 border-t border-line">
      <div className="mx-auto max-w-7xl">
        <p className="text-volt text-sm font-semibold tracking-[0.3em] uppercase mb-4">
          How it works
        </p>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-16">
          From idea to installed in four steps.
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="border-l border-line pl-6">
              <span className="font-display text-volt text-4xl font-bold">{s.n}</span>
              <h3 className="font-display font-bold text-lg mt-4 mb-2">{s.title}</h3>
              <p className="text-fog text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
