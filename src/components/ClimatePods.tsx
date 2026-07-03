"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, RoundedBox } from "@react-three/drei";
import type { Zone } from "@/src/lib/content";
import { liveState, useExperience } from "@/src/lib/store";
import {
  PLATFORM_X,
  POD_SPACING,
  productSlots,
  zoneActivity,
  zoneCenterZ,
  zoneSide,
  type Slot,
} from "@/src/lib/timeline";
import {
  infoScreenTexture,
  labelTexture,
  ledTextTexture,
  podNumberTexture,
  blobShadowTexture,
} from "@/src/lib/textures";
import { AcWallUnit, ProductModel } from "./models";
import { Sofa, CoffeeTable, Rug, Plant } from "./props";

const charcoal = new THREE.MeshStandardMaterial({ color: "#1b1e26", roughness: 0.7, metalness: 0.25 });
const mountMat = new THREE.MeshStandardMaterial({ color: "#101218", roughness: 0.6 });
// Wall bracket behind the AC. depthWrite is disabled (and it draws first via a
// negative renderOrder) so the spinning AC always paints on top of it and never
// clips behind the bracket while rotating in the focus preview.
const acPlateMat = new THREE.MeshStandardMaterial({ color: "#101218", roughness: 0.6 });
acPlateMat.depthWrite = false;
const standMat = new THREE.MeshStandardMaterial({ color: "#2a2d35", metalness: 0.8, roughness: 0.35 });
const lampMat = new THREE.MeshStandardMaterial({ color: "#e8e9ec", roughness: 0.5, metalness: 0.2 });

let _shadow: THREE.Texture | null = null;
const shadowTex = () => (_shadow ??= blobShadowTexture());

/* ---------------- individual clickable AC ---------------- */

