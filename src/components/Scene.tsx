"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { content } from "@/src/lib/content";
import { Hall } from "./Hall";
import { ZoneEnvironment } from "./ZoneEnvironment";
import { FinaleScene } from "./FinaleScene";
import { CameraRig } from "./CameraRig";

export function Scene() {
  return (
    <>
      <color attach="background" args={["#07080c"]} />
      <fog attach="fog" args={["#07080c", 24, 92]} />

      <ambientLight intensity={0.4} color="#c9cede" />
      <directionalLight position={[6, 12, 8]} intensity={0.65} color="#ffe6c4" />

      {/* procedural studio reflections — no network HDRs required */}
      <Environment resolution={64} frames={1}>
        <Lightformer
          intensity={3}
          position={[0, 6, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[12, 12, 1]}
          color="#fff2e0"
        />
        <Lightformer intensity={1.4} position={[-8, 3, -4]} rotation={[0, Math.PI / 2, 0]} scale={[8, 4, 1]} color="#bcd9f5" />
        <Lightformer intensity={1.2} position={[8, 3, 4]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 4, 1]} color="#ffd9b0" />
      </Environment>

      <Hall />
      {content.zones.map((zone, i) => (
        <ZoneEnvironment key={zone.id} zone={zone} index={i} />
      ))}
      <FinaleScene />
      <CameraRig />

      {/* cinematic grade: soft bloom on LED/emissive surfaces */}
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.985} luminanceSmoothing={0.08} />
        <Vignette eskil={false} offset={0.22} darkness={0.62} />
      </EffectComposer>
    </>
  );
}
