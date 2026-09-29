"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, RoundedBox } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import type { Traits } from "@/lib/traits";
import type { PreviewKind } from "@/lib/catalog";

interface SignSceneProps {
  widthFt: number;
  heightFt: number;
  preview: PreviewKind;
  traits: Traits;
  text?: string;
}

function SignMesh({ widthFt, heightFt, preview, traits, text = "DW" }: SignSceneProps) {
  const w = Math.max(0.5, widthFt);
  const h = Math.max(0.3, heightFt);
  const depth = traits.frameThickness || 0.12;
  const frameColor = traits.metal === "aluminum" ? "#c0c8d0" : traits.metal === "powder" ? "#2a3a4a" : "#3a3a3a";
  const faceColor = preview === "neon" ? "#1ecac9" : "#f5f5f0";
  const glow = traits.light !== "none";

  const letters = useMemo(() => {
    if (preview !== "acrylic" && preview !== "neon") return null;
    const chars = (text || "DW").slice(0, 6).split("");
    const letterW = w / (chars.length + 0.5);
    return chars.map((ch, i) => ({
      ch,
      x: -w / 2 + letterW * (i + 0.75),
      size: Math.min(letterW * 0.7, h * 0.55),
    }));
  }, [preview, text, w, h]);

  return (
    <group>
      {traits.mount === "pole" || traits.mount === "rooftop" ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -h / 2 - 0.8, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0a1a28" />
        </mesh>
      ) : (
        <mesh position={[0, 0, -depth - 0.05]} receiveShadow>
          <planeGeometry args={[w * 3, h * 3]} />
          <meshStandardMaterial color="#0a1a28" />
        </mesh>
      )}

      {(traits.mount === "pole" || traits.mount === "rooftop") && (
        <mesh position={[0, -h / 2 - 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.9, 12]} />
          <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
        </mesh>
      )}

      {traits.mount === "raceway" && (
        <RoundedBox args={[w * 1.05, 0.12, 0.15]} position={[0, -h / 2 - 0.08, 0]} radius={0.02} castShadow>
          <meshStandardMaterial color={frameColor} metalness={0.4} roughness={0.5} />
        </RoundedBox>
      )}

      {(preview === "panaflex" || preview === "lightbox") && (
        <group>
          <RoundedBox args={[w, h, depth]} radius={0.02} castShadow receiveShadow>
            <meshStandardMaterial color={frameColor} metalness={0.35} roughness={0.45} />
          </RoundedBox>
          <mesh position={[0, 0, depth / 2 + 0.005]} castShadow>
            <planeGeometry args={[w * 0.96, h * 0.92]} />
            <meshStandardMaterial
              color={faceColor}
              emissive={glow ? (traits.light === "rgb" ? "#1ecac9" : "#f3b33c") : "#000"}
              emissiveIntensity={glow ? 0.6 : 0}
              roughness={0.7}
            />
          </mesh>
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

      {letters && preview === "acrylic" && (
        <group>
          {letters.map((l, i) => (
            <group key={i} position={[l.x, 0, 0]}>
              <RoundedBox
                args={[l.size * 0.7, l.size, traits.light === "halo" ? 0.08 : 0.12]}
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
                  <meshStandardMaterial color="#f3b33c" emissive="#f3b33c" emissiveIntensity={1.2} transparent opacity={0.7} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      )}

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
            <RoundedBox key={i} args={[l.size * 0.55, l.size * 0.9, 0.06]} position={[l.x, 0, 0.02]} radius={0.02}>
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
          intensity={2.5}
          color={traits.light === "rgb" ? "#1ecac9" : "#f3b33c"}
          distance={8}
        />
      )}
    </group>
  );
}

export default function SignScene(props: SignSceneProps) {
  const { widthFt, heightFt } = props;
  const maxDim = Math.max(widthFt, heightFt, 1);
  const camDist = maxDim * 1.8 + 1.5;

  return (
    <div className="w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-[#011424] border border-line">
      <Canvas shadows camera={{ position: [camDist * 0.6, camDist * 0.25, camDist], fov: 40 }} gl={{ antialias: true }}>
        <color attach="background" args={["#011424"]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={null}>
          <SignMesh {...props} />
          <ContactShadows position={[0, -heightFt / 2 - 0.85, 0]} opacity={0.4} scale={12} blur={2} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls makeDefault minDistance={1} maxDistance={30} target={[0, 0, 0]} enablePan={false} />
      </Canvas>
    </div>
  );
}
