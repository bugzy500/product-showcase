"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { liveState } from "@/src/lib/store";
import { localT, zoneSegment, zoneActivity, productSlots, PLATFORM_X } from "@/src/lib/timeline";
import { particleTexture } from "@/src/lib/textures";

interface EffectProps {
  zoneIndex: number;
  accent: string;
  side: number;
  zc: number;
}

function usePoints(count: number, color: string, size: number, opacity = 0.8) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    // Positions are rewritten every frame in useFrame, but three only computes
    // the boundingSphere once — from the initial all-zero buffer, giving a
    // radius-0 sphere at the world origin. Since the zones sit far down -z, that
    // origin sphere is off-screen and three frustum-culls the entire cloud, so
    // nothing renders. Pin a large sphere so the points are never wrongly culled
    // (distant zones are already hidden by the zone-level visibility gate).
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e4);
    return g;
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color,
        size,
        map: particleTexture(),
        alphaMap: particleTexture(),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [color, size, opacity]
  );
  return { geometry, material };
}

const zoneT = (zoneIndex: number) => localT(liveState.smoothProgress, zoneSegment(zoneIndex));
const activity = (zoneIndex: number) => zoneActivity(liveState.smoothProgress, zoneIndex);

/* ---------------------------------------------------------------- */
/* Zone 1 — Climate: natural wind streams                            */
/* ---------------------------------------------------------------- */

function AirflowEffect({ zoneIndex, accent, side }: EffectProps) {
  const N = 260;
  const { geometry, material } = usePoints(N, accent, 0.09, 0.65);
  // Bind each particle to a real product slot so a jet of air streams out of
  // every AC pod. Fixed lanes only covered the middle of the zone, leaving the
  // end pods with no airflow; slot-based origins scale to any pod count.
  const slots = useMemo(() => productSlots(zoneIndex), [zoneIndex]);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        t: (i / N) % 1,
        slot: i % slots.length,
        zoff: (Math.random() - 0.5) * 3.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.1 + Math.random() * 0.12,
      })),
    [slots.length]
  );
  useFrame(({ clock }) => {
    const a = activity(zoneIndex);
    material.opacity = 0.65 * a;
    if (a <= 0.001) return;
    const pos = geometry.attributes.position.array as Float32Array;
    const time = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      const base = slots[s.slot].position;
      const t = (s.t + time * s.speed) % 1;
      // Keep the original plume trajectory (streams from the platform edge out
      // toward the walkway, where it reads clearly), but anchor each lane's z to
      // a real pod so every AC — including the end pods — gets a stream.
      const x = side * (PLATFORM_X - 0.5) - side * t * 6.2;
      const y = 1.6 + Math.sin(t * Math.PI * 2 + s.phase) * 0.35 - t * 0.5;
      const z = base.z + s.zoff + Math.sin(t * 9 + s.phase) * 0.5;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    geometry.attributes.position.needsUpdate = true;
  });
  return <points geometry={geometry} material={material} />;
}

/* ---------------------------------------------------------------- */
/* Zone 2 — Laundry: suds swirl + steam                              */
/* ---------------------------------------------------------------- */

function LaundryEffect({ zoneIndex, accent, side, zc }: EffectProps) {
  const N = 160;
  const { geometry, material } = usePoints(N, accent, 0.07, 0.55);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        r: 0.5 + Math.random() * 1.2,
        h: Math.random(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6,
        steam: Math.random() > 0.6,
      })),
    []
  );
  useFrame(({ clock }) => {
    const a = activity(zoneIndex);
    material.opacity = 0.55 * a;
    if (a <= 0.001) return;
    const pos = geometry.attributes.position.array as Float32Array;
    const time = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      if (s.steam) {
        const t = (s.h + time * 0.12) % 1;
        pos[i * 3] = side * PLATFORM_X + Math.sin(s.phase + time) * 0.3;
        pos[i * 3 + 1] = 1.0 + t * 1.6;
        pos[i * 3 + 2] = zc - 1 + Math.cos(s.phase) * 0.4;
      } else {
        const ang = s.phase + time * s.speed;
        pos[i * 3] = side * PLATFORM_X + Math.cos(ang) * s.r;
        pos[i * 3 + 1] = 0.5 + s.h * 1.1 + Math.sin(time * 1.4 + s.phase) * 0.1;
        pos[i * 3 + 2] = zc + 2.2 + Math.sin(ang) * s.r * 0.5;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  });
  return <points geometry={geometry} material={material} />;
}