function PodAc({
  product,
  slot,
  zoneIndex,
  j,
  accent,
}: {
  product: Zone["products"][number];
  slot: Slot;
  zoneIndex: number;
  j: number;
  accent: string;
}) {
  const setFocus = useExperience((s) => s.setFocus);
  const [hovered, setHovered] = useState(false);
  const spin = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const wall = slot.mount === "wall";

  const labelTex = useMemo(
    () => labelTexture(product.shortName, accent),
    [product.shortName, accent]
  );

  const focusedNow = () => {
    const f = useExperience.getState().focus;
    return !!f && f.zone === zoneIndex && f.product === j;
  };

  useFrame((_, dt) => {
    const focused = focusedNow();
    if (spin.current) {
      if (focused) {
        liveState.spin += (liveState.spinVelocity + 0.2) * dt;
        liveState.spinVelocity *= Math.pow(0.02, dt);
        spin.current.rotation.y = slot.rotationY + liveState.spin;
      } else {
        spin.current.rotation.y +=
          (slot.rotationY - spin.current.rotation.y) * Math.min(1, dt * 4);
      }
    }
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      const target = focused ? 0.9 : hovered ? 0.7 : 0.28;
      m.opacity += (target - m.opacity) * Math.min(1, dt * 8);
    }
  });

  const click = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    liveState.spin = 0;
    liveState.spinVelocity = 0;
    setFocus({ zone: zoneIndex, product: j });
  };
  const over = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group position={slot.position}>
      {wall ? (
        <>
          {/* wall mounting plate — drawn first and non-depth-writing so the
              spinning AC in front never clips behind it during rotation */}
          <mesh position={[slot.rotationY > 0 ? -0.14 : 0.14, 0, 0]} material={acPlateMat} renderOrder={-1}>
            <boxGeometry args={[0.28, 0.5, 1.2]} />
          </mesh>
          <group ref={spin} rotation={[0, slot.rotationY, 0]} onClick={click} onPointerOver={over} onPointerOut={out}>
            <AcWallUnit accent={accent} />
          </group>
        </>
      ) : (
        <>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.6, 2.6]} />
            <meshBasicMaterial map={shadowTex()} transparent depthWrite={false} />
          </mesh>
          <mesh ref={ring} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.0, 1.08, 48]} />
            <meshBasicMaterial color={accent} transparent opacity={0.28} toneMapped={false} />
          </mesh>
          <group ref={spin} rotation={[0, slot.rotationY, 0]} onClick={click} onPointerOver={over} onPointerOut={out}>
            <ProductModel model={product.model} accent={accent} />
          </group>
        </>
      )}

      {wall && (
        <mesh
          ref={ring}
          position={[slot.rotationY > 0 ? 0.16 : -0.16, 0, 0]}
          rotation={[0, slot.rotationY, 0]}
          scale={[1.34, 0.92, 1]}
        >
          {/* Gentle wide-oval halo (scaled circle). Wide enough that its hole clears the
              name-label's corners below, short enough vertically to stay under the pod header above. */}
          <ringGeometry args={[0.94, 1.02, 64]} />
          <meshBasicMaterial color={accent} transparent opacity={0.28} toneMapped={false} />
        </mesh>
      )}

      <Billboard position={[0, wall ? 0.45 : 2.35, 0]}>
        <mesh>
          <planeGeometry args={[1.5, 0.375]} />
          <meshBasicMaterial map={labelTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

/* ---------------- pod dressing pieces ---------------- */

function FeatureWall({ side, zc, height = 4.6 }: { side: number; zc: number; height?: number }) {
  return (
    <mesh position={[side * 10.4, height / 2, zc]} material={charcoal}>
      <boxGeometry args={[0.25, height, POD_SPACING - 0.4]} />
    </mesh>
  );
}

function PodSign({
  side,
  zc,
  pod,
  theme,
  accent,
  y = 3.9,
}: {
  side: number;
  zc: number;
  pod: string;
  theme: string;
  accent: string;
  y?: number;
}) {
  const tex = useMemo(
    () => ledTextTexture(pod, { width: 1024, height: 256, sub: theme, glow: accent, font: "600 62px 'Segoe UI', Arial, sans-serif" }),
    [pod, theme, accent]
  );
  return (
    <mesh position={[side * 10.22, y, zc]} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
      <planeGeometry args={[4.1, 1.02]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

function Screen({
  position,
  rotationY,
  tex,
  w = 1.0,
  h = 0.75,
}: {
  position: [number, number, number];
  rotationY: number;
  tex: THREE.Texture;
  w?: number;
  h?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* stand */}
      <mesh position={[0, -h / 2 - 0.42, 0]} material={standMat}>
        <cylinderGeometry args={[0.02, 0.02, 0.84, 10]} />
      </mesh>
      <mesh position={[0, -h - 0.4, 0]} material={standMat}>
        <cylinderGeometry args={[0.2, 0.24, 0.03, 20]} />
      </mesh>
      <RoundedBox args={[w + 0.06, h + 0.06, 0.04]} radius={0.02} material={mountMat} />
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function FloorLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} material={standMat}>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 20]} />
      </mesh>
      <mesh position={[0, 0.85, 0]} material={standMat}>
        <cylinderGeometry args={[0.015, 0.015, 1.7, 10]} />
      </mesh>
      <mesh position={[0, 1.72, 0]} material={lampMat}>
        <cylinderGeometry args={[0.16, 0.22, 0.26, 20, 1, true]} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} distance={4.5} intensity={1.4} color="#ffdca8" />
    </group>
  );
}

/* ---------------- the pods ---------------- */

