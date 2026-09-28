import type { PreviewKind } from "@/lib/catalog";

interface Props {
  kind: PreviewKind;
  w: number; // feet
  h: number; // feet
  frameId: string;
  lightingId: string;
  mountingId: string;
  faceLabel: string;
}

/**
 * Live vector mockup of the sign being configured.
 * Scales with real-world aspect ratio and reacts to material choices:
 * frame thickness, glow when lit, poles when freestanding.
 */
export default function SignMockup({ kind, w, h, frameId, lightingId, mountingId, faceLabel }: Props) {
  const isLit = lightingId !== "none" && lightingId !== "";
  const isPole = mountingId === "pole" || mountingId === "rooftop";
  const frameThick = frameId.includes("1x2") || frameId.includes("cab") ? 10 : frameId.includes("stud") ? 5 : 7;

  // Fit sign (aspect w:h) inside the drawing area
  const maxW = 320, maxH = 190;
  const scale = Math.min(maxW / Math.max(w, 0.1), maxH / Math.max(h, 0.1));
  const sw = Math.max(w * scale, 40);
  const sh = Math.max(h * scale, 24);
  const cx = 200, top = 34;
  const x = cx - sw / 2, y = top;

  const faceFill =
    kind === "lightbox" && isLit
      ? "#fff7cc"
      : kind === "neon"
        ? "#141416"
        : lightingId.includes("backlit") || lightingId.includes("internal")
          ? "#2a3a55"
          : "#1d2b45";

  const faceText = kind === "neon" ? "neon text" : kind === "acrylic" ? "ABC" : faceLabel || "YOUR BRAND";

  return (
    <svg viewBox="0 0 400 300" className="w-full h-auto select-none" role="img" aria-label="Sign mockup">
      <defs>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="12" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="pfGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={faceFill} />
          <stop offset="100%" stopColor="#101828" />
        </linearGradient>
      </defs>

      {/* ground line */}
      <line x1="20" y1="268" x2="380" y2="268" stroke="#26262a" strokeWidth="2" />

      {/* glow behind sign */}
      {isLit && kind !== "neon" && (
        <rect x={x - 14} y={y - 14} width={sw + 28} height={sh + 28} rx="10" fill="#d9ff3d" opacity="0.28" filter="url(#glow)" />
      )}

      {/* poles */}
      {isPole && (
        <g stroke="#3a3a40" strokeWidth="7">
          <line x1={cx - sw / 4} y1={y + sh} x2={cx - sw / 4} y2="268" />
          <line x1={cx + sw / 4} y1={y + sh} x2={cx + sw / 4} y2="268" />
        </g>
      )}

      {/* frame */}
      <rect x={x} y={y} width={sw} height={sh} rx={kind === "lightbox" ? 6 : 2} fill="#0e0e10" stroke="#4a4a52" strokeWidth={frameThick} />

      {/* face */}
      <rect x={x + frameThick} y={y + frameThick} width={sw - frameThick * 2} height={sh - frameThick * 2} rx="2" fill="url(#pfGrad)" />

      {/* face text */}
      <text
        x={cx}
        y={y + sh / 2 + 5}
        textAnchor="middle"
        fill={kind === "neon" ? "#d9ff3d" : kind === "lightbox" && isLit ? "#111" : "#e8e8ee"}
        fontSize={Math.min(sw / 8, 26)}
        fontFamily="var(--font-display)"
        fontWeight="700"
        style={kind === "neon" || (kind === "lightbox" && isLit) ? { filter: "url(#glow)" } : undefined}
      >
        {faceText}
      </text>

      {/* exposed LED dots */}
      {lightingId.includes("exposed") && (
        <g fill="#d9ff3d">
          {Array.from({ length: 9 }).map((_, i) => (
            <circle key={i} cx={x + (sw / 9) * i + sw / 18} cy={y - 10} r="2.6" />
          ))}
        </g>
      )}

      {/* dimension arrows */}
      <g stroke="#d9ff3d" strokeWidth="1.4">
        <line x1={x} y1={278} x2={x + sw} y2="278" />
        <line x1={x} y1="273" x2={x} y2="283" />
        <line x1={x + sw} y1="273" x2={x + sw} y2="283" />
        <line x1="18" y1={y} x2="18" y2={y + sh} />
        <line x1="13" y1={y} x2="23" y2={y} />
        <line x1="13" y1={y + sh} x2="23" y2={y + sh} />
      </g>
      <text x={cx} y="296" textAnchor="middle" fill="#d9ff3d" fontSize="13" fontFamily="var(--font-display)" fontWeight="600">
        {w} ft
      </text>
      <text x="8" y={y + sh / 2} fill="#d9ff3d" fontSize="13" fontFamily="var(--font-display)" fontWeight="600" transform={`rotate(-90 8 ${y + sh / 2})`} textAnchor="middle">
        {h} ft
      </text>
    </svg>
  );
}
