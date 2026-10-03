"use client";

import { useState } from "react";
import type { ServiceItem } from "@/lib/settings";

export default function Services({ services }: { services: ServiceItem[]; background?: string }) {
  const [active, setActive] = useState(0);

  return (
    <section id="services" className="relative border-t border-white/10 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="mb-8 max-w-3xl font-display text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-balance sm:mb-12">
          What we create
        </h2>

        <div className="flex flex-col gap-3 lg:h-[34rem] lg:flex-row">
          {services.map((s, i) => {
            const on = active === i;
            return (
              <article
                key={`${s.title}-${i}`}
                data-active={on}
                tabIndex={0}
                aria-expanded={on}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="group water-card relative cursor-pointer overflow-hidden rounded-[1.75rem] border border-white/10 bg-panel outline-none transition-[flex-grow,height] duration-500 ease-out focus-visible:border-teal max-lg:h-24 max-lg:data-[active=true]:h-[26rem] lg:flex-[1_1_0%] lg:data-[active=true]:flex-[3_1_0%]"
              >
                {s.background && (
                  <img
                    src={s.background}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover opacity-30 transition duration-700 group-data-[active=true]:scale-105 group-data-[active=true]:opacity-60"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />

                <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-7">
                  <div className="flex items-end justify-between gap-4">
                    <h3 className="font-display text-2xl font-extrabold uppercase leading-none tracking-[-0.02em] sm:text-3xl">
                      {s.title}
                    </h3>
                    <span aria-hidden className="text-2xl text-gold transition-transform duration-500 group-data-[active=true]:rotate-45">
                      {s.icon}
                    </span>
                  </div>

                  <div className="grid grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-500 group-data-[active=true]:grid-rows-[1fr] opacity-0 group-data-[active=true]:opacity-100">
                    <div className="overflow-hidden">
                      <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">{s.desc}</p>
                      {s.items.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {s.items.map((it) => (
                            <li key={it} className="glass-panel rounded-full px-3.5 py-1.5 text-xs font-medium text-white/90 sm:text-sm">
                              {it}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
