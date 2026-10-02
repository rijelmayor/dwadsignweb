"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Line, Text, useTexture } from "@react-three/drei";
import { Suspense, useEffect, forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Traits } from "@/lib/traits";
import type { PreviewKind } from "@/lib/catalog";

export type SignShape = "rect" | "circle";
/** panaflex = flat face · builtup = metal-return lightbox · acrylic = acrylic-build lightbox */
export type SceneVariant = "panaflex" | "builtup" | "acrylic";
/** behind = poles at the back · flanking = poles beside the sign · hanging = hung from a top arm/beam */
export type PolePlacement = "behind" | "flanking" | "hanging";
export interface PoleConfig { count: number; placement: PolePlacement }

export interface SignSceneHandle {
  /** Head-on view (W × H dimension lines) */
  captureFront: () => string | null;
  /** Side-on view (thickness + height dimension lines) */
  captureSide: () => string | null;
  /** Angled 3D perspective view with all dimension lines */
  captureIso: () => string | null;
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
  faceLabel?: string;
  printingLabel?: string;
  shape?: SignShape;
  variant?: SceneVariant;
  /** Lightboxes and neon are always internally lit */
  lit?: boolean;
  /** Service id: panaflex | lightbox | acrylic | neon | apc | tarp | sticker | metal | custom */
  service?: string;
  /** Double-faced sign: artwork is repeated on the back */
  doubleSided?: boolean;
  /** Short chip labels shown over the 3D view */
  sidesLabel?: string;
  mountLabel?: string;
  /** Pole mount layout (only used when traits.mount === "pole") */
  poles?: PoleConfig;
  /** Extra height under the sign (pole / rooftop supports) — computed by SignScene */
  below?: number;
}

function fmtFt(n: number) {
  const r = Math.round(n * 100) / 100;
  return `${r}'`;
}

/** Keeps children turned toward the camera (live + during manual captures via userData.faceCam). */
function FaceCam({ position, children }: { position: [number, number, number]; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ camera }) => { ref.current?.quaternion.copy(camera.quaternion); });
  return <group ref={ref} position={position} userData={{ faceCam: true }}>{children}</group>;
}

/** Dimension arrows + large black labels */
function DimLine({
  start,
  end,
  label,
  offset = [0, 0, 0] as [number, number, number],
  color = "#111111",
  fontSize = 0.32,
}: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset?: [number, number, number];
  color?: string;
  fontSize?: number;
}) {
  const s: [number, number, number] = [start[0] + offset[0], start[1] + offset[1], start[2] + offset[2]];
  const e: [number, number, number] = [end[0] + offset[0], end[1] + offset[1], end[2] + offset[2]];
  const mid: [number, number, number] = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2, (s[2] + e[2]) / 2];
  const dx = e[0] - s[0], dy = e[1] - s[1], dz = e[2] - s[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const ax = (dx / len) * 0.16, ay = (dy / len) * 0.16, az = (dz / len) * 0.16;

  // Extension ticks at ends (perpendicular)
  const px = -dy / len * 0.1, py = dx / len * 0.1;

  return (
    <group>
      {/* Main dimension line */}
      <Line points={[s, e]} color={color} lineWidth={3.5} />
      {/* Arrow heads */}
      <Line
        points={[
          [s[0] + ax + ay * 0.5, s[1] + ay - ax * 0.5, s[2] + az],
          s,
          [s[0] + ax - ay * 0.5, s[1] + ay + ax * 0.5, s[2] + az],
        ]}
        color={color}
        lineWidth={3.5}
      />
      <Line
        points={[
          [e[0] - ax + ay * 0.5, e[1] - ay - ax * 0.5, e[2] - az],
          e,
          [e[0] - ax - ay * 0.5, e[1] - ay + ax * 0.5, e[2] - az],
        ]}
        color={color}
        lineWidth={3.5}
      />
      {/* End ticks */}
      <Line points={[[s[0] + px, s[1] + py, s[2]], [s[0] - px, s[1] - py, s[2]]]} color={color} lineWidth={2.5} />
      <Line points={[[e[0] + px, e[1] + py, e[2]], [e[0] - px, e[1] - py, e[2]]]} color={color} lineWidth={2.5} />
      {/* Large black label — always faces the camera so it reads in every captured view */}
      <FaceCam position={mid}>
        <Text
          position={[0, 0, 0.04]}
          fontSize={fontSize}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.028}
          outlineColor="#ffffff"
        >
          {label}
        </Text>
      </FaceCam>
    </group>
  );
}

