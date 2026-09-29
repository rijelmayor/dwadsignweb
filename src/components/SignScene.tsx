"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, RoundedBox, Line, Text, useTexture } from "@react-three/drei";
import { Suspense, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import type { Traits } from "@/lib/traits";
import type { PreviewKind } from "@/lib/catalog";

export interface SignSceneHandle { capturePng: () => string | null; }

interface SignSceneProps {
  widthFt: number;
  heightFt: number;
  preview: PreviewKind;
  traits: Traits;
  text?: string;
  logoUrl?: string;
  showDimensions?: boolean;
  faceLabel?: string;
  printingLabel?: string;
}

function fmtFt(n: number) {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? `${r}'` : `${r}'`;
}

function DimLine({ start, end, label, offset = [0, 0, 0] as [number, number, number], color = "#f3b33c" }: {
  start: [number, number, number]; end: [number, number, number]; label: string; offset?: [number, number, number]; color?: string;
}) {
  const s: [number, number, number] = [start[0] + offset[0], start[1] + offset[1], start[2] + offset[2]];
  const e: [number, number, number] = [end[0] + offset[0], end[1] + offset[1], end[2] + offset[2]];
  const mid: [number, number, number] = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2, (s[2] + e[2]) / 2];
  const dx = e[0] - s[0], dy = e[1] - s[1], dz = e[2] - s[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const ax = (dx / len) * 0.12, ay = (dy / len) * 0.12, az = (dz / len) * 0.12;
  // Use Text (not Html) so dimension numbers appear in canvas PNG capture for PDF
  return <group>
    <Line points={[s, e]} color={color} lineWidth={2.5} />
    <Line points={[[s[0] + ax + ay * 0.4, s[1] + ay - ax * 0.4, s[2] + az], s, [s[0] + ax - ay * 0.4, s[1] + ay + ax * 0.4, s[2] + az]]} color={color} lineWidth={2.5} />
    <Line points={[[e[0] - ax + ay * 0.4, e[1] - ay - ax * 0.4, e[2] - az], e, [e[0] - ax - ay * 0.4, e[1] - ay + ax * 0.4, e[2] - az]]} color={color} lineWidth={2.5} />
    <Text
      position={[mid[0], mid[1], mid[2] + 0.02]}
      fontSize={0.18}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.012}
      outlineColor="#011424"
      fontWeight={700}
    >
      {label}
    </Text>
  </group>;
}

function LogoFace({ w, h, depth, logoUrl, glow }: { w: number; h: number; depth: number; logoUrl: string; glow: boolean }) {
  const texture = useTexture(logoUrl);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true; }, [texture]);
  return <mesh position={[0, 0, depth / 2 + 0.012]}>
    <planeGeometry args={[w * 0.78, h * 0.68]} />
    <meshStandardMaterial map={texture} transparent alphaTest={0.04} emissive={glow ? "#ffffff" : "#000000"} emissiveIntensity={glow ? 0.12 : 0} roughness={0.55} />
  </mesh>;
}

