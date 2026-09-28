import { site } from "@/lib/site";

export default function Contact() {
  return (
    <section id="contact" className="px-6 py-24 border-t border-line">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16">
        <div>
          <p className="text-volt text-sm font-semibold tracking-[0.3em] uppercase mb-4">
            Get in touch
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-8">
            Let&apos;s put your name in lights.
          </h2>
          <div className="space-y-4 text-fog">
            <p>
              <span className="text-white font-semibold block text-sm">Phone</span>
              {site.phone}
            </p>
            <p>
              <span className="text-white font-semibold block text-sm">Email</span>
              {site.email}
            </p>
            <p>
              <span className="text-white font-semibold block text-sm">Studio</span>
              {site.address}
            </p>
            <p>
              <span className="text-white font-semibold block text-sm">Hours</span>
              {site.hours}
            </p>
          </div>
        </div>
        <form
          action={`mailto:${site.email}`}
          method="post"
          encType="text/plain"
          className="space-y-4"
        >
          <input
            required
            name="name"
            placeholder="Your name"
            className="w-full rounded-xl border border-line bg-panel px-5 py-4 text-white placeholder:text-fog/60 focus:border-volt outline-none"
          />
          <input
            required
            name="email"
            type="email"
            placeholder="Email or phone"
            className="w-full rounded-xl border border-line bg-panel px-5 py-4 text-white placeholder:text-fog/60 focus:border-volt outline-none"
          />
          <textarea
            required
            name="message"
            rows={5}
            placeholder="Tell us about your project…"
            className="w-full rounded-xl border border-line bg-panel px-5 py-4 text-white placeholder:text-fog/60 focus:border-volt outline-none resize-none"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-volt px-8 py-4 font-semibold text-ink hover:bg-volt-dim transition"
          >
            Send Message
          </button>
          <p className="text-xs text-fog">
            Tip: connect this form to a Supabase table or Vercel serverless route later for
            structured inquiries — see README.
          </p>
        </form>
      </div>
    </section>
  );
}
