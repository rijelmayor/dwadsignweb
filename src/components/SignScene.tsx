"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Line, Text, useTexture } from "@react-three/drei";
import { Suspense, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import type { Traits } from "@/lib/traits";
import type { PreviewKind } from "@/lib/catalog";

export interface SignSceneHandle {
  /** Front view (W × H) with logo stretched corner-to-corner */
  captureFront: () => string | null;
  /** Side view showing thickness (T) clearly */
  captureSide: () => string | null;
  /** Alias — front view */
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
}

function fmtFt(n: number) {
  const r = Math.round(n * 100) / 100;
  return `${r}'`;
}

function DimLine({
  start,
  end,
  label,
  offset = [0, 0, 0] as [number, number, number],
  color = "#f3b33c",
  fontSize = 0.18,
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
  const ax = (dx / len) * 0.12, ay = (dy / len) * 0.12, az = (dz / len) * 0.12;
  return (
    <group>
      <Line points={[s, e]} color={color} lineWidth={2.5} />
      <Line
        points={[
          [s[0] + ax + ay * 0.4, s[1] + ay - ax * 0.4, s[2] + az],
          s,
          [s[0] + ax - ay * 0.4, s[1] + ay + ax * 0.4, s[2] + az],
        ]}
        color={color}
        lineWidth={2.5}
      />
      <Line
        points={[
          [e[0] - ax + ay * 0.4, e[1] - ay - ax * 0.4, e[2] - az],
          e,
          [e[0] - ax - ay * 0.4, e[1] - ay + ax * 0.4, e[2] - az],
        ]}
        color={color}
        lineWidth={2.5}
      />
      <Text
        position={[mid[0], mid[1], mid[2] + 0.02]}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#011424"
      >
        {label}
      </Text>
    </group>
  );
}

/** Client logo / design stretched full face — corner to corner */
function LogoFace({ w, h, depth, logoUrl }: { w: number; h: number; depth: number; logoUrl: string }) {
  const texture = useTexture(logoUrl);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
  }, [texture]);
  return (
    <mesh position={[0, 0, depth / 2 + 0.008]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

/** Simple bulb icon — indicates "With Light" without blurring the face */
function BulbIcon({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <group position={[x, y, z]}>
      {/* bulb glass */}
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#ffe566" />
      </mesh>
      {/* base */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.06, 12]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      {/* glow ring (flat, no scene blur) */}
      <mesh position={[0, 0.06, -0.01]}>
        <circleGeometry args={[0.16, 24]} />
        <meshBasicMaterial color="#ffcc33" transparent opacity={0.35} />
      </mesh>
      <Text
        position={[0, -0.2, 0]}
        fontSize={0.11}
        color="#c98900"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#ffffff"
      >
        WITH LIGHT
      </Text>
    </group>
  );
}

function PanaflexMesh({
  widthFt,
  heightFt,
  traits,
  logoUrl,
  showDimensions = true,
  faceLabel,
  sideView = false,
}: SignSceneProps & { sideView?: boolean }) {
  const w = Math.max(0.5, widthFt);
  const h = Math.max(0.3, heightFt);
  const depth = Math.max(0.04, traits.frameThickness || 0.12);
  const withLight = traits.light !== "none";
  const dimColor = "#f3b33c";
  const faceColor =
    faceLabel === "APC"
      ? "#d8dde2"
      : faceLabel === "Metal Sheet"
        ? "#aeb7bf"
        : faceLabel === "Acrylic"
          ? "#f5fbff"
          : "#ffffff";

  // Side-panel color for thickness view
  const edgeColor = "#c5ced6";

  return (
    <group rotation={sideView ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
      {/* Ground plane */}
      <mesh position={[0, 0, -depth - 0.1]} receiveShadow>
        <planeGeometry args={[Math.max(w, depth) * 3.5, h * 3.5]} />
        <meshBasicMaterial color="#e7edf2" />
      </mesh>

      {/* Sign body — clean, no emissive / no blur lighting */}
      <RoundedBox args={[w, h, depth]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial
          color={faceColor}
          roughness={0.75}
          metalness={faceLabel === "Metal Sheet" ? 0.4 : 0.02}
        />
      </RoundedBox>

      {/* Full-bleed logo corner-to-corner */}
      {logoUrl ? (
        <Suspense fallback={null}>
          <LogoFace w={w} h={h} depth={depth} logoUrl={logoUrl} />
        </Suspense>
      ) : (
        <Text
          position={[0, 0, depth / 2 + 0.012]}
          fontSize={Math.min(w * 0.12, h * 0.25)}
          maxWidth={w * 0.9}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          color="#17212b"
          outlineWidth={0.006}
          outlineColor="#ffffff"
        >
          Your Logo
        </Text>
      )}

      {/* Bulb badge when With Light — no scene glow */}
      {withLight && !sideView && (
        <BulbIcon x={w / 2 + 0.35} y={h / 2 + 0.15} z={depth / 2 + 0.05} />
      )}
      {withLight && sideView && (
        <BulbIcon x={depth / 2 + 0.25} y={h / 2 + 0.15} z={w / 2 + 0.05} />
      )}

      {showDimensions && !sideView && (
        <group>
          <DimLine
            start={[-w / 2, -h / 2, depth / 2]}
            end={[w / 2, -h / 2, depth / 2]}
            offset={[0, -0.42, 0.06]}
            label={`W ${fmtFt(w)}`}
            color={dimColor}
          />
          <DimLine
            start={[-w / 2, -h / 2, depth / 2]}
            end={[-w / 2, h / 2, depth / 2]}
            offset={[-0.48, 0, 0.06]}
            label={`H ${fmtFt(h)}`}
            color={dimColor}
          />
          <DimLine
            start={[w / 2, -h / 2, depth / 2]}
            end={[w / 2, h / 2, depth / 2]}
            offset={[0.48, 0, 0.06]}
            label={`H ${fmtFt(h)}`}
            color={dimColor}
          />
          <DimLine
            start={[-w / 2, h / 2, depth / 2]}
            end={[w / 2, h / 2, depth / 2]}
            offset={[0, 0.42, 0.06]}
            label={`W ${fmtFt(w)}`}
            color={dimColor}
          />
        </group>
      )}

      {/* Thickness dimensions — always clear on side view; also small callout on front */}
      {showDimensions && sideView && (
        <group>
          {/* Thickness along depth (now on X after rotation) */}
          <DimLine
            start={[-w / 2, -h / 2, -depth / 2]}
            end={[-w / 2, -h / 2, depth / 2]}
            offset={[0, -0.45, 0]}
            label={`T ${Math.round(depth * 12 * 10) / 10}"`}
            color="#1ecac9"
            fontSize={0.22}
          />
          <DimLine
            start={[-w / 2, -h / 2, depth / 2]}
            end={[-w / 2, h / 2, depth / 2]}
            offset={[0, 0, 0.4]}
            label={`H ${fmtFt(h)}`}
            color={dimColor}
          />
          {/* Edge panel hint */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[w * 0.99, h * 0.99, depth * 0.99]} />
            <meshBasicMaterial color={edgeColor} wireframe transparent opacity={0} />
          </mesh>
        </group>
      )}

      {showDimensions && !sideView && (
        <DimLine
          start={[w / 2, -h / 2, -depth / 2]}
          end={[w / 2, -h / 2, depth / 2]}
          offset={[0.35, -0.2, 0]}
          label={`T ${Math.round(depth * 12 * 10) / 10}"`}
          color="#1ecac9"
          fontSize={0.14}
        />
      )}
    </group>
  );
}

function CaptureController({
  onReady,
}: {
  onReady: (api: {
    captureFront: () => string | null;
    captureSide: () => string | null;
  }) => void;
}) {
  const { gl, scene, camera } = useThree();
  const savedPos = useRef(new THREE.Vector3());
  const savedTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    onReady({
      captureFront: () => {
        try {
          gl.render(scene, camera);
          return gl.domElement.toDataURL("image/png");
        } catch {
          return null;
        }
      },
      captureSide: () => {
        try {
          savedPos.current.copy(camera.position);
          // Pure profile — look at the thickness edge (X axis)
          const dist = Math.max(camera.position.length(), 3);
          camera.position.set(dist * 1.1, dist * 0.15, 0);
          camera.lookAt(0, 0, 0);
          camera.updateMatrixWorld();
          gl.render(scene, camera);
          const data = gl.domElement.toDataURL("image/png");
          camera.position.copy(savedPos.current);
          camera.lookAt(0, 0, 0);
          camera.updateMatrixWorld();
          gl.render(scene, camera);
          return data;
        } catch {
          return null;
        }
      },
    });
  }, [gl, scene, camera, onReady]);

  return null;
}

const SignScene = forwardRef<SignSceneHandle, SignSceneProps>(function SignScene(props, ref) {
  const { widthFt, heightFt } = props;
  const maxDim = Math.max(widthFt, heightFt, 1);
  const camDist = maxDim * 2.0 + 1.6;
  const apiRef = useRef<{
    captureFront: () => string | null;
    captureSide: () => string | null;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    captureFront: () => apiRef.current?.captureFront() ?? null,
    captureSide: () => apiRef.current?.captureSide() ?? null,
    capturePng: () => apiRef.current?.captureFront() ?? null,
  }));

  const thickness = Math.round((props.traits.frameThickness || 0.12) * 12 * 10) / 10;
  const withLight = props.traits.light !== "none";

  return (
    <div className="w-full h-full min-h-[360px] rounded-xl overflow-hidden bg-[#eef2f5] border border-line relative">
      <Canvas
        camera={{ position: [camDist * 0.35, camDist * 0.12, camDist], fov: 34 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={["#eef2f5"]} />
        {/* Flat, even lighting — no bloom / no blur */}
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 6, 5]} intensity={0.55} />
        <Suspense fallback={null}>
          <PanaflexMesh {...props} />
        </Suspense>
        <CaptureController onReady={(api) => { apiRef.current = api; }} />
        <OrbitControls makeDefault minDistance={1} maxDistance={40} target={[0, 0, 0]} enablePan={false} />
      </Canvas>

      <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
        <span className="rounded-full bg-white/95 border border-gray-300 px-2.5 py-1 text-[10px] font-bold text-ink">
          {props.faceLabel || "Face"}
        </span>
        {props.printingLabel && (
          <span className="rounded-full bg-white/95 border border-gray-300 px-2.5 py-1 text-[10px] font-bold text-ink">
            {props.printingLabel}
          </span>
        )}
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${
            withLight
              ? "bg-amber-50 border-amber-400 text-amber-800"
              : "bg-white/95 border-gray-300 text-ink"
          }`}
        >
          {withLight ? "💡 With Light" : "Without Light"}
        </span>
      </div>

      {props.showDimensions !== false && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 justify-center pointer-events-none">
          <span className="rounded bg-ink/90 border border-gold/50 px-2.5 py-1 text-[10px] font-semibold text-gold">
            W {fmtFt(widthFt)}
          </span>
          <span className="rounded bg-ink/90 border border-gold/50 px-2.5 py-1 text-[10px] font-semibold text-gold">
            H {fmtFt(heightFt)}
          </span>
          <span className="rounded bg-ink/90 border border-teal/50 px-2.5 py-1 text-[10px] font-semibold text-teal">
            T {thickness}&quot;
          </span>
        </div>
      )}
    </div>
  );
});

export default SignScene;