/* ---------------------------------------------------------------- */
/* Zone 3 — Kitchen: cold mist                                       */
/* ---------------------------------------------------------------- */

function KitchenEffect({ zoneIndex, side, zc }: EffectProps) {
  const N = 140;
  const { geometry, material } = usePoints(N, "#bfe6ff", 0.1, 0.4);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        slot: i % 4,
        t: Math.random(),
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );
  useFrame(({ clock }) => {
    const a = activity(zoneIndex);
    material.opacity = 0.4 * a;
    if (a <= 0.001) return;
    const pos = geometry.attributes.position.array as Float32Array;
    const time = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      const t = (s.t + time * 0.05) % 1;
      const slotZ = zc + (1.5 - s.slot) * 3.3;
      pos[i * 3] = side * PLATFORM_X + Math.sin(s.phase + time * 0.4) * 0.5 - side * t * 1.4;
      pos[i * 3 + 1] = 2.0 - t * 1.5;
      pos[i * 3 + 2] = slotZ + Math.cos(s.phase) * 0.6;
    }
    geometry.attributes.position.needsUpdate = true;
  });
  return <points geometry={geometry} material={material} />;
}

/* ---------------------------------------------------------------- */
/* Zone 4 — Cleaning: patrolling robot + vanishing dirt              */
/* ---------------------------------------------------------------- */

function CleaningEffect({ zoneIndex, accent, side, zc }: EffectProps) {
  const robot = useRef<THREE.Group>(null);
  const dirt = useRef<THREE.InstancedMesh>(null);
  const D = 34;
  const dirtData = useMemo(
    () =>
      Array.from({ length: D }, () => ({
        x: side * (3.2 + Math.random() * 2.6),
        z: zc + (Math.random() - 0.5) * 10,
        scale: 1,
      })),
    [side, zc]
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const glow = useMemo(
    () => new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6, toneMapped: false }),
    [accent]
  );

  useFrame(({ clock }) => {
    const a = activity(zoneIndex);
    const time = clock.elapsedTime * 0.5;
    const rx = side * 4.4 + Math.sin(time) * side * 1.9;
    const rz = zc + Math.sin(time * 1.7) * 4.6;
    if (robot.current) {
      robot.current.position.set(rx, 0.02, rz);
      robot.current.visible = a > 0.02;
    }
    if (dirt.current) {
      dirt.current.visible = a > 0.02;
      for (let i = 0; i < D; i++) {
        const d = dirtData[i];
        const dist = Math.hypot(d.x - rx, d.z - rz);
        if (a > 0.1 && dist < 1.1) d.scale = Math.max(0, d.scale - 0.06);
        if (a < 0.05) d.scale = 1;
        dummy.position.set(d.x, 0.015, d.z);
        dummy.scale.setScalar(Math.max(d.scale, 0.0001));
        dummy.rotation.x = -Math.PI / 2;
        dummy.updateMatrix();
        dirt.current.setMatrixAt(i, dummy.matrix);
      }
      dirt.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <group ref={robot}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.09, 32]} />
          <meshStandardMaterial color="#f0f1f3" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.04, 20]} />
          <meshStandardMaterial color="#33363c" />
        </mesh>
        <mesh position={[0, 0.02, 0]} material={glow}>
          <cylinderGeometry args={[0.32, 0.32, 0.015, 32]} />
        </mesh>
      </group>
      <instancedMesh ref={dirt} args={[undefined, undefined, D]}>
        <circleGeometry args={[0.09, 10]} />
        <meshBasicMaterial color="#6b6154" transparent opacity={0.6} />
      </instancedMesh>
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Zone 5 — Entertainment: projector beam + motes                    */
/* ---------------------------------------------------------------- */

