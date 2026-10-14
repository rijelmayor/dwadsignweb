"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Line, Text, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Traits } from "@/lib/traits";
import type { PreviewKind } from "@/lib/catalog";
import LettersMesh, { type LettersSpec } from "@/components/LettersMesh";
import { fmtLen, type LenUnit } from "@/lib/units";
import { BOLT_FINISHES, PANEL_TINTS, type BoltSpec } from "@/lib/bolts";

export type SignShape = "rect" | "circle";
/** panaflex = flat face · builtup = metal-return lightbox · acrylic = acrylic-build lightbox */
export type SceneVariant = "panaflex" | "builtup" | "acrylic";
export interface SignSceneHandle {
  /** Head-on view (W × H dimension lines) */
  captureFront: () => string | null;
  /** Side-on view (thickness + height dimension lines) */
  captureSide: () => string | null;
  /** Angled 3D perspective view with all dimension lines */
  captureIso: () => string | null;
  capturePng: () => string | null;
  /** Iso with transparent background — for site photo overlay */
  captureIsoClear: () => string | null;
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
  /** Number of pole brackets (pole mount shows only the brackets, never the pole itself) */
  brackets?: number;
  /** Extra height under the sign (pole / rooftop supports) — computed by SignScene */
  below?: number;
  /** Live 3D letters / LED neon text (replaces the box) */
  letters?: LettersSpec;
  /** Acrylic panel on advertising bolts (replaces the box) */
  bolts?: BoltSpec;
  /** Units used for the dimension labels (what the sales person typed) */
  unit?: LenUnit;
  depthUnit?: LenUnit;
  /** Hide white studio background (checkerboard / transparent) — useful for clear acrylic */
  clearBackground?: boolean;
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
  fontSize = 0.16,
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
  const ax = (dx / len) * 0.08, ay = (dy / len) * 0.08, az = (dz / len) * 0.08;
  const px = -dy / len * 0.05, py = dx / len * 0.05;
  const lw = 1.6;

