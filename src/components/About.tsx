import type { LandingSettings } from "@/lib/settings";

const reasons = [
  {
    title: "One team, start to finish",
    desc: "Design, fabrication and installation are handled by the same people, so nothing gets lost between trades.",
  },
  {
    title: "Priced before we cut",
    desc: "You get an itemised quotation with a 3D render of your sign before production starts.",
  },
  {
    title: "Materials matched to the site",
    desc: "Panaflex, acrylic, metal or LED — chosen for your location, weather and budget, not for what's easiest to make.",
  },
];

export default function About({
  branding,
  stats,
}: {
  branding: LandingSettings["branding"];
  stats: LandingSettings["stats"];
}) {
  return (
    <section id="about" className="relative border-t border-white/10 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <h2 className="font-display text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-balance">
            Why Delight Works
          </h2>
          <ul className="mt-8 divide-y divide-white/10 border-y border-white/10 sm:mt-12">
            {reasons.map((r) => (
              <li key={r.title} className="py-5 sm:py-6">
                <h3 className="font-display text-xl font-bold sm:text-2xl">{r.title}</h3>
                <p className="mt-1.5 max-w-xl text-fog sm:text-lg">{r.desc}</p>
              </li>
            ))}
          </ul>

          {stats.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-4xl font-extrabold tracking-tight text-gold sm:text-5xl">{s.value}</dd>
                  <dd className="mt-1 text-sm text-fog">{s.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="water-card glass-panel relative aspect-[4/5] overflow-hidden rounded-[2rem] p-2 sm:aspect-[4/3] lg:aspect-auto lg:min-h-[28rem]">
          {branding.teamImage ? (
            <>
              <img
                src={branding.teamImage}
                alt={`The ${branding.companyName} team`}
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-[1.5rem] object-cover"
              />
              <div className="glass-panel absolute inset-x-5 bottom-5 rounded-2xl px-5 py-4">
                <p className="font-display text-lg font-bold">The team behind the work</p>
                <p className="text-sm text-fog">Design, fabrication and installation.</p>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-panel-2 to-ink p-8 text-center">
              <p className="max-w-[16rem] text-sm text-fog">Add your team photo in Builder Settings and it appears here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