function CinemaEffect({ zoneIndex, side, zc }: EffectProps) {
  const beam = useRef<THREE.Mesh>(null);
  const N = 90;
  const { geometry, material } = usePoints(N, "#ffb37a", 0.05, 0.5);
  const seeds = useMemo(() => Array.from({ length: N }, () => Math.random()), []);
  useFrame(({ clock }) => {
    const a = activity(zoneIndex);
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial;
      m.opacity = (0.05 + Math.sin(clock.elapsedTime * 1.4) * 0.02) * a;
    }
    material.opacity = 0.5 * a;
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      const t = (seeds[i] + clock.elapsedTime * 0.02) % 1;
      pos[i * 3] = side * (PLATFORM_X - t * 5);
      pos[i * 3 + 1] = 0.6 + Math.sin(seeds[i] * 40 + clock.elapsedTime * 0.5) * 0.5 + 1;
      pos[i * 3 + 2] = zc + Math.sin(seeds[i] * 80) * 2.2;
    }
    geometry.attributes.position.needsUpdate = true;
  });
  return (
    <group>
      <mesh
        ref={beam}
        position={[side * 5.0, 1.6, zc]}
        rotation={[0, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2]}
      >
        <coneGeometry args={[1.6, 4.6, 26, 1, true]} />
        <meshBasicMaterial color="#ffc9a0" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <points geometry={geometry} material={material} />
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Zone 6 — Air Care hero: pollution → clean chambers                */
/* ---------------------------------------------------------------- */

const POLLUTED = new THREE.Color("#d98443");
const CLEAN = new THREE.Color("#59d6f2");

function Chamber({
  zoneIndex,
  position,
  size,
}: {
  zoneIndex: number;
  position: THREE.Vector3;
  size: number;
}) {
  const N = 220;
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      arr[i * 3] = (Math.random() - 0.5) * size * 0.85;
      arr[i * 3 + 1] = Math.random() * size * 1.35 + 0.1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * size * 0.85;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [size]);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: POLLUTED.clone(),
        size: 0.06,
        map: particleTexture(),
        alphaMap: particleTexture(),
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const light = useRef<THREE.PointLight>(null);
  const seeds = useMemo(() => Array.from({ length: N }, () => Math.random()), []);

  useFrame(({ clock }) => {
    const t = zoneT(zoneIndex);
    // activation ramps between 30% and 75% of the zone walk
    const clean = THREE.MathUtils.clamp((t - 0.3) / 0.45, 0, 1);
    const a = activity(zoneIndex);
    material.color.lerpColors(POLLUTED, CLEAN, clean);
    material.opacity = (0.85 - clean * 0.62) * a;
    material.size = 0.06 - clean * 0.028;
    if (light.current) {
      light.current.color.lerpColors(POLLUTED, CLEAN, clean);
      light.current.intensity = (1.4 + clean * 2.2) * a;
    }
    const pos = geometry.attributes.position.array as Float32Array;
    const time = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const churn = (1 - clean) * 0.4 + 0.05;
      pos[i * 3] += Math.sin(time * 0.8 + seeds[i] * 30) * 0.0016 * churn * 60;
      pos[i * 3 + 1] -= clean * 0.012 * (0.5 + seeds[i]);
      if (pos[i * 3 + 1] < 0.05) pos[i * 3 + 1] = size * 1.35;
      pos[i * 3] = THREE.MathUtils.clamp(pos[i * 3], -size * 0.44, size * 0.44);
    }
    geometry.attributes.position.needsUpdate = true;
  });

  // raycast disabled throughout so clicks pass through to the product inside
  return (
    <group position={position}>
      <mesh position={[0, size * 0.75, 0]} raycast={() => null}>
        <boxGeometry args={[size, size * 1.5, size]} />
        <meshPhysicalMaterial
          color="#cfe8f2"
          transparent
          opacity={0.1}
          roughness={0.05}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* chamber frame */}
      {([[-1, -1], [-1, 1], [1, -1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * size) / 2, size * 0.75, (sz * size) / 2]} raycast={() => null}>
          <boxGeometry args={[0.035, size * 1.5, 0.035]} />
          <meshStandardMaterial color="#8b8f96" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      <points geometry={geometry} material={material} raycast={() => null} />
      <pointLight ref={light} position={[0, size * 0.9, 0]} distance={7} intensity={0} />
    </group>
  );
}

