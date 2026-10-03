const steps = [
  { title: "Discover", desc: "Tell us the goal. We visit, measure and check the mounting surface and power." },
  { title: "Design", desc: "A visual direction and an exact quotation, built by your sales specialist in minutes." },
  { title: "Produce", desc: "In-house fabrication and printing, with materials matched to your space and budget." },
  { title: "Install", desc: "Certified installation and clean wiring by the team that built it." },
  { title: "Deliver", desc: "A walkthrough before we leave, and a finished sign that's ready for business." },
];

export default function Process() {
  return (
    <section id="process" className="relative border-t border-white/10 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="mb-10 max-w-4xl font-display text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-balance sm:mb-16">
          From idea to installation
        </h2>

        <ol className="relative grid gap-0 md:grid-cols-5 md:gap-6">
          <div aria-hidden className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-gradient-to-b from-teal/60 via-line to-gold/50 md:left-0 md:right-0 md:top-[1.15rem] md:bottom-auto md:h-px md:w-auto md:bg-gradient-to-r" />
          {steps.map((s, i) => (
            <li key={s.title} className="relative pb-9 pl-14 last:pb-0 md:pb-0 md:pl-0 md:pt-14">
              <span className="absolute left-0 top-0 flex h-[2.3rem] w-[2.3rem] items-center justify-center rounded-full border border-teal/60 bg-ink font-display text-sm font-bold tabular-nums text-teal">
                {i + 1}
              </span>
              <h3 className="font-display text-xl font-bold sm:text-2xl">{s.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-fog sm:text-base">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
