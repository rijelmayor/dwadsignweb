import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { useEffect, useState } from "react";

/** Preview fonts only: the CNC follows the client's own file. Typeface JSON files live in src/lib/fonts. */
export const LETTER_FONTS = [
  { id: "helvetiker", name: "Helvetiker Bold · clean sans" },
  { id: "optimer", name: "Optimer Bold · soft sans" },
  { id: "droid-sans", name: "Droid Sans Bold · modern sans" },
  { id: "gentilis", name: "Gentilis Bold · classic serif" },
  { id: "droid-serif", name: "Droid Serif Bold · heavy serif" },
];
const LOADERS: Record<string, () => Promise<unknown>> = {
  helvetiker: () => import("./fonts/helvetiker_bold.typeface.json"),
  optimer: () => import("./fonts/optimer_bold.typeface.json"),
  "droid-sans": () => import("./fonts/droid/droid_sans_bold.typeface.json"),
  gentilis: () => import("./fonts/gentilis_bold.typeface.json"),
  "droid-serif": () => import("./fonts/droid/droid_serif_bold.typeface.json"),
};
const cache = new Map<string, Font>();

export function useLetterFont(id: string, enabled: boolean): Font | null {
  const [font, setFont] = useState<Font | null>(cache.get(id) ?? null);
  useEffect(() => {
    if (!enabled) return;
    const hit = cache.get(id);
    if (hit) { setFont(hit); return; }
    let dead = false;
    (LOADERS[id] ?? LOADERS.helvetiker)().then((m) => {
      const f = new FontLoader().parse((m as { default: unknown }).default as never);
      cache.set(id, f);
      if (!dead) setFont(f);
    });
    return () => { dead = true; };
  }, [id, enabled]);
  return font;
}

export interface CharShape { ch: string; x: number; y: number; shapes: THREE.Shape[] }
export interface LetterLayout { chars: CharShape[]; minX: number; maxX: number; minY: number; maxY: number; capH: number }

function bounds(shapes: THREE.Shape[], ox: number, oy: number, b: { minX: number; maxX: number; minY: number; maxY: number }) {
  for (const s of shapes) for (const p of s.getPoints(6)) {
    b.minX = Math.min(b.minX, p.x + ox); b.maxX = Math.max(b.maxX, p.x + ox);
    b.minY = Math.min(b.minY, p.y + oy); b.maxY = Math.max(b.maxY, p.y + oy);
  }
}

/** Lays out text (multi-line) at font size 1. Coordinates are in "size units"; scale to feet with capH. */
export function layoutText(font: Font, text: string): LetterLayout {
  const k = 1 / font.data.resolution;
  const hb = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  bounds(font.generateShapes("H", 1), 0, 0, hb);
  const capH = hb.maxY > 0 ? hb.maxY : 0.72;
  const adv = capH * 1.4;
  const chars: CharShape[] = [];
  const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  text.split("\n").forEach((line, i) => {
    let x = 0;
    for (const ch of line) {
      const glyph = font.data.glyphs[ch] ?? font.data.glyphs["?"];
      const shapes = ch === " " ? [] : font.generateShapes(ch, 1);
      const y = -i * adv;
      if (shapes.length) { chars.push({ ch, x, y, shapes }); bounds(shapes, x, y, b); }
      x += (glyph?.ha ?? font.data.resolution * 0.3) * k;
    }
  });
  if (!chars.length) return { chars, minX: 0, maxX: capH, minY: 0, maxY: capH, capH };
  return { chars, ...b, capH };
}