  return (
    <group>
      <Line points={[s, e]} color={color} lineWidth={lw} />
      <Line
        points={[
          [s[0] + ax + ay * 0.45, s[1] + ay - ax * 0.45, s[2] + az],
          s,
          [s[0] + ax - ay * 0.45, s[1] + ay + ax * 0.45, s[2] + az],
        ]}
        color={color}
        lineWidth={lw}
      />
      <Line
        points={[
          [e[0] - ax + ay * 0.45, e[1] - ay - ax * 0.45, e[2] - az],
          e,
          [e[0] - ax - ay * 0.45, e[1] - ay + ax * 0.45, e[2] - az],
        ]}
        color={color}
        lineWidth={lw}
      />
      <Line points={[[s[0] + px, s[1] + py, s[2]], [s[0] - px, s[1] - py, s[2]]]} color={color} lineWidth={1.2} />
      <Line points={[[e[0] + px, e[1] + py, e[2]], [e[0] - px, e[1] - py, e[2]]]} color={color} lineWidth={1.2} />
      {/* Compact label with white pad for readability */}
      <FaceCam position={mid}>
        <Text
          position={[0, 0, 0.03]}
          fontSize={fontSize}
          color="#0a0a0a"
          anchorX="center"
          anchorY="middle"
          outlineWidth={fontSize * 0.12}
          outlineColor="#ffffff"
          fillOpacity={1}
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
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
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

/** Extra height needed under the sign for freestanding mounts. */
function belowFor(mount: Traits["mount"], h: number) {
  if (mount === "rooftop") return 1.4;
  if (mount === "pole_single") return Math.max(1.8, h * 0.55);
  // hanging uses space above, not below — framing still needs room via camDist
  return 0;
}

/** Real, visible mounting hardware: wall slab, wall brackets, pole(s) or rooftop steel supports. */
/** C-clamp pole bracket on the back of the sign (no pole drawn — the pole is not part of the quotation). */
function PoleBracket({ x, y, back }: { x: number; y: number; back: number }) {
  const R = 0.14;
  const plateZ = back - 0.025;
  const cz = back - 0.05 - 0.02;
  return (
    <group>
      <Plate pos={[x, y, plateZ]} size={[0.42, 0.5, 0.05]} />
      {[-0.13, 0.13].map((dy) => (
        <group key={dy}>
          <mesh position={[x, y + dy, cz - 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[R, 0.034, 12, 28, Math.PI]} />
            <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.35} />
          </mesh>
          <Strut a={[x - R, y + dy, back - 0.05]} b={[x - R, y + dy, cz - 0.02]} r={0.034} />
          <Strut a={[x + R, y + dy, back - 0.05]} b={[x + R, y + dy, cz - 0.02]} r={0.034} />
        </group>
      ))}
      {/* clamp bolts */}
      {[-R, R].map((dx) => (
        <mesh key={dx} position={[x + dx, y, back - 0.075]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.1, 10]} />
          <meshStandardMaterial color="#4b535b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Mounting({ mount, w, h, depth, below, brackets = 1 }: { mount: Traits["mount"]; w: number; h: number; depth: number; below: number; brackets?: number }) {
  const back = -depth / 2;
  const bigW = Math.max(w, 2) * 4;
  const bigH = Math.max(h, 2) * 4;
  const bottom = -h / 2;
  const top = h / 2;

  if (mount === "wall") {
    // Flush against the wall — light wall so it doesn’t gray out the scene
    return (
      <mesh position={[0, 0, back - 0.004 - 0.12]}>
        <boxGeometry args={[bigW, bigH, 0.24]} />
        <meshStandardMaterial color="#e8eaed" roughness={0.92} />
      </mesh>
    );
  }

  if (mount === "bracket") {
    // Side-projecting / blade arm — brackets prop = 1 (single) or 2 (double)
    const armLen = Math.max(0.55, Math.min(w, h) * 0.35);
    const wallX = -w / 2 - armLen;
    const n = Math.max(1, Math.min(2, Math.round(brackets)));
    const armYs = n === 1 ? [0] : [h * 0.22, -h * 0.22];
    return (
      <group>
        <mesh position={[wallX - 0.12, 0, 0]}>
          <boxGeometry args={[0.24, bigH, bigW * 0.5]} />
          <meshStandardMaterial color="#e8eaed" roughness={0.92} />
        </mesh>
        {armYs.map((armY) => (
          <group key={armY}>
            <Strut a={[wallX, armY, 0]} b={[-w / 2 + 0.02, armY, 0]} r={n === 1 ? 0.04 : 0.032} />
            <Plate pos={[wallX + 0.02, armY, 0]} size={[0.06, 0.28, 0.28]} />
            <Plate pos={[-w / 2 - 0.02, armY, 0]} size={[0.05, 0.22, 0.22]} />
          </group>
        ))}
      </group>
    );
  }

  if (mount === "hanging") {
    // Ceiling hang — 1 or 2 rods from brackets prop
    const cableTop = top + Math.max(0.7, h * 0.35);
    const n = Math.max(1, Math.min(2, Math.round(brackets)));
    const xs = n === 1 ? [0] : (w > 0.8 ? [-w * 0.32, w * 0.32] : [-0.2, 0.2]);
    return (
      <group>
        <mesh position={[0, cableTop + 0.08, 0]}>
          <boxGeometry args={[Math.max(w * 1.4, 2), 0.12, Math.max(depth * 3, 1.2)]} />
          <meshStandardMaterial color="#e8eaed" roughness={0.9} />
        </mesh>
        {xs.map((x) => (
          <group key={x}>
            <Strut a={[x, top + 0.02, 0]} b={[x, cableTop, 0]} r={0.018} color="#333" />
            <Plate pos={[x, top + 0.02, 0]} size={[0.12, 0.04, 0.12]} />
            <Plate pos={[x, cableTop - 0.02, 0]} size={[0.14, 0.04, 0.14]} />
          </group>
        ))}
      </group>
    );
  }

  if (mount === "pole") {
    // Pole bracket only: 1 bracket centred, or 2 spread along the long side of a larger rectangle.
    const n = Math.max(1, Math.min(2, Math.round(brackets)));
    const wide = w >= h;
    const spots: [number, number][] =
      n === 1 ? [[0, 0]] : wide ? [[-w * 0.3, 0], [w * 0.3, 0]] : [[0, -h * 0.3], [0, h * 0.3]];
    return (
      <group>
        {spots.map(([x, y]) => (
          <PoleBracket key={`${x}_${y}`} x={x} y={y} back={back} />
        ))}
      </group>
    );
  }

  if (mount === "pole_single") {
    // Single vertical pole — 1 or 2 arms from brackets prop
    const poleH = h + below + 0.4;
    const poleX = -w / 2 - 0.18;
    const poleBottom = bottom - below;
    const poleTop = top + 0.25;
    const poleMidY = (poleTop + poleBottom) / 2;
    const n = Math.max(1, Math.min(2, Math.round(brackets)));
    const armYs = n === 1 ? [0] : [h * 0.28, -h * 0.28];
    return (
      <group>
        <mesh position={[poleX, poleBottom - 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.4, 0.08, 20]} />
          <meshStandardMaterial color="#9aa3ab" roughness={0.85} />
        </mesh>
        <mesh position={[poleX, poleMidY, 0]}>
          <cylinderGeometry args={[0.07, 0.08, poleH, 16]} />
          <meshStandardMaterial color="#5c656e" metalness={0.55} roughness={0.4} />
        </mesh>
        {armYs.map((ay) => (
          <group key={ay}>
            <Strut a={[poleX + 0.08, ay, 0]} b={[-w / 2 + 0.02, ay, 0]} r={0.028} />
            <Plate pos={[poleX + 0.06, ay, 0]} size={[0.08, 0.16, 0.16]} />
            <Plate pos={[-w / 2 - 0.02, ay, 0]} size={[0.05, 0.14, 0.14]} />
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

function PanaflexMesh({ widthFt, heightFt, traits, logoUrl, showDimensions = true, service, variant = "panaflex", doubleSided, lit, below = 0, brackets, unit, depthUnit }: SignSceneProps) {
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
  const dimOff = Math.max(0.28, Math.min(w, h) * 0.1);
  const dimFont = Math.max(0.12, Math.min(0.22, Math.min(w, h) * 0.055));
  const bodyCol = traits.bodyColor || (isLightbox ? (variant === "acrylic" ? "#e3f4fb" : "#8f99a3") : look.color);
  const returnCol = traits.returnColor || bodyCol;
  const splitReturns = returnCol.toLowerCase() !== bodyCol.toLowerCase();

  const decor = (
    <>
      {isLightbox && (
        <mesh position={[0, 0, depth / 2 + 0.006]}>
          <planeGeometry args={[aw, ah]} />
          <meshBasicMaterial color={bodyCol} />
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
    <group position={[0, below / 2, 0]}>
      <Mounting mount={traits.mount} w={w} h={h} depth={depth} below={below} brackets={brackets} />

      {isLightbox ? (
        <RoundedBox args={[w, h, depth]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial
            color={returnCol}
            transparent={variant === "acrylic"}
            opacity={variant === "acrylic" ? 0.62 : 1}
            metalness={variant === "acrylic" ? 0.05 : 0.55}
            roughness={variant === "acrylic" ? 0.12 : 0.4}
          />
        </RoundedBox>
      ) : (
        <RoundedBox args={[w, h, depth]} radius={0.008} castShadow receiveShadow>
          <meshStandardMaterial
            color={returnCol}
            roughness={look.roughness}
            metalness={look.metalness}
            transparent={variant === "acrylic" || service === "acrylic"}
            opacity={variant === "acrylic" || service === "acrylic" ? 0.72 : 1}
          />
        </RoundedBox>
      )}
      {/* Front face panel when depth/returns color differs from body */}
      {splitReturns && (
        <mesh position={[0, 0, depth / 2 + 0.004]}>
          <planeGeometry args={[w * 0.995, h * 0.995]} />
          <meshStandardMaterial color={bodyCol} roughness={0.45} metalness={0.05} />
        </mesh>
      )}

      {decor}
      {doubleSided && <group rotation={[0, Math.PI, 0]}>{decor}</group>}

      {withLight && <BulbIcon x={w / 2 + dimOff * 0.7} y={h / 2 + 0.2} z={depth / 2 + 0.05} />}

      {showDimensions && (
        <group>
          {/* One label per axis — cleaner, easier to read */}
          <DimLine start={[-w / 2, -h / 2, depth / 2]} end={[w / 2, -h / 2, depth / 2]} offset={[0, -dimOff, 0.06]} label={`W ${fmtLen(w, unit)}`} color="#111" fontSize={dimFont} />
          <DimLine start={[-w / 2, -h / 2, depth / 2]} end={[-w / 2, h / 2, depth / 2]} offset={[-dimOff, 0, 0.06]} label={`H ${fmtLen(h, unit)}`} color="#111" fontSize={dimFont} />
          <DimLine start={[w / 2, -h / 2, -depth / 2]} end={[w / 2, -h / 2, depth / 2]} offset={[dimOff * 0.5, -dimOff * 0.35, 0]} label={`T ${fmtLen(depth, depthUnit ?? "in")}`} color="#111" fontSize={dimFont * 0.92} />
        </group>
      )}
    </group>
  );
}

function DiscMesh({ widthFt, traits, logoUrl, showDimensions = true, service, variant = "panaflex", doubleSided, lit, below = 0, brackets, unit, depthUnit }: SignSceneProps) {
  const d = Math.max(0.5, widthFt);
  const r = d / 2;
  const depth = Math.max(0.02, traits.frameThickness || 0.12);
  const withLight = lit ?? traits.light !== "none";
  const dimOff = Math.max(0.28, d * 0.1);
  const dimFont = Math.max(0.12, Math.min(0.22, d * 0.055));
  const faceR = r * 0.955;
  const rotX: [number, number, number] = [Math.PI / 2, 0, 0];
  const look = lookOf(service);
  const isNeon = service === "neon";
  const isLightbox = service === "lightbox";
  const builtup = isLightbox && variant === "builtup";
  const acrylicLb = isLightbox && variant === "acrylic";
  const bodyCol = traits.bodyColor || (acrylicLb ? "#fbfeff" : builtup ? "#ffffff" : look.color);
  const returnCol = traits.returnColor || (builtup ? "#8f99a3" : acrylicLb ? "#e3f4fb" : look.color);

  const decor = (
    <>
      {builtup && (
        <>
          <mesh position={[0, 0, depth / 2 + 0.004]}>
            <ringGeometry args={[faceR, r, 72]} />
            <meshBasicMaterial color={returnCol} />
          </mesh>
          <mesh position={[0, 0, depth / 2 + 0.006]}>
            <circleGeometry args={[faceR, 72]} />
            <meshBasicMaterial color={bodyCol} />
          </mesh>
        </>
      )}
      {acrylicLb && (
        <>
          <mesh position={[0, 0, depth / 2 + 0.004]}>
            <ringGeometry args={[r * 0.985, r, 72]} />
            <meshBasicMaterial color={returnCol} />
          </mesh>
          <mesh position={[0, 0, depth / 2 + 0.006]}>
            <circleGeometry args={[r * 0.985, 72]} />
            <meshBasicMaterial color={bodyCol} />
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
    <group position={[0, below / 2, 0]}>
      <Mounting mount={traits.mount} w={d} h={d} depth={depth} below={below} brackets={brackets} />

      {builtup && (
        <mesh rotation={rotX}>
          <cylinderGeometry args={[r, r, depth, 72]} />
          <meshStandardMaterial color={returnCol} metalness={0.55} roughness={0.4} />
        </mesh>
      )}
      {acrylicLb && (
        <mesh rotation={rotX}>
          <cylinderGeometry args={[r, r, depth, 72]} />
          <meshStandardMaterial color={returnCol} transparent opacity={0.62} roughness={0.12} metalness={0.05} />
        </mesh>
      )}
      {!isLightbox && (
        <mesh rotation={rotX}>
          <cylinderGeometry args={[r, r, depth, 72]} />
          <meshStandardMaterial color={returnCol} roughness={look.roughness} metalness={look.metalness} />
        </mesh>
      )}
      {!isLightbox && returnCol.toLowerCase() !== bodyCol.toLowerCase() && (
        <mesh position={[0, 0, depth / 2 + 0.004]}>
          <circleGeometry args={[r * 0.99, 64]} />
          <meshStandardMaterial color={bodyCol} roughness={0.45} metalness={0.05} />
        </mesh>
      )}

      {decor}
      {doubleSided && <group rotation={[0, Math.PI, 0]}>{decor}</group>}

      {withLight && <BulbIcon x={r + dimOff * 0.75} y={r * 0.8} z={depth / 2 + 0.05} />}

      {showDimensions && (
        <group>
          <DimLine start={[-r, -r, depth / 2]} end={[r, -r, depth / 2]} offset={[0, -dimOff, 0.06]} label={`Ø ${fmtLen(d, unit)}`} color="#111" fontSize={dimFont} />
          <DimLine start={[r, -r, -depth / 2]} end={[r, -r, depth / 2]} offset={[dimOff * 0.5, -dimOff * 0.35, 0]} label={`T ${fmtLen(depth, depthUnit ?? "in")}`} color="#111" fontSize={dimFont * 0.92} />
        </group>
      )}
    </group>
  );
}

type CaptureApi = {
  captureFront: () => string | null;
  captureSide: () => string | null;
  captureIso: () => string | null;
  /** Iso PNG with transparent background — for placing on site photos */
  captureIsoClear: () => string | null;
};

function CaptureController({ camDist, onReady }: { camDist: number; onReady: (api: CaptureApi) => void }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const faceCamera = () => {
      scene.traverse((o) => { if (o.userData?.faceCam) o.quaternion.copy(camera.quaternion); });
    };
    const shot = (x: number, y: number, z: number, clearBg = false): string | null => {
      try {
        const prev = camera.position.clone();
        const prevClear = gl.getClearColor(new THREE.Color());
        const prevAlpha = gl.getClearAlpha();
        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        faceCamera();
        if (clearBg) {
          gl.setClearColor(0x000000, 0);
          // Hide ground/environment if any — scene background null
          const prevBg = scene.background;
          scene.background = null;
          gl.render(scene, camera);
          const data = gl.domElement.toDataURL("image/png");
          scene.background = prevBg;
          gl.setClearColor(prevClear, prevAlpha);
          camera.position.copy(prev);
          camera.lookAt(0, 0, 0);
          camera.updateMatrixWorld();
          faceCamera();
          gl.render(scene, camera);
          return data;
        }
        gl.render(scene, camera);
        // High-quality PNG for crisp quote sheet
        const data = gl.domElement.toDataURL("image/png");
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
      captureIsoClear: () => shot(camDist * 0.55, camDist * 0.22, camDist * 0.78, true),
    });
  }, [gl, scene, camera, camDist, onReady]);

  return null;
}


/** Acrylic panel held off the wall by advertising bolts (standoffs) — flat cut, printed with sticker / UV. */
function BoltPanelMesh({ widthFt, heightFt, shape = "rect", bolts, logoUrl, showDimensions = true, unit, depthUnit }: SignSceneProps & { bolts: BoltSpec }) {
  const circle = shape === "circle";
  const w = Math.max(0.5, widthFt);
  const h = circle ? w : Math.max(0.3, heightFt);
  const pt = bolts.panelMm / 304.8;
  const so = bolts.standoffMm / 304.8;
  const r = bolts.diaMm / 304.8 / 2;
  const capT = 0.011;
  const tint = PANEL_TINTS.find((t) => t.id === bolts.tint) ?? PANEL_TINTS[0];
  const fin = BOLT_FINISHES.find((f) => f.id === bolts.finish) ?? BOLT_FINISHES[0];
  const dimOff = Math.max(0.28, Math.min(w, h) * 0.1);
  const dimFont = Math.max(0.12, Math.min(0.22, Math.min(w, h) * 0.055));
  const inset = Math.max(r * 2.2, Math.min(0.14, Math.min(w, h) * 0.12));
  const total = pt + so + capT;

  const points: [number, number][] = [];
  if (circle) {
    const n = bolts.count, off = n === 4 ? Math.PI / 4 : Math.PI / 6, rr = w / 2 - inset;
    for (let i = 0; i < n; i++) points.push([Math.cos(off + (i * 2 * Math.PI) / n) * rr, Math.sin(off + (i * 2 * Math.PI) / n) * rr]);
  } else {
    const x = w / 2 - inset, y = h / 2 - inset;
    points.push([-x, y], [x, y], [-x, -y], [x, -y]);
    if (bolts.count === 6) points.push([0, y], [0, -y]);
  }

  const panelGeo = useMemo(() => (circle ? new THREE.CylinderGeometry(w / 2, w / 2, pt, 64) : new THREE.BoxGeometry(w, h, pt)), [circle, w, h, pt]);
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(panelGeo, 25), [panelGeo]);
  const wallW = Math.max(w, 2) * 4, wallH = Math.max(h, 2) * 4;
  const art = Math.max(0.2, Math.min(w, h) - inset * 3);

  return (
    <group>
      {/* wall */}
      <mesh position={[0, 0, -pt / 2 - so - 0.12]}>
        <boxGeometry args={[wallW, wallH, 0.24]} />
        <meshStandardMaterial color="#e8eaed" roughness={0.92} />
      </mesh>

      {/* acrylic panel */}
      <mesh geometry={panelGeo} rotation={circle ? [Math.PI / 2, 0, 0] : [0, 0, 0]} castShadow>
        <meshStandardMaterial color={tint.color} transparent={tint.opacity < 1} opacity={tint.opacity} roughness={0.08} metalness={0} depthWrite={tint.opacity >= 1} />
      </mesh>
      <lineSegments geometry={edgeGeo} rotation={circle ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
        <lineBasicMaterial color={tint.edge} />
      </lineSegments>

      {/* printed artwork (sticker / UV) */}
      <Artwork w={circle ? art : w - inset * 3} h={circle ? art : h - inset * 3} depth={pt} logoUrl={logoUrl} circle={circle}
        fontSize={Math.min(w * 0.14, h * 0.28)} maxWidth={Math.max(0.3, w - inset * 3.2)} color={tint.ink} outline={tint.outline} />

      {/* advertising bolts: barrel behind the panel + round cap on the face */}
      {points.map(([x, y], i) => (
        <group key={i} position={[x, y, 0]}>
          <mesh position={[0, 0, -pt / 2 - so / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[r * 0.82, r * 0.82, so, 20]} />
            <meshStandardMaterial color={fin.color} metalness={fin.metalness} roughness={fin.roughness} />
          </mesh>
          <mesh position={[0, 0, pt / 2 + capT / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[r, r, capT, 24]} />
            <meshStandardMaterial color={fin.color} metalness={fin.metalness} roughness={fin.roughness} />
          </mesh>
        </group>
      ))}

      {showDimensions && (
        <group>
          {circle ? (
            <DimLine start={[-w / 2, -h / 2, pt / 2]} end={[w / 2, -h / 2, pt / 2]} offset={[0, -dimOff, 0.06]} label={`Ø ${fmtLen(w, unit)}`} color="#111" fontSize={dimFont} />
          ) : (
            <>
              <DimLine start={[-w / 2, -h / 2, pt / 2]} end={[w / 2, -h / 2, pt / 2]} offset={[0, -dimOff, 0.06]} label={`W ${fmtLen(w, unit)}`} color="#111" fontSize={dimFont} />
              <DimLine start={[-w / 2, -h / 2, pt / 2]} end={[-w / 2, h / 2, pt / 2]} offset={[-dimOff, 0, 0.06]} label={`H ${fmtLen(h, unit)}`} color="#111" fontSize={dimFont} />
            </>
          )}
          <DimLine start={[w / 2, -h / 2, -pt / 2 - so]} end={[w / 2, -h / 2, pt / 2 + capT]} offset={[dimOff * 0.5, -dimOff * 0.35, 0]} label={`T ${fmtLen(total, depthUnit ?? "in")}`} color="#111" fontSize={dimFont * 0.92} />
        </group>
      )}
    </group>
  );
}

const SignScene = forwardRef<SignSceneHandle, SignSceneProps>(function SignScene(props, ref) {
  const { widthFt, heightFt, shape = "rect" } = props;
  const hh = shape === "circle" ? widthFt : heightFt;
  const below = belowFor(props.traits.mount, hh);
  // Frame the whole composition (sign + pole / rooftop supports), not just the sign
  const maxDim = Math.max(widthFt, hh + below, 1);
  // Framing — labels are compact so we can stay closer
  const camDist = maxDim * 2.15 + 1.6;
  const apiRef = useRef<CaptureApi | null>(null);

  useImperativeHandle(ref, () => ({
    captureFront: () => apiRef.current?.captureFront() ?? null,
    captureSide: () => apiRef.current?.captureSide() ?? null,
    captureIso: () => apiRef.current?.captureIso() ?? null,
    capturePng: () => apiRef.current?.captureIso() ?? null,
    captureIsoClear: () => apiRef.current?.captureIsoClear() ?? null,
  }));

  const thicknessLabel = fmtLen(props.bolts ? (props.bolts.panelMm + props.bolts.standoffMm) / 304.8 : (props.traits.frameThickness || 0.12), props.depthUnit ?? "in");
  const withLight = props.lit ?? props.traits.light !== "none";
  const dimLabel = shape === "circle" ? `Ø ${fmtLen(widthFt, props.unit)}` : null;
  const chip = "rounded-full bg-white border border-gray-300 px-2.5 py-1 text-[11px] font-bold text-black shadow-sm";
  const clearBg = !!props.clearBackground;

  return (
    <div
      className={`w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-line relative ${
        clearBg ? "bg-[#d4d4d8]" : "bg-white"
      }`}
      style={
        clearBg
          ? {
              backgroundImage:
                "linear-gradient(45deg,#c4c4c8 25%,transparent 25%),linear-gradient(-45deg,#c4c4c8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#c4c4c8 75%),linear-gradient(-45deg,transparent 75%,#c4c4c8 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
            }
          : undefined
      }
    >
      <Canvas
        camera={{ position: [camDist * 0.28, camDist * 0.1, camDist], fov: 30 }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
          alpha: true,
          premultipliedAlpha: false,
        }}
        dpr={[1.5, 2.5]}
      >
        {!clearBg && <color attach="background" args={["#ffffff"]} />}
        <ambientLight intensity={1.25} />
        <directionalLight position={[5, 7, 6]} intensity={0.65} />
        <directionalLight position={[-4, 3, -2]} intensity={0.25} />
        <Suspense fallback={null}>
          {props.letters ? (
            <LettersMesh spec={props.letters} widthFt={widthFt} heightFt={heightFt}>
              {props.showDimensions !== false && (
                <>
                  <DimLine start={[-widthFt / 2, -heightFt / 2, 0]} end={[widthFt / 2, -heightFt / 2, 0]} offset={[0, -Math.max(0.28, Math.min(widthFt, heightFt) * 0.1), 0.06]} label={`W ${fmtLen(widthFt, props.unit)}`} color="#111" fontSize={Math.max(0.12, Math.min(0.22, Math.min(widthFt, heightFt) * 0.055))} />
                  <DimLine start={[-widthFt / 2, -heightFt / 2, 0]} end={[-widthFt / 2, heightFt / 2, 0]} offset={[-Math.max(0.28, Math.min(widthFt, heightFt) * 0.1), 0, 0.06]} label={`H ${fmtLen(heightFt, props.unit)}`} color="#111" fontSize={Math.max(0.12, Math.min(0.22, Math.min(widthFt, heightFt) * 0.055))} />
                </>
              )}
            </LettersMesh>
          ) : props.bolts ? <BoltPanelMesh {...props} bolts={props.bolts} /> : shape === "circle" ? <DiscMesh {...props} below={below} /> : <PanaflexMesh {...props} below={below} />}
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
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5 justify-center pointer-events-none">
          {dimLabel ? (
            <span className="rounded-md bg-white/95 border border-gray-400 px-2 py-0.5 text-[10px] font-semibold text-black shadow-sm">{dimLabel}</span>
          ) : (
            <>
              <span className="rounded-md bg-white/95 border border-gray-400 px-2 py-0.5 text-[10px] font-semibold text-black shadow-sm">W {fmtLen(widthFt, props.unit)}</span>
              <span className="rounded-md bg-white/95 border border-gray-400 px-2 py-0.5 text-[10px] font-semibold text-black shadow-sm">H {fmtLen(heightFt, props.unit)}</span>
            </>
          )}
          <span className="rounded-md bg-white/95 border border-gray-400 px-2 py-0.5 text-[10px] font-semibold text-black shadow-sm">
            T {thicknessLabel}
          </span>
        </div>
      )}
    </div>
  );
});

export default SignScene;