function LogoFace({ w, h, depth, logoUrl, circle = false }: { w: number; h: number; depth: number; logoUrl: string; circle?: boolean }) {
  const texture = useTexture(logoUrl);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
  }, [texture]);
  return (
    <mesh position={[0, 0, depth / 2 + 0.008]}>
      {circle ? <circleGeometry args={[w / 2, 64]} /> : <planeGeometry args={[w, h]} />}
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function BulbIcon({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshBasicMaterial color="#ffe566" />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.07, 12]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      <mesh position={[0, 0.08, -0.01]}>
        <circleGeometry args={[0.2, 24]} />
        <meshBasicMaterial color="#ffcc33" transparent opacity={0.3} />
      </mesh>
      <Text
        position={[0, -0.24, 0]}
        fontSize={0.13}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#ffffff"
      >
        WITH LIGHT
      </Text>
    </group>
  );
}


type Look = { color: string; metalness: number; roughness: number };
function lookOf(service?: string): Look {
  switch (service) {
    case "apc": return { color: "#d8dde2", metalness: 0.15, roughness: 0.5 };
    case "metal": return { color: "#aeb7bf", metalness: 0.4, roughness: 0.45 };
    case "acrylic": return { color: "#f5fbff", metalness: 0.05, roughness: 0.15 };
    case "tarp": return { color: "#fbfbf8", metalness: 0, roughness: 0.9 };
    case "sticker": return { color: "#ffffff", metalness: 0, roughness: 0.35 };
    case "custom": return { color: "#eef0f2", metalness: 0.02, roughness: 0.7 };
    case "neon": return { color: "#14181d", metalness: 0.1, roughness: 0.5 };
    default: return { color: "#ffffff", metalness: 0.02, roughness: 0.7 };
  }
}

type V3 = [number, number, number];
const STEEL = "#7b848d";
const WALL = "#e4e9ee";

/** Cylindrical steel bar between two points. */
function Strut({ a, b, r = 0.04, color = STEEL }: { a: V3; b: V3; r?: number; color?: string }) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length() || 0.001;
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh position={[mid.x, mid.y, mid.z]} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 14]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
    </mesh>
  );
}

function Plate({ pos, size, color = STEEL }: { pos: V3; size: V3; color?: string }) {
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
    </mesh>
  );
}

const HANG_RISE = 0.9;
/** Extra height above the sign (hanging arm / beam). */
function aboveFor(mount: Traits["mount"], poles?: PoleConfig) {
  return mount === "pole" && poles?.placement === "hanging" ? HANG_RISE : 0;
}

/** Extra height needed under the sign for freestanding mounts. */
function belowFor(mount: Traits["mount"], h: number) {
  if (mount === "pole") return Math.min(5, Math.max(1.8, h * 0.9));
  if (mount === "rooftop") return 1.4;
  return 0;
}

