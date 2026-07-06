"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { timeline } from "@/src/lib/content";
import { liveState } from "@/src/lib/store";
import {
  MILESTONE_COUNT,
  TL_HALF_WIDTH,
  TL_LINE_Y,
  TL_OVERVIEW_Z,
  isHero,
  milestoneActivity,
  milestoneNodeX,
  milestoneState,
  timelineActivity,
} from "@/src/lib/timeline";
import { milestoneLabelTexture } from "@/src/lib/textures";

function MilestoneNode({ index }: { index: number }) {
  const m = timeline!.milestones[index];
  const x = milestoneNodeX(index);
  const hero = isHero(index);

  const ring = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const labelMat = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const group = useRef<THREE.Group>(null);

  const labelTex = useMemo(
    () => milestoneLabelTexture(m.dateLabel, m.title, m.accent),
    [m.dateLabel, m.title, m.accent]
  );
  const accent = useMemo(() => new THREE.Color(m.accent), [m.accent]);

  useFrame(({ clock }) => {
    const p = liveState.smoothProgress;
    const state = milestoneState(p, index);
    const act = milestoneActivity(p, index);
    const t = clock.elapsedTime;

    // state → target intensity: future dim, completed soft glow, active bright
    const base = state === "future" ? 0.18 : state === "completed" ? 0.5 : 1;
    const pulse = state === "active" ? 0.8 + Math.sin(t * 2.4) * 0.2 : 1;
    const intensity = base * pulse * (hero ? 1.25 : 1);

    if (coreMat.current) coreMat.current.opacity = 0.35 + intensity * 0.65;
    if (halo.current) {
      const hm = halo.current.material as THREE.MeshBasicMaterial;
      hm.opacity = (state === "future" ? 0.05 : 0.14) + act * 0.22;
      const s =
        (hero ? 1.5 : 1) *
        (1 + act * 0.4 + (state === "active" ? Math.sin(t * 2.4) * 0.06 : 0));
      halo.current.scale.setScalar(s);
    }
    if (ring.current) {
      ring.current.rotation.z = t * (hero ? 0.5 : 0.3);
      const rs = (hero ? 1.35 : 1) * (state === "active" ? 1 + act * 0.15 : 1);
      ring.current.scale.setScalar(rs);
    }
    if (labelMat.current)
      labelMat.current.opacity =
        0.25 + Math.max(act, state === "completed" ? 0.35 : 0.1) * 0.75;
    if (light.current) light.current.intensity = intensity * (hero ? 3.4 : 2.2);
    if (group.current) {
      const reveal = timelineActivity(p);
      group.current.visible = reveal > 0.001;
      group.current.position.y = TL_LINE_Y + (1 - reveal) * -1.2;
    }
  });

  return (
    <group ref={group} position={[x, TL_LINE_Y, TL_OVERVIEW_Z]}>
      {/* glowing core */}
      <mesh>
        <sphereGeometry args={[hero ? 0.5 : 0.34, 24, 24]} />
        <meshBasicMaterial ref={coreMat} color={accent} transparent opacity={0.6} toneMapped={false} />
      </mesh>
      {/* halo */}
      <mesh ref={halo}>
        <sphereGeometry args={[hero ? 0.9 : 0.62, 20, 20]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.14}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* orbiting ring */}
      <mesh ref={ring} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[hero ? 0.95 : 0.66, 0.02, 8, 48]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      {/* floating date/title label above the node */}
      <mesh position={[0, hero ? 2.0 : 1.6, 0]}>
        <planeGeometry args={[hero ? 3.6 : 3.0, hero ? 1.44 : 1.2]} />
        <meshBasicMaterial ref={labelMat} map={labelTex} transparent opacity={0.25} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight ref={light} color={accent} distance={hero ? 22 : 15} intensity={0} />
    </group>
  );
}

export function TimelineScene() {
  const group = useRef<THREE.Group>(null);
  const lineMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!timeline?.enabled) return;
    const p = liveState.smoothProgress;
    const reveal = timelineActivity(p);
    if (group.current) {
      group.current.visible = reveal > 0.001;
      if (!group.current.visible) return;
    }
    if (lineMat.current) lineMat.current.opacity = reveal * 0.9;
    if (glowMat.current) glowMat.current.opacity = reveal * 0.35;
  });

  if (!timeline?.enabled) return null;

  return (
    <group ref={group} visible={false}>
      {/* the illuminated spine */}
      <mesh position={[0, TL_LINE_Y, TL_OVERVIEW_Z]}>
        <boxGeometry args={[TL_HALF_WIDTH * 2 + 2, 0.05, 0.05]} />
        <meshBasicMaterial ref={lineMat} color="#ff6900" transparent opacity={0} toneMapped={false} />
      </mesh>
      {/* soft glow slab under the line */}
      <mesh position={[0, TL_LINE_Y, TL_OVERVIEW_Z - 0.02]}>
        <planeGeometry args={[TL_HALF_WIDTH * 2 + 4, 1.1]} />
        <meshBasicMaterial
          ref={glowMat}
          color="#ff6900"
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* reflective floor plane far below to catch node glow */}
      <mesh position={[0, 0.02, TL_OVERVIEW_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TL_HALF_WIDTH * 2 + 20, 40]} />
        <meshStandardMaterial color="#0c0e14" roughness={0.25} metalness={0.6} />
      </mesh>
      {Array.from({ length: MILESTONE_COUNT }, (_, i) => (
        <MilestoneNode key={i} index={i} />
      ))}
    </group>
  );
}
