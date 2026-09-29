export default function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="border-y border-line bg-gradient-to-r from-gold via-gold to-teal py-3 overflow-hidden no-print">
      <div className="animate-marquee flex whitespace-nowrap gap-10 w-max">
        {row.map((item, i) => (
          <span key={i} className="font-display font-bold text-ink text-sm tracking-[0.25em] flex items-center gap-10">
            {item} <span className="opacity-40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