function PurifierEffect({ zoneIndex }: EffectProps) {
  const slots = useMemo(() => productSlots(zoneIndex), [zoneIndex]);
  return (
    <group>
      {slots.map((s, i) => (
        <Chamber key={i} zoneIndex={zoneIndex} position={s.position} size={i === 0 ? 1.7 : 1.3} />
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Zone 7 — Power: energy field                                      */
/* ---------------------------------------------------------------- */

function PowerEffect({ zoneIndex, accent, side, zc }: EffectProps) {
  const N = 200;
  const { geometry, material } = usePoints(N, accent, 0.05, 0.7);
  const slots = useMemo(() => productSlots(zoneIndex), [zoneIndex]);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        slot: i % slots.length,
        t: Math.random(),
        r: 0.2 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
      })),
    [slots.length]
  );
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const a = activity(zoneIndex);
    material.opacity = 0.7 * a;
    if (ring.current) {
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * a * (0.7 + Math.sin(clock.elapsedTime * 2) * 0.3);
      ring.current.rotation.z = clock.elapsedTime * 0.4;
    }
    if (a <= 0.001) return;
    const pos = geometry.attributes.position.array as Float32Array;
    const time = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      const base = slots[s.slot].position;
      const t = (s.t + time * 0.16) % 1;
      const ang = s.phase + time * 1.6;
      pos[i * 3] = base.x + Math.cos(ang) * s.r * (1 - t * 0.4);
      pos[i * 3 + 1] = 1.0 + t * 1.5;
      pos[i * 3 + 2] = base.z + Math.sin(ang) * s.r * (1 - t * 0.4);
    }
    geometry.attributes.position.needsUpdate = true;
  });
  return (
    <group>
      <points geometry={geometry} material={material} />
      <mesh ref={ring} position={[side * PLATFORM_X, 0.03, zc]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.0, 6.15, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Zone 8 — Lifestyle: sparkle dust + warm spots                     */
/* ---------------------------------------------------------------- */

function LifestyleEffect({ zoneIndex, accent, side, zc }: EffectProps) {
  const N = 120;
  const { geometry, material } = usePoints(N, accent, 0.045, 0.6);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        x: side * (4.6 + Math.random() * 4.2),
        y: 0.6 + Math.random() * 2.4,
        z: zc + (Math.random() - 0.5) * 11,
        phase: Math.random() * Math.PI * 2,
      })),
    [side, zc]
  );
  useFrame(({ clock }) => {
    const a = activity(zoneIndex);
    const time = clock.elapsedTime;
    material.opacity = (0.35 + Math.sin(time * 2.4) * 0.2) * a;
    if (a <= 0.001) return;
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      pos[i * 3] = s.x + Math.sin(time * 0.4 + s.phase) * 0.25;
      pos[i * 3 + 1] = s.y + Math.sin(time * 0.7 + s.phase * 2) * 0.18;
      pos[i * 3 + 2] = s.z + Math.cos(time * 0.3 + s.phase) * 0.25;
    }
    geometry.attributes.position.needsUpdate = true;
  });
  return <points geometry={geometry} material={material} />;
}

/* ---------------------------------------------------------------- */

const EFFECTS: Record<string, (p: EffectProps) => React.ReactNode> = {
  airflow: AirflowEffect,
  laundry: LaundryEffect,
  kitchen: KitchenEffect,
  cleaning: CleaningEffect,
  cinema: CinemaEffect,
  purifier: PurifierEffect,
  power: PowerEffect,
  lifestyle: LifestyleEffect,
};

export function ZoneEffect(props: EffectProps & { effect: string }) {
  const Effect = EFFECTS[props.effect];
  if (!Effect) return null;
  return <Effect {...props} />;
}