function PanaflexMesh({ widthFt, heightFt, traits, logoUrl, showDimensions = true, faceLabel }: SignSceneProps) {
  const w = Math.max(0.5, widthFt), h = Math.max(0.3, heightFt);
  const depth = Math.max(0.04, traits.frameThickness || 0.12);
  const glow = traits.light !== "none";
  const dimColor = "#f3b33c";
  const faceColor = faceLabel === "APC" ? "#d8dde2" : faceLabel === "Metal Sheet" ? "#aeb7bf" : faceLabel === "Acrylic" ? "#f5fbff" : "#ffffff";
  const faceRoughness = faceLabel === "Acrylic" ? 0.28 : faceLabel === "Metal Sheet" ? 0.42 : 0.8;

  return <group>
    <mesh position={[0, 0, -depth - 0.08]} receiveShadow>
      <planeGeometry args={[w * 3.4, h * 3.4]} />
      <meshStandardMaterial color="#e7edf2" roughness={0.85} />
    </mesh>

    {/* Deliberately no visible metal frame: the first/default render is a clean white rectangle. */}
    <RoundedBox args={[w, h, depth]} radius={0.018} castShadow receiveShadow>
      <meshStandardMaterial color={faceColor} roughness={faceRoughness} metalness={faceLabel === "Metal Sheet" ? 0.55 : 0.02} emissive={glow ? "#fff8d6" : "#000000"} emissiveIntensity={glow ? 0.28 : 0} />
    </RoundedBox>

    {logoUrl ? <Suspense fallback={null}><LogoFace w={w} h={h} depth={depth} logoUrl={logoUrl} glow={glow} /></Suspense> : (
      <Text
        position={[0, 0, depth / 2 + 0.018]}
        fontSize={Math.min(w * 0.13, h * 0.28)}
        maxWidth={w * 0.78}
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        color="#17212b"
        outlineWidth={0.008}
        outlineColor="#ffffff"
      >
        Your Logo
        <meshStandardMaterial
          color="#17212b"
          roughness={0.55}
          emissive={glow ? "#ffffff" : "#000000"}
          emissiveIntensity={glow ? 0.12 : 0}
        />
      </Text>
    )}

    {glow && <pointLight position={[0, 0, depth + 0.5]} intensity={2.0} color="#fff3bd" distance={Math.max(8, w + h)} />}

    {showDimensions && <group>
      {/* Width — bottom edge */}
      <DimLine start={[-w / 2, -h / 2, depth / 2]} end={[w / 2, -h / 2, depth / 2]} offset={[0, -0.42, 0.08]} label={`W ${fmtFt(w)}`} color={dimColor} />
      {/* Height — left edge */}
      <DimLine start={[-w / 2, -h / 2, depth / 2]} end={[-w / 2, h / 2, depth / 2]} offset={[-0.48, 0, 0.08]} label={`H ${fmtFt(h)}`} color={dimColor} />
      {/* Height — right edge (mirror) */}
      <DimLine start={[w / 2, -h / 2, depth / 2]} end={[w / 2, h / 2, depth / 2]} offset={[0.48, 0, 0.08]} label={`H ${fmtFt(h)}`} color={dimColor} />
      {/* Width — top edge (mirror) */}
      <DimLine start={[-w / 2, h / 2, depth / 2]} end={[w / 2, h / 2, depth / 2]} offset={[0, 0.42, 0.08]} label={`W ${fmtFt(w)}`} color={dimColor} />
      {/* Thickness — right side depth */}
      <DimLine start={[w / 2, -h / 2, -depth / 2]} end={[w / 2, -h / 2, depth / 2]} offset={[0.32, -0.18, 0]} label={`T ${Math.round(depth * 12 * 10) / 10}"`} color="#1ecac9" />
    </group>}
  </group>;
}

function OtherSignMesh(props: SignSceneProps) {
  const { widthFt, heightFt, preview, traits, text = "DW", logoUrl, showDimensions = true, faceLabel } = props;
  if (preview === "panaflex") {
    return (
      <PanaflexMesh
        widthFt={widthFt}
        heightFt={heightFt}
        preview={preview}
        traits={traits}
        logoUrl={logoUrl}
        showDimensions={showDimensions}
        faceLabel={faceLabel}
        printingLabel={props.printingLabel}
      />
    );
  }
  const w = Math.max(0.5, widthFt), h = Math.max(0.3, heightFt), depth = Math.max(0.06, traits.frameThickness || 0.12);
  const frameColor = traits.metal === "aluminum" ? "#c0c8d0" : traits.metal === "powder" ? "#2a3a4a" : "#3a3a3a";
  const chars = (text || "DW").slice(0, 8).split("");
  return <group>
    <mesh position={[0, 0, -depth - 0.08]}><planeGeometry args={[w * 3.5, h * 3.5]} /><meshStandardMaterial color="#0a1a28" /></mesh>
    {(preview === "lightbox") && <>
      <RoundedBox args={[w, h, depth]} radius={0.02} castShadow><meshStandardMaterial color={frameColor} metalness={0.35} roughness={0.45} /></RoundedBox>
      <mesh position={[0, 0, depth / 2 + 0.008]}><planeGeometry args={[w * 0.96, h * 0.92]} /><meshStandardMaterial color="#f5f5f0" emissive={traits.light !== "none" ? "#fff0b0" : "#000"} emissiveIntensity={traits.light !== "none" ? 0.45 : 0} /></mesh>
    </>}
    {(preview === "acrylic" || preview === "neon") && chars.map((ch, i) => {
      const letterW = w / (chars.length + 0.5), x = -w / 2 + letterW * (i + 0.75);
      return <RoundedBox key={i} args={[letterW * 0.55, Math.min(letterW * 0.85, h * 0.62), preview === "neon" ? 0.06 : depth]} position={[x, 0, 0.02]} radius={0.015}>
        <meshStandardMaterial color={preview === "neon" ? "#f3b33c" : "#f0f4f8"} emissive={preview === "neon" ? "#f3b33c" : traits.light !== "none" ? "#f3b33c" : "#000"} emissiveIntensity={preview === "neon" || traits.light !== "none" ? 1.2 : 0} />
      </RoundedBox>;
    })}
  </group>;
}

