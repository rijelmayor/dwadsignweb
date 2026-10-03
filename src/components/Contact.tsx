"use client";

import { useState, type FormEvent } from "react";
import type { LandingSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";

const NEEDS = ["Signage", "Large format printing", "Branding", "Displays", "Installation", "Something else"];

const field =
  "w-full rounded-xl border border-line bg-panel/80 px-4 py-3.5 text-white placeholder:text-fog/60 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/25";

type Status = "idle" | "sending" | "sent" | "fallback";

const telHref = (phone: string) => {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.replace(/\D/g, "").length >= 7 && !/x/i.test(phone) ? `tel:${digits}` : "";
};

export default function Contact({
  contact,
  links,
}: {
  contact: LandingSettings["contact"];
  links: LandingSettings["links"];
}) {
  const [needs, setNeeds] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  const toggle = (n: string) => setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (String(fd.get("website") ?? "")) return; // honeypot
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      contact: String(fd.get("contact") ?? "").trim(),
      location: String(fd.get("location") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
      needs,
    };
    setStatus("sending");
    const sb = createClient();
    if (sb) {
      const { error } = await sb.from("inquiries").insert(payload);
      if (!error) {
        setStatus("sent");
        form.reset();
        setNeeds([]);
        return;
      }
    }
    // Supabase not configured / migration not run yet: open the visitor's email app with the brief filled in.
    const body = `Name: ${payload.name}\nContact: ${payload.contact}\nLocation: ${payload.location}\nNeeds: ${needs.join(", ") || "-"}\n\n${payload.message}`;
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent("Project inquiry")}&body=${encodeURIComponent(body)}`;
    setStatus("fallback");
  }

  const tel = telHref(contact.phone);

  return (
    <section id="contact" className="relative overflow-hidden border-t border-white/10 py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-gold/10 blur-[110px]" />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <h2 className="font-display text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-balance">
            Have a project in mind?
          </h2>
          <p className="mt-4 max-w-md text-fog sm:text-lg">
            Tell us what you&apos;re building. We&apos;ll reply with questions, a site visit, or a quotation.
          </p>

          <dl className="mt-8 space-y-5">
            <div>
              <dt className="text-sm font-semibold text-white">Phone</dt>
              <dd className="text-fog">{tel ? <a className="hover:text-gold" href={tel}>{contact.phone}</a> : contact.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-white">Email</dt>
              <dd className="break-all text-fog"><a className="hover:text-gold" href={`mailto:${contact.email}`}>{contact.email}</a></dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-white">Studio</dt>
              <dd className="text-fog">{contact.address}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-white">Hours</dt>
              <dd className="text-fog">{contact.hours}</dd>
            </div>
          </dl>

          <a
            href={links.quoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-12 items-center rounded-full border border-gold px-6 text-sm font-semibold text-gold transition hover:bg-gold hover:text-ink"
          >
            Prefer to chat? Message us on Facebook
          </a>
        </div>

        <form onSubmit={onSubmit} className="glass-panel space-y-5 rounded-[2rem] p-5 sm:p-8">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-white">What do you need?</legend>
            <div className="flex flex-wrap gap-2">
              {NEEDS.map((n) => {
                const on = needs.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(n)}
                    className={`h-11 rounded-full border px-4 text-sm font-medium transition ${
                      on ? "border-gold bg-gold text-ink" : "border-white/15 bg-white/5 text-fog hover:border-teal hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-fog">Your name</span>
              <input required name="name" autoComplete="name" maxLength={120} className={field} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-fog">Phone or email</span>
              <input required name="contact" autoComplete="email" maxLength={160} className={field} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm text-fog">Project location</span>
            <input name="location" autoComplete="address-level2" maxLength={160} placeholder="Barangay / city" className={field} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-fog">Tell us about it</span>
            <textarea required name="message" rows={4} maxLength={2000} placeholder="Size, material, where it goes, deadline…" className={`${field} resize-none`} />
          </label>
          {/* Honeypot — hidden from people, tempting to bots */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <button
            type="submit"
            disabled={status === "sending"}
            className="h-14 w-full rounded-full bg-gold text-base font-semibold text-ink transition hover:bg-gold-dim hover:shadow-[0_0_32px_rgba(243,179,60,0.4)] disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send project details"}
          </button>

          <p role="status" aria-live="polite" className="min-h-5 text-center text-sm">
            {status === "sent" && <span className="text-teal">Received. We&apos;ll get back to you shortly.</span>}
            {status === "fallback" && <span className="text-fog">Your email app should open with your details filled in. If it didn&apos;t, message us on Facebook.</span>}
          </p>
        </form>
      </div>
    </section>
  );
}
