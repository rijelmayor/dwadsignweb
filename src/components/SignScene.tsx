"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Line, Text, useTexture } from "@react-three/drei";
import { Suspense, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import type { Traits } from "@/lib/traits";
import type { PreviewKind } from "@/lib/catalog";

export interface SignSceneHandle {
  captureFront: () => string | null;
  captureSide: () => string | null;
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
      {/* Large black label */}
      <Text
        position={[mid[0], mid[1], mid[2] + 0.04]}
        fontSize={fontSize}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.028}
        outlineColor="#ffffff"
      >
        {label}
      </Text>
    </group>
  );
}

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

function PanaflexMesh({
  widthFt,
  heightFt,
  traits,
  logoUrl,
  showDimensions = true,
  faceLabel,
}: SignSceneProps) {
  const w = Math.max(0.5, widthFt);
  const h = Math.max(0.3, heightFt);
  const depth = Math.max(0.04, traits.frameThickness || 0.12);
  const withLight = traits.light !== "none";
  const faceColor =
    faceLabel === "APC"
      ? "#d8dde2"
      : faceLabel === "Metal Sheet"
        ? "#aeb7bf"
        : faceLabel === "Acrylic"
          ? "#f5fbff"
          : "#ffffff";

  // Scale dim offset & font with sign size so labels stay readable
  const dimOff = Math.max(0.55, Math.min(w, h) * 0.18);
  const dimFont = Math.max(0.28, Math.min(w, h) * 0.1);

  return (
    <group>
      <mesh position={[0, 0, -depth - 0.12]}>
        <planeGeometry args={[Math.max(w, 2) * 4, Math.max(h, 2) * 4]} />
        <meshBasicMaterial color="#f0f3f6" />
      </mesh>

      <RoundedBox args={[w, h, depth]} radius={0.008} castShadow receiveShadow>
        <meshStandardMaterial
          color={faceColor}
          roughness={0.7}
          metalness={faceLabel === "Metal Sheet" ? 0.4 : 0.02}
        />
      </RoundedBox>

      {logoUrl ? (
        <Suspense fallback={null}>
          <LogoFace w={w} h={h} depth={depth} logoUrl={logoUrl} />
        </Suspense>
      ) : (
        <Text
          position={[0, 0, depth / 2 + 0.012]}
          fontSize={Math.min(w * 0.14, h * 0.28)}
          maxWidth={w * 0.9}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          color="#222222"
          outlineWidth={0.008}
          outlineColor="#ffffff"
        >
          Your Logo
        </Text>
      )}

      {withLight && <BulbIcon x={w / 2 + dimOff * 0.7} y={h / 2 + 0.2} z={depth / 2 + 0.05} />}

      {showDimensions && (
        <group>
          {/* Width bottom */}
          <DimLine
            start={[-w / 2, -h / 2, depth / 2]}
            end={[w / 2, -h / 2, depth / 2]}
            offset={[0, -dimOff, 0.08]}
            label={`W ${fmtFt(w)}`}
            color="#000000"
            fontSize={dimFont}
          />
          {/* Width top */}
          <DimLine
            start={[-w / 2, h / 2, depth / 2]}
            end={[w / 2, h / 2, depth / 2]}
            offset={[0, dimOff, 0.08]}
            label={`W ${fmtFt(w)}`}
            color="#000000"
            fontSize={dimFont}
          />
          {/* Height left */}
          <DimLine
            start={[-w / 2, -h / 2, depth / 2]}
            end={[-w / 2, h / 2, depth / 2]}
            offset={[-dimOff, 0, 0.08]}
            label={`H ${fmtFt(h)}`}
            color="#000000"
            fontSize={dimFont}
          />
          {/* Height right */}
          <DimLine
            start={[w / 2, -h / 2, depth / 2]}
            end={[w / 2, h / 2, depth / 2]}
            offset={[dimOff, 0, 0.08]}
            label={`H ${fmtFt(h)}`}
            color="#000000"
            fontSize={dimFont}
          />
          {/* Thickness */}
          <DimLine
            start={[w / 2, -h / 2, -depth / 2]}
            end={[w / 2, -h / 2, depth / 2]}
            offset={[dimOff * 0.65, -dimOff * 0.45, 0]}
            label={`T ${Math.round(depth * 12 * 10) / 10}"`}
            color="#000000"
            fontSize={dimFont * 0.9}
          />
        </group>
      )}
    </group>
  );
}

function CaptureController({
  onReady,
}: {
  onReady: (api: { captureFront: () => string | null; captureSide: () => string | null }) => void;
}) {
  const { gl, scene, camera } = useThree();
  const savedPos = useRef(new THREE.Vector3());

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
          const dist = Math.max(camera.position.length(), 3);
          camera.position.set(dist * 1.15, dist * 0.12, 0);
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
  // Pull camera back enough so big dim labels fit in frame
  const camDist = maxDim * 2.6 + 2.2;
  const apiRef = useRef<{ captureFront: () => string | null; captureSide: () => string | null } | null>(null);

  useImperativeHandle(ref, () => ({
    captureFront: () => apiRef.current?.captureFront() ?? null,
    captureSide: () => apiRef.current?.captureSide() ?? null,
    capturePng: () => apiRef.current?.captureFront() ?? null,
  }));

  const thickness = Math.round((props.traits.frameThickness || 0.12) * 12 * 10) / 10;
  const withLight = props.traits.light !== "none";

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
          <PanaflexMesh {...props} />
        </Suspense>
        <CaptureController onReady={(api) => { apiRef.current = api; }} />
        <OrbitControls makeDefault minDistance={1.5} maxDistance={50} target={[0, 0, 0]} enablePan={false} />
      </Canvas>

      <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
        <span className="rounded-full bg-white border border-gray-300 px-2.5 py-1 text-[11px] font-bold text-black shadow-sm">
          {props.faceLabel || "Face"}
        </span>
        {props.printingLabel && (
          <span className="rounded-full bg-white border border-gray-300 px-2.5 py-1 text-[11px] font-bold text-black shadow-sm">
            {props.printingLabel}
          </span>
        )}
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
          <span className="rounded bg-white border-2 border-black px-3 py-1.5 text-xs font-bold text-black shadow">
            W {fmtFt(widthFt)}
          </span>
          <span className="rounded bg-white border-2 border-black px-3 py-1.5 text-xs font-bold text-black shadow">
            H {fmtFt(heightFt)}
          </span>
          <span className="rounded bg-white border-2 border-black px-3 py-1.5 text-xs font-bold text-black shadow">
            T {thickness}&quot;
          </span>
        </div>
      )}
    </div>
  );
});

export default SignScene;
