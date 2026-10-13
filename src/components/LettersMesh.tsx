"use client";

import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import type { LetterLayout } from "@/lib/letters";

export interface LettersSpec {
  layout: LetterLayout;
  /** layout units → feet */
  scale: number;
  depthFt: number;
  faceFt: number;
  faceColor: string;
  returnColor: string;
  glow: "none" | "halo" | "front";
  neon: boolean;
  neonColors: string[];
  backing: "clear" | "black";
}

export default function LettersMesh({ spec, widthFt, heightFt, children }: { spec: LetterLayoutProps; widthFt: number; heightFt: number; children?: ReactNode }) {
  const { layout, scale: s, depthFt, faceFt, neon } = spec;
  const cx = (layout.minX + layout.maxX) / 2, cy = (layout.minY + layout.maxY) / 2;
  const dl = depthFt / s, fl = Math.min(faceFt, depthFt) / s;

  const built = useMemo(() => {
    const returns: THREE.BufferGeometry[] = [], faces: THREE.BufferGeometry[] = [], halos: THREE.BufferGeometry[] = [];
    const tubes: { geo: THREE.BufferGeometry; color: string }[] = [];
    let idx = 0;
    for (const c of layout.chars) {
      if (neon) {
        const color = spec.neonColors[idx++ % spec.neonColors.length] ?? "#ff4fd8";
        for (const sh of c.shapes) {
          for (const contour of [sh.getPoints(10), ...sh.holes.map((h) => h.getPoints(10))]) {
            const pts = contour.map((p) => new THREE.Vector3(p.x + c.x, p.y + c.y, 0));
            if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-6) pts.pop();
            if (pts.length < 3) continue;
            const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
            tubes.push({ geo: new THREE.TubeGeometry(curve, Math.min(pts.length * 2, 400), 0.014 / s, 6, true), color });
          }
        }
        continue;
      }
      const ret = dl - fl;
      if (ret > 1e-6) returns.push(new THREE.ExtrudeGeometry(c.shapes, { depth: ret, bevelEnabled: false, curveSegments: 6 }).translate(c.x, c.y, 0));
      faces.push(new THREE.ExtrudeGeometry(c.shapes, { depth: fl, bevelEnabled: false, curveSegments: 6 }).translate(c.x, c.y, dl - fl));
      if (spec.glow === "halo") halos.push(new THREE.ExtrudeGeometry(c.shapes, { depth: 0.001, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.07, bevelSegments: 2, curveSegments: 6 }).translate(c.x, c.y, -0.03 / s));
    }
    return { returns, faces, halos, tubes };
  }, [layout, neon, dl, fl, s, spec.glow, spec.neonColors]);

  const box: [number, number, number][] = [[-widthFt / 2, -heightFt / 2, 0], [widthFt / 2, -heightFt / 2, 0], [widthFt / 2, heightFt / 2, 0], [-widthFt / 2, heightFt / 2, 0], [-widthFt / 2, -heightFt / 2, 0]];
  const zTop = neon ? 0.06 : depthFt / 2 + 0.02;
  const front = spec.glow === "front";

  return (
    <group>
      {neon && (
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[widthFt + 0.3, heightFt + 0.3, 0.012]} />
          <meshStandardMaterial color={spec.backing === "black" ? "#0b0b0b" : "#cfeeff"} transparent opacity={spec.backing === "black" ? 1 : 0.35} />
        </mesh>
      )}
      <group position={[-cx * s, -cy * s, neon ? 0.02 : -depthFt / 2]} scale={s}>
        {built.returns.map((g, i) => <mesh key={`r${i}`} geometry={g}><meshStandardMaterial color={spec.returnColor} roughness={0.35} /></mesh>)}
        {built.faces.map((g, i) => <mesh key={`f${i}`} geometry={g}><meshStandardMaterial color={spec.faceColor} roughness={0.15} emissive={front ? spec.faceColor : "#000000"} emissiveIntensity={front ? 0.9 : 0} /></mesh>)}
        {built.halos.map((g, i) => <mesh key={`h${i}`} geometry={g}><meshBasicMaterial color="#ffd27a" transparent opacity={0.45} depthWrite={false} /></mesh>)}
        {built.tubes.map((t, i) => <mesh key={`t${i}`} geometry={t.geo}><meshStandardMaterial color={t.color} emissive={t.color} emissiveIntensity={1.6} toneMapped={false} /></mesh>)}
      </group>
      <Line points={box.map(([x, y]) => [x, y, zTop] as [number, number, number])} color="#0e7c86" lineWidth={1.2} dashed dashSize={0.1} gapSize={0.07} />
      <group position={[0, 0, zTop]}>{children}</group>
    </group>
  );
}
type LetterLayoutProps = LettersSpec;