/** Real, visible mounting hardware: wall slab, wall brackets, pole(s) or rooftop steel supports. */
function Mounting({ mount, w, h, depth, below, poles }: { mount: Traits["mount"]; w: number; h: number; depth: number; below: number; poles?: PoleConfig }) {
  const back = -depth / 2;
  const bigW = Math.max(w, 2) * 4;
  const bigH = Math.max(h, 2) * 4;
  const bottom = -h / 2;

  if (mount === "wall") {
    // Flush against the wall
    return (
      <mesh position={[0, 0, back - 0.004 - 0.15]}>
        <boxGeometry args={[bigW, bigH, 0.3]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
    );
  }

  if (mount === "bracket") {
    const standoff = 0.5;
    const wallFront = back - standoff;
    const xs = w >= 3 ? [-w * 0.32, w * 0.32] : [0];
    const ys = h >= 3.5 ? [-h * 0.28, h * 0.28] : [0];
    return (
      <group>
        <mesh position={[0, 0, wallFront - 0.15]}>
          <boxGeometry args={[bigW, bigH, 0.3]} />
          <meshStandardMaterial color={WALL} roughness={0.95} />
        </mesh>
        {xs.flatMap((x) =>
          ys.map((y) => (
            <group key={`${x}_${y}`}>
              <Strut a={[x, y, back]} b={[x, y, wallFront]} r={0.045} />
              <Plate pos={[x, y, wallFront + 0.02]} size={[0.3, 0.3, 0.04]} />
              <Plate pos={[x, y, back - 0.02]} size={[0.26, 0.26, 0.04]} />
              <Strut a={[x, y - 0.32, wallFront + 0.02]} b={[x, y, back - 0.14]} r={0.03} />
            </group>
          )),
        )}
      </group>
    );
  }

  if (mount === "pole") {
    const placement: PolePlacement = poles?.placement ?? "behind";
    const n = Math.max(1, Math.min(placement === "hanging" ? 2 : 4, Math.round(poles?.count ?? 1)));
    const groundY = bottom - below;
    const top = h / 2;
    const ground = (
      <mesh position={[0, groundY - 0.015, 0]}>
        <boxGeometry args={[Math.max(w, 2) * 2.4, 0.03, 3]} />
        <meshStandardMaterial color="#cfd5db" roughness={1} />
      </mesh>
    );
    const behindXs = (k: number) => Array.from({ length: k }, (_, i) => (k === 1 ? 0 : -w / 2 + (w * (i + 0.5)) / k));
    const base = (x: number, z: number) => <Plate pos={[x, groundY + 0.03, z]} size={[0.9, 0.06, 0.9]} />;

    if (placement === "behind") {
      const pz = back - 0.12;
      return (
        <group>
          {ground}
          {behindXs(n).map((x) => (
            <group key={x}>
              <Strut a={[x, groundY, pz]} b={[x, bottom + h * 0.75, pz]} r={0.11} />
              {base(x, pz)}
              <Plate pos={[x, bottom + h * 0.25, back - 0.03]} size={[0.3, 0.3, 0.06]} />
              <Plate pos={[x, bottom + h * 0.7, back - 0.03]} size={[0.3, 0.3, 0.06]} />
            </group>
          ))}
        </group>
      );
    }

    if (placement === "flanking") {
      const outer = n === 1 ? [-(w / 2 + 0.32)] : [-(w / 2 + 0.32), w / 2 + 0.32];
      const extra = behindXs(Math.max(0, n - 2));
      const poleTop = top + 0.35;
      return (
        <group>
          {ground}
          {outer.map((x) => {
            const edge = x < 0 ? -w / 2 : w / 2;
            return (
              <group key={x}>
                <Strut a={[x, groundY, 0]} b={[x, poleTop, 0]} r={0.11} />
                {base(x, 0)}
                {[bottom + h * 0.2, top - h * 0.2].map((y) => (
                  <Strut key={y} a={[x, y, 0]} b={[edge, y, 0]} r={0.045} />
                ))}
              </group>
            );
          })}
          {extra.map((x) => (
            <group key={x}>
              <Strut a={[x, groundY, back - 0.12]} b={[x, bottom + h * 0.7, back - 0.12]} r={0.1} />
              {base(x, back - 0.12)}
            </group>
          ))}
        </group>
      );
    }

    // hanging — sign hangs from a top arm (1 pole = cantilever) or a beam between two poles
    const topY = top + HANG_RISE;
    const hangXs = w >= 3 ? [-w * 0.3, w * 0.3] : [0];
    const px = w / 2 + 0.35;
    return (
      <group>
        {ground}
        {n === 1 ? (
          <group>
            <Strut a={[-px, groundY, 0]} b={[-px, topY, 0]} r={0.11} />
            {base(-px, 0)}
            <Strut a={[-px, topY, 0]} b={[w / 2 + 0.15, topY, 0]} r={0.07} />
            <Strut a={[-px, topY - 0.9, 0]} b={[-px + Math.max(0.9, w * 0.3), topY, 0]} r={0.04} />
          </group>
        ) : (
          <group>
            {[-px, px].map((x) => (
              <group key={x}>
                <Strut a={[x, groundY, 0]} b={[x, topY + 0.05, 0]} r={0.11} />
                {base(x, 0)}
              </group>
            ))}
            <Strut a={[-px, topY, 0]} b={[px, topY, 0]} r={0.07} />
          </group>
        )}
        {hangXs.map((x) => (
          <group key={x}>
            <Strut a={[x, topY, 0]} b={[x, top, 0]} r={0.025} />
            <Plate pos={[x, top + 0.01, 0]} size={[0.16, 0.05, Math.max(depth, 0.1) + 0.04]} />
          </group>
        ))}
      </group>
    );
  }

  if (mount === "rooftop") {
    // All steel supports sit entirely BEHIND the sign (z <= back).
    const roofY = bottom - below;
    const xs = w > 5 ? [-w * 0.38, 0, w * 0.38] : [-Math.max(w * 0.34, 0.5), Math.max(w * 0.34, 0.5)];
    const legZ = back - 0.1;
    const footZ = back - 2.0;
    return (
      <group>
        <mesh position={[0, roofY - 0.1, back - 1.7]}>
          <boxGeometry args={[Math.max(w, 2) * 2, 0.2, 3.2]} />
          <meshStandardMaterial color="#b9c1c9" roughness={1} />
        </mesh>
        {xs.map((x) => (
          <group key={x}>
            <Strut a={[x, roofY, legZ]} b={[x, bottom + h * 0.6, legZ]} r={0.06} />
            <Strut a={[x, roofY, footZ]} b={[x, bottom + h * 0.55, legZ]} r={0.045} />
            <Plate pos={[x, roofY + 0.02, legZ]} size={[0.5, 0.04, 0.5]} />
            <Plate pos={[x, roofY + 0.02, footZ]} size={[0.4, 0.04, 0.4]} />
            <Plate pos={[x, bottom + h * 0.3, back - 0.03]} size={[0.28, 0.28, 0.06]} />
            <Plate pos={[x, bottom + h * 0.6, back - 0.03]} size={[0.28, 0.28, 0.06]} />
          </group>
        ))}
      </group>
    );
  }

  return null;
}

/** Logo image, or the placeholder text, on the +Z face. */
function Artwork({ w, h, depth, logoUrl, circle = false, fontSize, color, outline, maxWidth }: {
  w: number; h: number; depth: number; logoUrl?: string; circle?: boolean; fontSize: number; color: string; outline: string; maxWidth: number;
}) {
  if (logoUrl) {
    return (
      <Suspense fallback={null}>
        <LogoFace w={w} h={h} depth={depth} logoUrl={logoUrl} circle={circle} />
      </Suspense>
    );
  }
  return (
    <Text
      position={[0, 0, depth / 2 + 0.012]}
      fontSize={fontSize}
      maxWidth={maxWidth}
      anchorX="center"
      anchorY="middle"
      textAlign="center"
      color={color}
      outlineWidth={0.008}
      outlineColor={outline}
    >
      Your Logo
    </Text>
  );
}

function PanaflexMesh({ widthFt, heightFt, traits, logoUrl, showDimensions = true, service, variant = "panaflex", doubleSided, lit, below = 0, poles }: SignSceneProps) {
  const w = Math.max(0.5, widthFt);
  const h = Math.max(0.3, heightFt);
  const depth = Math.max(0.02, traits.frameThickness || 0.12);
  const withLight = lit ?? traits.light !== "none";
  const look = lookOf(service);
  const isNeon = service === "neon";
  const isLightbox = service === "lightbox";
  const inset = isLightbox ? Math.min(0.08, Math.min(w, h) * 0.08) : 0;
  const aw = w - inset * 2;
  const ah = h - inset * 2;
  const dimOff = Math.max(0.55, Math.min(w, h) * 0.18);
  const dimFont = Math.max(0.28, Math.min(w, h) * 0.1);

  const decor = (
    <>
      {isLightbox && (
        <mesh position={[0, 0, depth / 2 + 0.006]}>
          <planeGeometry args={[aw, ah]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
      <Artwork
        w={aw} h={ah} depth={depth} logoUrl={logoUrl}
        fontSize={Math.min(aw * 0.14, ah * 0.28)} maxWidth={aw * 0.9}
        color={isNeon ? "#ff4fd8" : "#222222"} outline={isNeon ? "#ffd1f5" : "#ffffff"}
      />
    </>
  );

  return (
    <group position={[0, (below - aboveFor(traits.mount, poles)) / 2, 0]}>
      <Mounting mount={traits.mount} w={w} h={h} depth={depth} below={below} poles={poles} />

      {isLightbox ? (
        <RoundedBox args={[w, h, depth]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial
            color={variant === "acrylic" ? "#e3f4fb" : "#8f99a3"}
            transparent={variant === "acrylic"}
            opacity={variant === "acrylic" ? 0.62 : 1}
            metalness={variant === "acrylic" ? 0.05 : 0.55}
            roughness={variant === "acrylic" ? 0.12 : 0.4}
          />
        </RoundedBox>
      ) : (
        <RoundedBox args={[w, h, depth]} radius={0.008} castShadow receiveShadow>
          <meshStandardMaterial color={look.color} roughness={look.roughness} metalness={look.metalness} />
        </RoundedBox>
      )}

      {decor}
      {doubleSided && <group rotation={[0, Math.PI, 0]}>{decor}</group>}

      {withLight && <BulbIcon x={w / 2 + dimOff * 0.7} y={h / 2 + 0.2} z={depth / 2 + 0.05} />}

      {showDimensions && (
        <group>
          <DimLine start={[-w / 2, -h / 2, depth / 2]} end={[w / 2, -h / 2, depth / 2]} offset={[0, -dimOff, 0.08]} label={`W ${fmtFt(w)}`} color="#000000" fontSize={dimFont} />
          <DimLine start={[-w / 2, h / 2, depth / 2]} end={[w / 2, h / 2, depth / 2]} offset={[0, dimOff, 0.08]} label={`W ${fmtFt(w)}`} color="#000000" fontSize={dimFont} />
          <DimLine start={[-w / 2, -h / 2, depth / 2]} end={[-w / 2, h / 2, depth / 2]} offset={[-dimOff, 0, 0.08]} label={`H ${fmtFt(h)}`} color="#000000" fontSize={dimFont} />
          <DimLine start={[w / 2, -h / 2, depth / 2]} end={[w / 2, h / 2, depth / 2]} offset={[dimOff, 0, 0.08]} label={`H ${fmtFt(h)}`} color="#000000" fontSize={dimFont} />
          <DimLine start={[w / 2, -h / 2, -depth / 2]} end={[w / 2, -h / 2, depth / 2]} offset={[dimOff * 0.65, -dimOff * 0.45, 0]} label={`T ${Math.round(depth * 12 * 10) / 10}"`} color="#000000" fontSize={dimFont * 0.9} />
        </group>
      )}
    </group>
  );
}

function DiscMesh({ widthFt, traits, logoUrl, showDimensions = true, service, variant = "panaflex", doubleSided, lit, below = 0, poles }: SignSceneProps) {
  const d = Math.max(0.5, widthFt);
  const r = d / 2;
  const depth = Math.max(0.02, traits.frameThickness || 0.12);
  const withLight = lit ?? traits.light !== "none";
  const dimOff = Math.max(0.55, d * 0.18);
  const dimFont = Math.max(0.28, d * 0.1);
  const faceR = r * 0.955;
  const rotX: [number, number, number] = [Math.PI / 2, 0, 0];
  const look = lookOf(service);
  const isNeon = service === "neon";
  const isLightbox = service === "lightbox";
  const builtup = isLightbox && variant === "builtup";
  const acrylicLb = isLightbox && variant === "acrylic";

  const decor = (
    <>
      {builtup && (
        <>
          <mesh position={[0, 0, depth / 2 + 0.004]}>
            <ringGeometry args={[faceR, r, 72]} />
            <meshBasicMaterial color="#5f6a75" />
          </mesh>
          <mesh position={[0, 0, depth / 2 + 0.006]}>
            <circleGeometry args={[faceR, 72]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}
      {acrylicLb && (
        <>
          <mesh position={[0, 0, depth / 2 + 0.004]}>
            <ringGeometry args={[r * 0.985, r, 72]} />
            <meshBasicMaterial color="#8fd3e6" />
          </mesh>
          <mesh position={[0, 0, depth / 2 + 0.006]}>
            <circleGeometry args={[r * 0.985, 72]} />
            <meshBasicMaterial color="#fbfeff" />
          </mesh>
        </>
      )}
      <Artwork
        w={isLightbox ? faceR * 2 : d} h={isLightbox ? faceR * 2 : d} depth={depth} logoUrl={logoUrl} circle
        fontSize={Math.min(d * 0.16, 0.6)} maxWidth={d * 0.75}
        color={isNeon ? "#ff4fd8" : "#222222"} outline={isNeon ? "#ffd1f5" : "#ffffff"}
      />
    </>
  );

  return (
    <group position={[0, (below - aboveFor(traits.mount, poles)) / 2, 0]}>
      <Mounting mount={traits.mount} w={d} h={d} depth={depth} below={below} poles={poles} />

      {builtup && (
        <mesh rotation={rotX}>
          <cylinderGeometry args={[r, r, depth, 72]} />
          <meshStandardMaterial color="#8f99a3" metalness={0.55} roughness={0.4} />
        </mesh>
      )}
      {acrylicLb && (
        <mesh rotation={rotX}>
          <cylinderGeometry args={[r, r, depth, 72]} />
          <meshStandardMaterial color="#e3f4fb" transparent opacity={0.62} roughness={0.12} metalness={0.05} />
        </mesh>
      )}
      {!isLightbox && (
        <mesh rotation={rotX}>
          <cylinderGeometry args={[r, r, depth, 72]} />
          <meshStandardMaterial color={look.color} roughness={look.roughness} metalness={look.metalness} />
        </mesh>
      )}

      {decor}
      {doubleSided && <group rotation={[0, Math.PI, 0]}>{decor}</group>}

      {withLight && <BulbIcon x={r + dimOff * 0.75} y={r * 0.8} z={depth / 2 + 0.05} />}

      {showDimensions && (
        <group>
          <DimLine start={[-r, -r, depth / 2]} end={[r, -r, depth / 2]} offset={[0, -dimOff, 0.08]} label={`Ø ${fmtFt(d)}`} color="#000000" fontSize={dimFont} />
          <DimLine start={[-r, -r, depth / 2]} end={[-r, r, depth / 2]} offset={[-dimOff, 0, 0.08]} label={`Ø ${fmtFt(d)}`} color="#000000" fontSize={dimFont} />
          <DimLine start={[r, -r, -depth / 2]} end={[r, -r, depth / 2]} offset={[dimOff * 0.65, -dimOff * 0.45, 0]} label={`T ${Math.round(depth * 12 * 10) / 10}"`} color="#000000" fontSize={dimFont * 0.9} />
        </group>
      )}
    </group>
  );
}

type CaptureApi = { captureFront: () => string | null; captureSide: () => string | null; captureIso: () => string | null };

function CaptureController({ camDist, onReady }: { camDist: number; onReady: (api: CaptureApi) => void }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const faceCamera = () => {
      scene.traverse((o) => { if (o.userData?.faceCam) o.quaternion.copy(camera.quaternion); });
    };
    const shot = (x: number, y: number, z: number): string | null => {
      try {
        const prev = camera.position.clone();
        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        faceCamera();
        gl.render(scene, camera);
        const data = gl.domElement.toDataURL("image/jpeg", 0.92);
        camera.position.copy(prev);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        faceCamera();
        gl.render(scene, camera);
        return data;
      } catch {
        return null;
      }
    };
    onReady({
      captureFront: () => shot(0, 0, camDist),
      captureSide: () => shot(camDist, 0, 0),
      captureIso: () => shot(camDist * 0.62, camDist * 0.34, camDist * 0.86),
    });
  }, [gl, scene, camera, camDist, onReady]);

  return null;
}


const SignScene = forwardRef<SignSceneHandle, SignSceneProps>(function SignScene(props, ref) {
  const { widthFt, heightFt, shape = "rect" } = props;
  const hh = shape === "circle" ? widthFt : heightFt;
  const below = belowFor(props.traits.mount, hh);
  // Frame the whole composition (sign + pole / rooftop supports), not just the sign
  const maxDim = Math.max(widthFt + (props.traits.mount === "pole" && props.poles?.placement !== "behind" ? 1.2 : 0), hh + below + aboveFor(props.traits.mount, props.poles), 1);
  // Pull camera back enough so big dim labels fit in frame
  const camDist = maxDim * 2.6 + 2.2;
  const apiRef = useRef<CaptureApi | null>(null);

  useImperativeHandle(ref, () => ({
    captureFront: () => apiRef.current?.captureFront() ?? null,
    captureSide: () => apiRef.current?.captureSide() ?? null,
    captureIso: () => apiRef.current?.captureIso() ?? null,
    capturePng: () => apiRef.current?.captureIso() ?? null,
  }));

  const thickness = Math.round((props.traits.frameThickness || 0.12) * 12 * 10) / 10;
  const withLight = props.lit ?? props.traits.light !== "none";
  const dimLabel = shape === "circle" ? `Ø ${fmtFt(widthFt)}` : null;
  const chip = "rounded-full bg-white border border-gray-300 px-2.5 py-1 text-[11px] font-bold text-black shadow-sm";

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-[#f0f3f6] border border-line relative">
      <Canvas
        camera={{ position: [camDist * 0.28, camDist * 0.1, camDist], fov: 32 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#f0f3f6"]} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[5, 7, 6]} intensity={0.5} />
        <Suspense fallback={null}>
          {shape === "circle" ? <DiscMesh {...props} below={below} /> : <PanaflexMesh {...props} below={below} />}
        </Suspense>
        <CaptureController camDist={camDist} onReady={(api) => { apiRef.current = api; }} />
        <OrbitControls makeDefault minDistance={1.5} maxDistance={80} target={[0, 0, 0]} enablePan={false} />
      </Canvas>

      <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
        <span className={chip}>{props.faceLabel || "Face"}</span>
        {props.sidesLabel && <span className={chip}>{props.sidesLabel}</span>}
        {props.printingLabel && <span className={chip}>{props.printingLabel}</span>}
        {props.mountLabel && <span className={chip}>{props.mountLabel}</span>}
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold border shadow-sm ${
            withLight ? "bg-amber-50 border-amber-400 text-black" : "bg-white border-gray-300 text-black"
          }`}
        >
          {withLight ? "💡 With Light" : "Without Light"}
        </span>
      </div>

      {props.showDimensions !== false && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 justify-center pointer-events-none">
          {dimLabel ? (
            <span className="rounded bg-white border-2 border-black px-3 py-1.5 text-xs font-bold text-black shadow">{dimLabel}</span>
          ) : (
            <>
              <span className="rounded bg-white border-2 border-black px-3 py-1.5 text-xs font-bold text-black shadow">W {fmtFt(widthFt)}</span>
              <span className="rounded bg-white border-2 border-black px-3 py-1.5 text-xs font-bold text-black shadow">H {fmtFt(heightFt)}</span>
            </>
          )}
          <span className="rounded bg-white border-2 border-black px-3 py-1.5 text-xs font-bold text-black shadow">
            T {thickness}&quot;
          </span>
        </div>
      )}
    </div>
  );
});

export default SignScene;
