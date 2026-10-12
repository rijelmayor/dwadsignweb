import type { LandingSettings } from "@/lib/settings";

export default function Contact({
  contact,
  links,
}: {
  contact: LandingSettings["contact"];
  links: LandingSettings["links"];
}) {
  return (
    <section id="contact" className="relative px-4 sm:px-6 py-16 sm:py-24 border-t border-white/10 overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gold/8 blur-[100px]" />
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <p className="text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-3 sm:mb-4">Get in touch</p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 sm:mb-8">
            Let&apos;s put your name in lights.
          </h2>
          <div className="space-y-5 text-fog">
            <p>
              <span className="text-white font-semibold block text-sm mb-0.5">Phone</span>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-gold transition">
                {contact.phone}
              </a>
            </p>
            <p>
              <span className="text-white font-semibold block text-sm mb-0.5">Email</span>
              <a href={`mailto:${contact.email}`} className="hover:text-gold transition">
                {contact.email}
              </a>
            </p>
            <p>
              <span className="text-white font-semibold block text-sm mb-0.5">Studio</span>
              {contact.address}
            </p>
            <p>
              <span className="text-white font-semibold block text-sm mb-0.5">Hours</span>
              {contact.hours}
            </p>
          </div>
        </div>

        {/* CTA panel — no form; quote builder + social stay primary */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-center gap-6">
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Ready for a quote?
            </h3>
            <p className="text-fog text-sm sm:text-base leading-relaxed">
              Build your signage project online or message us directly — we&apos;ll get back to you fast.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/quotebuilder"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 font-semibold text-ink hover:bg-gold-dim transition hover:shadow-[0_0_32px_rgba(243,179,60,0.4)]"
            >
              Get a Quote
              <span aria-hidden>→</span>
            </a>
            <a
              href={links.facebook || links.quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gold/60 px-6 py-4 text-sm font-semibold text-gold hover:bg-gold hover:text-ink transition duration-300 hover:shadow-[0_0_28px_rgba(243,179,60,0.35)]"
            >
              Message on Facebook
            </a>
          </div>

          <p className="text-fog/70 text-xs sm:text-sm">
            Prefer a call? Reach us at{" "}
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="text-white hover:text-gold transition">
              {contact.phone}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
