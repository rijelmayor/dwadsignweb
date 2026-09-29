"use client";

import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  RoundedBox,
  Line,
  Html,
  useTexture,
} from "@react-three/drei";
import {
  Suspense,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import * as THREE from "three";
import type { Traits } from "@/lib/traits";
import type { PreviewKind } from "@/lib/catalog";

export interface SignSceneHandle {
  capturePng: () => string | null;
}

interface SignSceneProps {
  widthFt: number;
  heightFt: number;
  preview: PreviewKind;
  traits: Traits;
  text?: string;
  logoUrl?: string;
  showDimensions?: boolean;
}

function fmtFt(n: number) {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? `${r}'` : `${r}'`;
}

/** Dimension line with arrows + label (in scene units = feet). */
function DimLine({
  start,
  end,
  label,
  offset = [0, 0, 0] as [number, number, number],
  color = "#f3b33c",
}: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset?: [number, number, number];
  color?: string;
}) {
  const s: [number, number, number] = [start[0] + offset[0], start[1] + offset[1], start[2] + offset[2]];
  const e: [number, number, number] = [end[0] + offset[0], end[1] + offset[1], end[2] + offset[2]];
  const mid: [number, number, number] = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2, (s[2] + e[2]) / 2];

  // Extension ticks perpendicular-ish
  const dx = e[0] - s[0];
  const dy = e[1] - s[1];
  const dz = e[2] - s[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  // Simple arrow heads as short lines
  const ax = (dx / len) * 0.12;
  const ay = (dy / len) * 0.12;
  const az = (dz / len) * 0.12;

  return (
    <group>
      <Line points={[s, e]} color={color} lineWidth={2} />
      {/* arrow heads */}
      <Line
        points={[
          [s[0] + ax + ay * 0.4, s[1] + ay - ax * 0.4, s[2] + az],
          s,
          [s[0] + ax - ay * 0.4, s[1] + ay + ax * 0.4, s[2] + az],
        ]}
        color={color}
        lineWidth={2}
      />
      <Line
        points={[
          [e[0] - ax + ay * 0.4, e[1] - ay - ax * 0.4, e[2] - az],
          e,
          [e[0] - ax - ay * 0.4, e[1] - ay + ax * 0.4, e[2] - az],
        ]}
        color={color}
        lineWidth={2}
      />
      <Html position={mid} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            background: "rgba(1,20,36,0.9)",
            color: color,
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 4,
            border: `1px solid ${color}`,
            whiteSpace: "nowrap",
            fontFamily: "system-ui,sans-serif",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function LogoFace({
  w,
  h,
  depth,
  logoUrl,
  glow,
  light,
}: {
  w: number;
  h: number;
  depth: number;
  logoUrl: string;
  glow: boolean;
  light: Traits["light"];
}) {
  const texture = useTexture(logoUrl);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh position={[0, 0, depth / 2 + 0.006]} castShadow>
      <planeGeometry args={[w * 0.92, h * 0.88]} />
      <meshStandardMaterial
        map={texture}
        emissive={glow ? (light === "rgb" ? "#1ecac9" : "#f3b33c") : "#000"}
        emissiveIntensity={glow ? 0.25 : 0}
        emissiveMap={texture}
        roughness={0.55}
      />
    </mesh>
  );
}

function SignMesh({
  widthFt,
  heightFt,
  preview,
  traits,
  text = "DW",
  logoUrl,
  showDimensions = true,
}: SignSceneProps) {
  const w = Math.max(0.5, widthFt);
  const h = Math.max(0.3, heightFt);
  const depth = Math.max(0.06, traits.frameThickness || 0.12);
  const frameColor =
    traits.metal === "aluminum" ? "#c0c8d0" : traits.metal === "powder" ? "#2a3a4a" : "#3a3a3a";
  const faceColor = preview === "neon" ? "#1ecac9" : "#f5f5f0";
  const glow = traits.light !== "none";
  const dimColor = "#f3b33c";

  const letters = useMemo(() => {
    if (preview !== "acrylic" && preview !== "neon") return null;
    const chars = (text || "DW").slice(0, 8).split("");
    const letterW = w / (chars.length + 0.5);
    return chars.map((ch, i) => ({
      ch,
      x: -w / 2 + letterW * (i + 0.75),
      size: Math.min(letterW * 0.7, h * 0.55),
    }));
  }, [preview, text, w, h]);

  // Depth in inches for label (more intuitive for thickness)
  const depthIn = Math.round(depth * 12 * 10) / 10;

  return (
    <group>
      {/* Ground / wall */}
      {traits.mount === "pole" || traits.mount === "rooftop" ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -h / 2 - 0.9, 0]} receiveShadow>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial color="#0a1a28" />
        </mesh>
      ) : (
        <mesh position={[0, 0, -depth - 0.08]} receiveShadow>
          <planeGeometry args={[w * 3.5, h * 3.5]} />
          <meshStandardMaterial color="#0a1a28" />
        </mesh>
      )}

      {(traits.mount === "pole" || traits.mount === "rooftop") && (
        <mesh position={[0, -h / 2 - 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.95, 12]} />
          <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
        </mesh>
      )}

      {traits.mount === "raceway" && (
        <RoundedBox args={[w * 1.05, 0.12, 0.15]} position={[0, -h / 2 - 0.08, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color={frameColor} metalness={0.4} roughness={0.5} />
        </RoundedBox>
      )}

      {/* Panaflex / Lightbox cabinet */}
      {(preview === "panaflex" || preview === "lightbox") && (
        <group>
          <RoundedBox args={[w, h, depth]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color={frameColor} metalness={0.35} roughness={0.45} />
          </RoundedBox>
          {/* Side returns visible for thickness */}
          <mesh position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[depth, h * 0.98]} />
            <meshStandardMaterial color={frameColor} metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[w / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[depth, h * 0.98]} />
            <meshStandardMaterial color={frameColor} metalness={0.4} roughness={0.4} />
          </mesh>

          {logoUrl ? (
            <Suspense fallback={null}>
              <LogoFace w={w} h={h} depth={depth} logoUrl={logoUrl} glow={glow} light={traits.light} />
            </Suspense>
          ) : (
            <mesh position={[0, 0, depth / 2 + 0.005]} castShadow>
              <planeGeometry args={[w * 0.96, h * 0.92]} />
              <meshStandardMaterial
                color={faceColor}
                emissive={glow ? (traits.light === "rgb" ? "#1ecac9" : "#f3b33c") : "#000"}
                emissiveIntensity={glow ? 0.55 : 0}
                roughness={0.7}
              />
            </mesh>
          )}

          {traits.light === "exposed" && (
            <>
              <mesh position={[0, h / 2 - 0.02, depth / 2 + 0.01]}>
                <boxGeometry args={[w * 0.98, 0.025, 0.02]} />
                <meshStandardMaterial color="#fff8c0" emissive="#f3b33c" emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[0, -h / 2 + 0.02, depth / 2 + 0.01]}>
                <boxGeometry args={[w * 0.98, 0.025, 0.02]} />
                <meshStandardMaterial color="#fff8c0" emissive="#f3b33c" emissiveIntensity={1.5} />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* Acrylic letters */}
      {letters && preview === "acrylic" && (
        <group>
          {letters.map((l, i) => (
            <group key={i} position={[l.x, 0, 0]}>
              <RoundedBox
                args={[l.size * 0.7, l.size, traits.light === "halo" ? 0.08 : depth]}
                radius={0.015}
                castShadow
              >
                <meshStandardMaterial
                  color={traits.material === "stainless" ? "#c8d0d8" : "#f0f4f8"}
                  metalness={traits.material === "stainless" ? 0.85 : 0.1}
                  roughness={traits.material === "stainless" ? 0.25 : 0.35}
                  emissive={traits.light === "frontlit" ? "#f3b33c" : "#000"}
                  emissiveIntensity={traits.light === "frontlit" ? 0.4 : 0}
                />
              </RoundedBox>
              {traits.light === "halo" && (
                <mesh position={[0, 0, -0.06]}>
                  <planeGeometry args={[l.size * 0.85, l.size * 1.1]} />
                  <meshStandardMaterial
                    color="#f3b33c"
                    emissive="#f3b33c"
                    emissiveIntensity={1.2}
                    transparent
                    opacity={0.7}
                  />
                </mesh>
              )}
            </group>
          ))}
        </group>
      )}

      {/* Neon */}
      {letters && preview === "neon" && (
        <group>
          <RoundedBox args={[w * 1.05, h * 1.1, 0.04]} position={[0, 0, -0.03]} radius={0.02}>
            <meshStandardMaterial
              color={traits.backing === "black" ? "#111" : "#e8eef5"}
              transparent
              opacity={traits.backing === "clear" ? 0.35 : 1}
              metalness={0.1}
              roughness={0.4}
            />
          </RoundedBox>
          {letters.map((l, i) => (
            <RoundedBox
              key={i}
              args={[l.size * 0.55, l.size * 0.9, 0.06]}
              position={[l.x, 0, 0.02]}
              radius={0.02}
            >
              <meshStandardMaterial
                color={traits.light === "rgb" ? "#1ecac9" : "#f3b33c"}
                emissive={traits.light === "rgb" ? "#1ecac9" : "#f3b33c"}
                emissiveIntensity={1.8}
                toneMapped={false}
              />
            </RoundedBox>
          ))}
        </group>
      )}

      {glow && (
        <pointLight
          position={[0, 0, depth + 0.5]}
          intensity={2.2}
          color={traits.light === "rgb" ? "#1ecac9" : "#f3b33c"}
          distance={8}
        />
      )}

      {/* Dimension annotations */}
      {showDimensions && (
        <group>
          {/* Width — below sign */}
          <DimLine
            start={[-w / 2, -h / 2, depth / 2]}
            end={[w / 2, -h / 2, depth / 2]}
            offset={[0, -0.35, 0.05]}
            label={`W ${fmtFt(w)}`}
            color={dimColor}
          />
          {/* Height — left of sign */}
          <DimLine
            start={[-w / 2, -h / 2, depth / 2]}
            end={[-w / 2, h / 2, depth / 2]}
            offset={[-0.4, 0, 0.05]}
            label={`H ${fmtFt(h)}`}
            color={dimColor}
          />
          {/* Depth / thickness — along side */}
          <DimLine
            start={[w / 2, -h / 2, -depth / 2]}
            end={[w / 2, -h / 2, depth / 2]}
            offset={[0.28, -0.15, 0]}
            label={`D ${depthIn}"`}
            color="#1ecac9"
          />
        </group>
      )}
    </group>
  );
}

function CaptureBridge({ onReady }: { onReady: (fn: () => string | null) => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    onReady(() => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/png");
      } catch {
        return null;
      }
    });
  }, [gl, scene, camera, onReady]);
  return null;
}

