import type { ClientItem } from "@/lib/settings";

/** Renders nothing until at least one client is added in Builder Settings. */
export default function Trust({ clients }: { clients: ClientItem[] }) {
  if (!clients.length) return null;
  return (
    <section aria-labelledby="trust-title" className="relative border-t border-white/10 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 id="trust-title" className="font-display text-2xl font-bold sm:text-3xl">
          Trusted by businesses that want to be seen
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {clients.map((c, i) => (
            <li
              key={`${c.name}-${i}`}
              className="glass-panel flex h-20 items-center justify-center rounded-2xl px-4 text-center sm:h-24"
            >
              {c.logo ? (
                <img
                  src={c.logo}
                  alt={c.name}
                  loading="lazy"
                  className="max-h-10 w-auto max-w-full object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0 sm:max-h-12"
                />
              ) : (
                <span className="font-display text-sm font-bold text-fog">{c.name}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
