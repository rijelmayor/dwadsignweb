import type { LandingSettings } from "@/lib/settings";

const field =
  "w-full rounded-xl border border-line bg-panel px-5 py-4 text-white placeholder:text-fog/60 focus:border-teal focus:ring-1 focus:ring-teal/30 outline-none transition";

export default function Contact({
  contact,
  links,
}: {
  contact: LandingSettings["contact"];
  links: LandingSettings["links"];
}) {
  return (
    <section id="contact" className="relative px-6 py-24 border-t border-white/10 overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gold/8 blur-[100px]" />
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16">
        <div>
          <p className="text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-4">Get in touch</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-8">
            Let&apos;s put your name in lights.
          </h2>
          <div className="space-y-5 text-fog">
            <p>
              <span className="text-white font-semibold block text-sm mb-0.5">Phone</span>
              {contact.phone}
            </p>
            <p>
              <span className="text-white font-semibold block text-sm mb-0.5">Email</span>
              {contact.email}
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
          <a
            href={links.quoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-gold px-6 py-3 text-sm font-semibold text-gold hover:bg-gold hover:text-ink transition duration-300 hover:shadow-[0_0_28px_rgba(243,179,60,0.35)]"
          >
            Message us on Facebook
            <span aria-hidden>→</span>
          </a>
        </div>
        <form
          action={`mailto:${contact.email}`}
          method="post"
          encType="text/plain"
          className="space-y-4 glass-panel rounded-3xl p-6 sm:p-8"
        >
          <input required name="name" placeholder="Your name" className={field} />
          <input required name="email" placeholder="Email or phone" className={field} />
          <textarea
            required
            name="message"
            rows={5}
            placeholder="Tell us about your project…"
            className={`${field} resize-none`}
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-gold px-8 py-4 font-semibold text-ink hover:bg-gold-dim transition hover:shadow-[0_0_32px_rgba(243,179,60,0.4)]"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
