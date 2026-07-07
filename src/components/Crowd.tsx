"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* Shared low-poly figure geometry (reused across all crowd instances). */
const bodyGeo = new THREE.CapsuleGeometry(0.16, 0.5, 4, 8);
const headGeo = new THREE.SphereGeometry(0.13, 10, 10);
const CLOTHES = ["#3a4150", "#4a5262", "#2b3140", "#5a5060", "#394a52", "#4d3f46", "#42505a"];

interface CrowdProps {
  count?: number;
  /** Walk-region footprint (metres) centred on the group. */
  width?: number;
  depth?: number;
  position?: [number, number, number];
  speed?: number;
}

/**
 * Lightweight ambient crowd — instanced capsule figures walking within a
 * rectangular region and wrapping. No shadows/network; culled with its parent.
 */
export function Crowd({
  count = 26,
  width = 16,
  depth = 12,
  position = [0, 0, 0],
  speed = 0.5,
}: CrowdProps) {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const colored = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const agents = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * width,
        z0: (Math.random() - 0.5) * depth,
        dir: Math.random() > 0.5 ? 1 : -1,
        spd: speed * (0.6 + Math.random() * 0.9),
        phase: Math.random() * Math.PI * 2,
        color: new THREE.Color(CLOTHES[i % CLOTHES.length]),
      })),
    [count, width, depth, speed]
  );

  useFrame(({ clock }) => {
    const b = bodies.current;
    const h = heads.current;
    if (!b || !h) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const a = agents[i];
      let z = a.z0 + a.dir * a.spd * t;
      z = (((z + depth / 2) % depth) + depth) % depth - depth / 2; // wrap into region
      const bob = Math.sin(t * 4 + a.phase) * 0.03;
      dummy.rotation.set(0, a.dir > 0 ? 0 : Math.PI, 0);
      dummy.position.set(a.x, 0.42 + bob, z);
      dummy.updateMatrix();
      b.setMatrixAt(i, dummy.matrix);
      dummy.position.set(a.x, 0.84 + bob, z);
      dummy.updateMatrix();
      h.setMatrixAt(i, dummy.matrix);
      if (!colored.current) b.setColorAt(i, a.color);
    }
    b.instanceMatrix.needsUpdate = true;
    h.instanceMatrix.needsUpdate = true;
    if (!colored.current && b.instanceColor) {
      b.instanceColor.needsUpdate = true;
      colored.current = true;
    }
  });

  return (
    <group position={position}>
      <instancedMesh ref={bodies} args={[bodyGeo, undefined, count]}>
        <meshStandardMaterial roughness={0.85} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[headGeo, undefined, count]}>
        <meshStandardMaterial color="#caa98c" roughness={0.7} />
      </instancedMesh>
    </group>
  );
}
