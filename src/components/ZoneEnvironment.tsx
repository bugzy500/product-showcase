"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Zone } from "@/src/lib/content";
import { allProducts } from "@/src/lib/content";
import { liveState } from "@/src/lib/store";
import {
  BACKDROP_X,
  PLATFORM_X,
  productSlots,
  zoneActivity,
  zoneCenterZ,
  zoneSide,
  zoneVisible,
} from "@/src/lib/timeline";
import { glowTexture, ledTextTexture } from "@/src/lib/textures";
import { ProductDisplay } from "./ProductDisplay";
import { ZoneEffect } from "./effects";
import { EnvironmentProps } from "./props";

const platformMat = new THREE.MeshStandardMaterial({ color: "#d6d8dc", roughness: 0.55, metalness: 0.1 });

export function ZoneEnvironment({ zone, index }: { zone: Zone; index: number }) {
  const side = zoneSide(index);
  const zc = zoneCenterZ(index);
  const slots = useMemo(() => productSlots(index), [index]);
  const products = useMemo(
    () => allProducts.filter((p) => p.zoneIndex === index),
    [index]
  );

  const group = useRef<THREE.Group>(null);
  const titleMesh = useRef<THREE.Mesh>(null);
  const underglow = useRef<THREE.Mesh>(null);
  const wallGlow = useRef<THREE.Mesh>(null);
  const cove = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const fillLight = useRef<THREE.PointLight>(null);

  const titleTex = useMemo(
    () =>
      ledTextTexture(zone.name, {
        width: 1536,
        height: 384,
        sub: `${zone.chapter} · ${zone.tagline}`,
        glow: zone.accent,
        font: "600 88px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }),
    [zone.name, zone.chapter, zone.tagline, zone.accent]
  );
  const glowTex = useMemo(() => glowTexture(zone.accent), [zone.accent]);

  const depth = slots.length * (slots.length > 4 ? 2.9 : 3.3) + 3.2;

  useFrame(() => {
    const p = liveState.smoothProgress;
    if (group.current) group.current.visible = zoneVisible(p, index);
    if (!group.current?.visible) return;
    const a = zoneActivity(p, index);
    if (titleMesh.current)
      (titleMesh.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + a * 0.75;
    if (underglow.current)
      (underglow.current.material as THREE.MeshBasicMaterial).opacity = a * 0.16;
    if (wallGlow.current)
      (wallGlow.current.material as THREE.MeshBasicMaterial).opacity = a * 0.22;
    if (cove.current)
      (cove.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + a * 0.75;
    if (light.current) light.current.intensity = a * 1.9;
    if (fillLight.current) fillLight.current.intensity = a * 0.8;
  });

  return (
    <group ref={group}>
      {/* display platform */}
      <mesh position={[side * PLATFORM_X, 0.07, zc]} material={platformMat}>
        <boxGeometry args={[6.2, 0.14, depth]} />
      </mesh>
      {/* LED underglow */}
      <mesh ref={underglow} position={[side * PLATFORM_X, 0.012, zc]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.4, depth + 1.2]} />
        <meshBasicMaterial color={zone.accent} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>

      {/* accent wash on the backdrop wall */}
      <mesh
        ref={wallGlow}
        position={[side * (BACKDROP_X - 0.15), 2.6, zc]}
        rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
      >
        <planeGeometry args={[depth + 10, 7]} />
        <meshBasicMaterial
          map={glowTex}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* zone LED title panel */}
      <mesh
        ref={titleMesh}
        position={[side * BACKDROP_X, 3.2, zc]}
        rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
      >
        <planeGeometry args={[9, 2.25]} />
        <meshBasicMaterial map={titleTex} transparent opacity={0.25} toneMapped={false} />
      </mesh>

      {/* cove light strip along the backdrop */}
      <mesh ref={cove} position={[side * (BACKDROP_X - 0.1), 4.6, zc]}>
        <boxGeometry args={[0.04, 0.05, depth + 4]} />
        <meshBasicMaterial color={zone.accent} transparent opacity={0.25} toneMapped={false} />
      </mesh>

      {/* zone accent lighting */}
      <pointLight
        ref={light}
        position={[side * (PLATFORM_X - 0.8), 4.6, zc]}
        color={zone.accent}
        distance={16}
        intensity={0}
      />
      <pointLight
        ref={fillLight}
        position={[side * 3.5, 4.4, zc + 3]}
        color="#fff1dd"
        distance={14}
        intensity={0}
      />

      {/* environment dressing + animated effect */}
      <EnvironmentProps env={zone.environment} side={side} zc={zc} accent={zone.accent} depth={depth} />
      <ZoneEffect effect={zone.effect} zoneIndex={index} accent={zone.accent} side={side} zc={zc} />

      {/* products */}
      {products.map((p, i) => (
        <ProductDisplay key={p.id} product={p} slot={slots[i]} />
      ))}
    </group>
  );
}