const SignScene = forwardRef<SignSceneHandle, SignSceneProps>(function SignScene(
  props,
  ref,
) {
  const { widthFt, heightFt } = props;
  const maxDim = Math.max(widthFt, heightFt, 1);
  const camDist = maxDim * 2.1 + 1.8;
  const captureRef = useRef<(() => string | null) | null>(null);

  useImperativeHandle(ref, () => ({
    capturePng: () => captureRef.current?.() ?? null,
  }));

  return (
    <div className="w-full h-full min-h-[320px] rounded-xl overflow-hidden bg-[#011424] border border-line relative">
      <Canvas
        shadows
        camera={{ position: [camDist * 0.7, camDist * 0.28, camDist], fov: 38 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={["#011424"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={null}>
          <SignMesh {...props} />
          <ContactShadows position={[0, -heightFt / 2 - 0.95, 0]} opacity={0.4} scale={14} blur={2} />
          <Environment preset="city" />
        </Suspense>
        <CaptureBridge onReady={(fn) => { captureRef.current = fn; }} />
        <OrbitControls
          makeDefault
          minDistance={1}
          maxDistance={40}
          target={[0, 0, 0]}
          enablePan={false}
        />
      </Canvas>
      {/* 2D dimension legend */}
      {props.showDimensions !== false && (
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 justify-center pointer-events-none">
          <span className="rounded bg-ink/90 border border-gold/50 px-2 py-0.5 text-[10px] font-semibold text-gold">
            W {fmtFt(widthFt)}
          </span>
          <span className="rounded bg-ink/90 border border-gold/50 px-2 py-0.5 text-[10px] font-semibold text-gold">
            H {fmtFt(heightFt)}
          </span>
          <span className="rounded bg-ink/90 border border-teal/50 px-2 py-0.5 text-[10px] font-semibold text-teal">
            D {Math.round((props.traits.frameThickness || 0.12) * 12 * 10) / 10}&quot;
          </span>
        </div>
      )}
    </div>
  );
});

export default SignScene;