export function ClimatePods({ zone, index }: { zone: Zone; index: number }) {
  const side = zoneSide(index);
  const zc = zoneCenterZ(index);
  const slots = useMemo(() => productSlots(index), [index]);
  const inwardRot = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  const podFloorMats = useRef<THREE.MeshStandardMaterial[]>([]);

  // pod floor accent glow ramps with zone activity
  useFrame(() => {
    const a = zoneActivity(liveState.smoothProgress, index);
    podFloorMats.current.forEach((m) => m && (m.emissiveIntensity = 0.08 + a * 0.28));
  });

  // dashboard / comparison screen textures
  const naturalTex = useMemo(
    () => infoScreenTexture("Natural Wind", "Gentle · Soft · Even", "#5ec8f2"),
    []
  );
  const conventionalTex = useMemo(
    () => infoScreenTexture("Conventional AC", "Strong · Direct · Harsh", "#f2695e", { harsh: true }),
    []
  );
  const dashTex = useMemo(
    () => infoScreenTexture("AI Energy Dashboard", "Real-time optimisation", "#5ef2c8", { stat: "32% saved" }),
    []
  );
  const meterTex = useMemo(
    () => infoScreenTexture("Power", "0.68 kW in use", "#5ec8f2", { stat: "0.68kW" }),
    []
  );

  const bx = side * PLATFORM_X;

  return (
    <group>
      {/* central walkway runner */}
      <mesh position={[side * 3.6, 0.02, zc]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, POD_SPACING * 4]} />
        <meshBasicMaterial color={zone.accent} transparent opacity={0.12} toneMapped={false} depthWrite={false} />
      </mesh>

      {slots.map((slot, j) => {
        const product = zone.products[j];
        const podZ = slot.position.z;
        const wall = slot.mount === "wall";
        const isArena = product.pod === "Grand Cooling Arena";
        const isLiving = product.pod === "Living Room Comfort Zone";
        const isStudio = product.pod === "AI Energy Studio";
        const isLab = product.pod === "Natural Wind Lab";
        const numTex = podNumberTexture(j + 1, zone.accent);

        return (
          <group key={product.id}>
            {/* pod floor platform */}
            <mesh position={[bx, 0.07, podZ]}>
              <boxGeometry args={[6.2, 0.14, POD_SPACING - 0.6]} />
              <meshStandardMaterial
                ref={(m) => {
                  if (m) podFloorMats.current[j] = m;
                }}
                color="#d9dbe0"
                roughness={0.5}
                metalness={0.12}
                emissive={new THREE.Color(zone.accent)}
                emissiveIntensity={0.12}
              />
            </mesh>

            {/* pod number on the floor */}
            <mesh position={[side * (PLATFORM_X - 2.4), 0.085, podZ + 1.9]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.9, 0.9]} />
              <meshBasicMaterial map={numTex} transparent depthWrite={false} toneMapped={false} />
            </mesh>

            {/* feature wall + sign */}
            <FeatureWall side={side} zc={podZ} height={isArena ? 2.8 : 4.6} />
            <PodSign
              side={side}
              zc={podZ}
              pod={product.pod ?? ""}
              theme={product.podTheme ?? ""}
              accent={zone.accent}
              y={isArena ? 2.4 : 3.9}
            />

            {/* divider fin between pods */}
            {j < slots.length - 1 && (
              <mesh position={[side * (PLATFORM_X + 1.4), 1.5, podZ - POD_SPACING / 2]}>
                <boxGeometry args={[3.6, 3, 0.05]} />
                <meshBasicMaterial color={zone.accent} transparent opacity={0.16} toneMapped={false} />
              </mesh>
            )}

            {/* the AC */}
            <PodAc product={product} slot={slot} zoneIndex={index} j={j} accent={zone.accent} />

            {/* per-pod dressing */}
            {isLab && (
              <>
                <Screen position={[bx - side * 1.4, 1.35, podZ + 1.1]} rotationY={inwardRot} tex={naturalTex} />
                <Screen position={[bx - side * 1.4, 1.35, podZ - 1.1]} rotationY={inwardRot} tex={conventionalTex} />
              </>
            )}

            {isLiving && (
              <>
                <Sofa position={[bx - side * 0.4, 0.14, podZ]} rotationY={inwardRot} dark />
                <CoffeeTable position={[bx - side * 2.4, 0.14, podZ]} />
                <Rug position={[bx - side * 1.4, 0.14, podZ]} color="#3a3f49" />
                <Plant position={[bx - side * 0.2, 0.14, podZ + 1.9]} />
                <FloorLamp position={[bx - side * 0.2, 0.14, podZ - 1.9]} />
              </>
            )}

            {isStudio && (
              <>
                <Screen position={[bx - side * 1.2, 1.4, podZ + 0.2]} rotationY={inwardRot} tex={dashTex} w={1.5} h={0.95} />
                <Screen position={[bx - side * 2.6, 1.15, podZ - 1.3]} rotationY={inwardRot} tex={meterTex} w={0.7} h={0.5} />
              </>
            )}

            {isArena && (
              <>
                <Sofa position={[bx - side * 1.2, 0.14, podZ + 1.9]} rotationY={side > 0 ? Math.PI * 0.9 : Math.PI * 0.1} dark />
                <Rug position={[bx - side * 0.4, 0.14, podZ]} color="#3a3f49" />
                <Plant position={[bx - side * 2.6, 0.14, podZ - 1.9]} />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
