import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-40 pb-24 px-6 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#d9ff3d 1px, transparent 1px), linear-gradient(90deg, #d9ff3d 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <p className="rise text-volt text-sm font-semibold tracking-[0.3em] uppercase mb-6">
          Advertising · Signages · Large Format Print
        </p>
        <h1
          className="rise font-display text-5xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight max-w-5xl"
          style={{ animationDelay: "0.1s" }}
        >
          We make brands <span className="text-volt">impossible</span> to miss.
        </h1>
        <p
          className="rise mt-8 max-w-xl text-lg text-fog leading-relaxed"
          style={{ animationDelay: "0.2s" }}
        >
          From 3D signage and LED neon to vehicle wraps and wall murals — designed,
          fabricated, and installed by one obsessive team.
        </p>
        <div className="rise mt-10 flex flex-wrap gap-4" style={{ animationDelay: "0.3s" }}>
          <Link
            href="/quote"
            className="rounded-full bg-volt px-8 py-4 font-semibold text-ink hover:bg-volt-dim transition"
          >
            Start a Quotation
          </Link>
          <Link
            href="#work"
            className="rounded-full border border-line px-8 py-4 font-semibold text-white hover:border-volt hover:text-volt transition"
          >
            See Our Work
          </Link>
        </div>
      </div>
    </section>
  );
}
