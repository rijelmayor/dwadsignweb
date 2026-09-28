const services = [
  {
    title: "Signages",
    desc: "3D acrylic letters, lightboxes, LED neon flex, and wayfinding systems — fabricated in-house.",
    icon: "◼",
  },
  {
    title: "Large Format Print",
    desc: "Tarpaulin banners, stickers, decals, and UV prints at production-grade quality.",
    icon: "▤",
  },
  {
    title: "Vehicle Wrapping",
    desc: "Partial and full wraps that turn every delivery into a moving billboard.",
    icon: "▣",
  },
  {
    title: "Branding & Display",
    desc: "Roll-up banners, wall murals, trade-show displays, and complete brand environments.",
    icon: "◈",
  },
];

export default function Services() {
  return (
    <section id="services" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="text-volt text-sm font-semibold tracking-[0.3em] uppercase mb-4">
          What we do
        </p>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-16">
          Everything your brand needs to be seen.
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-line bg-panel p-8 hover:border-volt transition"
            >
              <div className="text-volt text-3xl mb-6">{s.icon}</div>
              <h3 className="font-display text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-fog text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
