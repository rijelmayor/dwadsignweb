import type { ServiceItem } from "@/lib/settings";
export default function Services({ services }: { services: ServiceItem[] }) {
  const cols = services.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <section id="services" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-4">What we do</p>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-16">Everything your brand needs to be seen.</h2>
        <div className={`grid gap-6 sm:grid-cols-2 ${cols}`}>
          {services.map((s) => (
            <div key={s.title} className="group rounded-2xl border border-line bg-panel p-8 hover:border-gold hover:-translate-y-1 transition duration-300">
              <div className="text-gold text-3xl mb-6">{s.icon}</div>
              <h3 className="font-display text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-fog text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