function CaptureBridge({ onReady }: { onReady: (fn: () => string | null) => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => { onReady(() => { try { gl.render(scene, camera); return gl.domElement.toDataURL("image/png"); } catch { return null; } }); }, [gl, scene, camera, onReady]);
  return null;
}

const SignScene = forwardRef<SignSceneHandle, SignSceneProps>(function SignScene(props, ref) {
  const { widthFt, heightFt } = props;
  const maxDim = Math.max(widthFt, heightFt, 1), camDist = maxDim * 2.1 + 1.8;
  const captureRef = useRef<(() => string | null) | null>(null);
  useImperativeHandle(ref, () => ({ capturePng: () => captureRef.current?.() ?? null }));
  const isPanaflex = props.preview === "panaflex";
  const thickness = Math.round((props.traits.frameThickness || 0.12) * 12 * 10) / 10;
  return <div className="w-full h-full min-h-[360px] rounded-xl overflow-hidden bg-[#eef2f5] border border-line relative">
    <Canvas shadows camera={{ position: [camDist * 0.42, camDist * 0.18, camDist], fov: 34 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <color attach="background" args={[isPanaflex ? "#eef2f5" : "#011424"]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 5]} intensity={1.25} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        <OtherSignMesh {...props} />
        <ContactShadows position={[0, -heightFt / 2 - 0.7, 0]} opacity={0.24} scale={14} blur={2} />
        <Environment preset="city" />
      </Suspense>
      <CaptureBridge onReady={(fn) => { captureRef.current = fn; }} />
      <OrbitControls makeDefault minDistance={1} maxDistance={40} target={[0, 0, 0]} enablePan={false} />
    </Canvas>
    <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
      <span className="rounded-full bg-white/90 border border-gray-300 px-2.5 py-1 text-[10px] font-bold text-ink">{props.faceLabel || "Face"}</span>
      {props.printingLabel && <span className="rounded-full bg-white/90 border border-gray-300 px-2.5 py-1 text-[10px] font-bold text-ink">{props.printingLabel}</span>}
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${props.traits.light === "none" ? "bg-white/90 border-gray-300 text-ink" : "bg-amber-50 border-amber-300 text-amber-800"}`}>{props.traits.light === "none" ? "Without Light" : "With Light"}</span>
    </div>
    {props.showDimensions !== false && <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 justify-center pointer-events-none">
      <span className="rounded bg-ink/90 border border-gold/50 px-2.5 py-1 text-[10px] font-semibold text-gold">W {fmtFt(widthFt)}</span>
      <span className="rounded bg-ink/90 border border-gold/50 px-2.5 py-1 text-[10px] font-semibold text-gold">H {fmtFt(heightFt)}</span>
      <span className="rounded bg-ink/90 border border-teal/50 px-2.5 py-1 text-[10px] font-semibold text-teal">T {thickness}"</span>
    </div>}
  </div>;
});

export default SignScene;
