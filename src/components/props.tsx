"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

const fabric = new THREE.MeshStandardMaterial({ color: "#d9d4cb", roughness: 0.9 });
const fabricDark = new THREE.MeshStandardMaterial({ color: "#5a5e66", roughness: 0.9 });
const wood = new THREE.MeshStandardMaterial({ color: "#8a6f52", roughness: 0.6 });
const woodDark = new THREE.MeshStandardMaterial({ color: "#4a3c2e", roughness: 0.65 });
const metal = new THREE.MeshStandardMaterial({ color: "#9ea3ab", metalness: 0.85, roughness: 0.3 });
const matteWhite = new THREE.MeshStandardMaterial({ color: "#eceded", roughness: 0.6 });
const stone = new THREE.MeshStandardMaterial({ color: "#2e3138", roughness: 0.35, metalness: 0.3 });
const foliage = new THREE.MeshStandardMaterial({ color: "#3d5c40", roughness: 0.85 });
const glow = (color: string, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity });

export function Sofa({ position, rotationY = 0, dark = false }: { position: [number, number, number]; rotationY?: number; dark?: boolean }) {
  const mat = dark ? fabricDark : fabric;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[2.2, 0.42, 0.95]} radius={0.08} position={[0, 0.28, 0]} material={mat} />
      <RoundedBox args={[2.2, 0.55, 0.24]} radius={0.08} position={[0, 0.62, -0.38]} material={mat} />
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.24, 0.32, 0.9]} radius={0.07} position={[s * 1.0, 0.55, 0]} material={mat} />
      ))}
    </group>
  );
}

export function CoffeeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.36, 0]} material={woodDark}>
        <cylinderGeometry args={[0.45, 0.45, 0.04, 28]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} material={metal}>
        <cylinderGeometry args={[0.03, 0.05, 0.34, 12]} />
      </mesh>
    </group>
  );
}

export function WindowWall({ position, rotationY = 0, accent }: { position: [number, number, number]; rotationY?: number; accent: string }) {
  const pane = useMemo(() => glow("#cfe0f0", 0.32), []);
  const frame = stone;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={pane} position={[0, 2.1, 0]}>
        <planeGeometry args={[9.6, 3.6]} />
      </mesh>
      {[-4.8, -2.4, 0, 2.4, 4.8].map((x) => (
        <mesh key={x} position={[x, 2.1, 0.02]} material={frame}>
          <boxGeometry args={[0.09, 3.7, 0.06]} />
        </mesh>
      ))}
      {[0.35, 3.9].map((y) => (
        <mesh key={y} position={[0, y, 0.02]} material={frame}>
          <boxGeometry args={[9.7, 0.1, 0.06]} />
        </mesh>
      ))}
      <mesh position={[0, 2.1, -0.06]} material={useMemo(() => glow(accent, 0.12), [accent])}>
        <planeGeometry args={[10.4, 4.2]} />
      </mesh>
    </group>
  );
}

export function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} material={stone}>
        <cylinderGeometry args={[0.16, 0.13, 0.44, 20]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} material={foliage}>
        <coneGeometry args={[0.3, 0.85, 8]} />
      </mesh>
      <mesh position={[0.12, 0.95, 0.05]} material={foliage}>
        <coneGeometry args={[0.2, 0.6, 7]} />
      </mesh>
    </group>
  );
}

export function Rug({ position, color = "#454a54" }: { position: [number, number, number]; color?: string }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 1 }), [color]);
  return (
    <mesh position={[position[0], 0.012, position[2]]} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
      <circleGeometry args={[1.9, 40]} />
    </mesh>
  );
}

export function CabinetRun({ position, rotationY = 0, length = 6 }: { position: [number, number, number]; rotationY?: number; length?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[length, 0.9, 0.62]} radius={0.02} position={[0, 0.46, 0]} material={matteWhite} />
      <mesh position={[0, 0.93, 0]} material={stone}>
        <boxGeometry args={[length + 0.08, 0.05, 0.68]} />
      </mesh>
      <RoundedBox args={[length, 0.8, 0.36]} radius={0.02} position={[0, 2.1, -0.14]} material={matteWhite} />
      {/* under-cabinet light strip */}
      <mesh position={[0, 1.68, 0.06]} material={useMemo(() => glow("#ffd9a0", 0.9), [])}>
        <boxGeometry args={[length * 0.96, 0.015, 0.02]} />
      </mesh>
      {Array.from({ length: Math.floor(length / 0.75) }, (_, i) => (
        <mesh key={i} position={[-length / 2 + 0.5 + i * 0.75, 0.46, 0.315]} material={metal}>
          <boxGeometry args={[0.28, 0.015, 0.015]} />
        </mesh>
      ))}
    </group>
  );
}

export function LaundryCounter({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[3.4, 0.06, 0.6]} radius={0.02} position={[0, 1.0, 0]} material={wood} />
      <RoundedBox args={[3.4, 0.5, 0.3]} radius={0.02} position={[0, 2.0, -0.12]} material={matteWhite} />
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * 1.1, 2.0, 0.045]} material={woodDark}>
          <boxGeometry args={[0.9, 0.4, 0.02]} />
        </mesh>
      ))}
    </group>
  );
}

export function LoungeSeating({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Sofa position={[0, 0, 0]} dark />
      <CoffeeTable position={[0, 0, 1.3]} />
      <Rug position={[0, 0, 0.8]} color="#33363e" />
    </group>
  );
}

export function LabTable({ position, rotationY = 0, accent }: { position: [number, number, number]; rotationY?: number; accent: string }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[2.6, 0.08, 0.9]} radius={0.02} position={[0, 0.86, 0]} material={stone} />
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 0.43, 0]} material={metal}>
          <boxGeometry args={[0.08, 0.86, 0.7]} />
        </mesh>
      ))}
      <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} material={useMemo(() => glow(accent, 0.16), [accent])}>
        <planeGeometry args={[2.4, 0.75]} />
      </mesh>
    </group>
  );
}

export function VanityStation({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.5, 0.06, 0.5]} radius={0.02} position={[0, 0.82, 0]} material={wood} />
      <mesh position={[0, 1.7, -0.2]} material={useMemo(() => glow("#fff2df", 0.95), [])}>
        <torusGeometry args={[0.42, 0.025, 12, 40]} />
      </mesh>
      <mesh position={[0, 1.7, -0.21]} material={stone}>
        <circleGeometry args={[0.4, 36]} />
      </mesh>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.41, 0]} material={woodDark}>
          <boxGeometry args={[0.06, 0.82, 0.4]} />
        </mesh>
      ))}
    </group>
  );
}

/** Picks the dressing cluster for a zone's `environment` key. */
export function EnvironmentProps({
  env,
  side,
  zc,
  accent,
  depth = 14,
}: {
  env: string;
  side: number;
  zc: number;
  accent: string;
  /** Platform depth â€” dressing stays beyond it. */
  depth?: number;
}) {
  const bx = side * 7.2; // platform centre line (PLATFORM_X)
  const wall = 10.3; // just inside the backdrop wall
  const zEdge = depth / 2 + 1.4; // first clear spot past the platform ends
  switch (env) {
    case "livingroom":
      return (
        <group>
          <WindowWall position={[side * wall, 0, zc]} rotationY={side > 0 ? -Math.PI / 2 : Math.PI / 2} accent={accent} />
          <Sofa position={[bx - side * 3.4, 0, zc + 4.6]} rotationY={side > 0 ? Math.PI * 0.82 : Math.PI * 0.18} />
          <CoffeeTable position={[bx - side * 4.2, 0, zc + 3.4]} />
          <Rug position={[bx - side * 3.7, 0, zc + 4]} />
          <Plant position={[bx - side * 0.6, 0, zc - zEdge]} />
        </group>
      );
    case "laundry":
      return (
        <group>
          <LaundryCounter position={[side * (wall - 0.5), 0, zc - 5.6]} rotationY={side > 0 ? -Math.PI / 2 : Math.PI / 2} />
          <Plant position={[bx - side * 1, 0, zc + zEdge]} />
          <Rug position={[bx - side * 3.1, 0, zc]} color="#3c4750" />
        </group>
      );
    case "kitchen":
      return (
        <group>
          <CabinetRun position={[side * (wall - 0.2), 0, zc]} rotationY={side > 0 ? -Math.PI / 2 : Math.PI / 2} length={8} />
          <Plant position={[bx - side * 0.8, 0, zc + zEdge]} />
        </group>
      );
    case "home":
      return (
        <group>
          <Sofa position={[bx - side * 3.5, 0, zc - 4]} rotationY={side > 0 ? Math.PI * 1.2 : -Math.PI * 0.2} />
          <Rug position={[bx - side * 2.2, 0, zc + 1]} color="#4a4238" />
          <Plant position={[bx - side * 0.6, 0, zc + zEdge]} />
          <Plant position={[bx - side * 4.6, 0, zc - zEdge]} />
        </group>
      );
    case "lounge":
      return (
        <group>
          <LoungeSeating position={[bx - side * 4.0, 0, zc]} rotationY={side > 0 ? -Math.PI / 2 : Math.PI / 2} />
        </group>
      );
    case "gallery":
      return (
        <group>
          <Plant position={[bx - side * 1, 0, zc + zEdge]} />
          <Plant position={[bx - side * 1, 0, zc - zEdge]} />
        </group>
      );
    case "lab":
      return (
        <group>
          <LabTable position={[side * (wall - 0.7), 0, zc + 4.4]} rotationY={side > 0 ? -Math.PI / 2 : Math.PI / 2} accent={accent} />
          <LabTable position={[side * (wall - 0.7), 0, zc - 4.4]} rotationY={side > 0 ? -Math.PI / 2 : Math.PI / 2} accent={accent} />
        </group>
      );
    case "studio":
      return (
        <group>
          <VanityStation position={[side * (wall - 0.4), 0, zc - 4.8]} rotationY={side > 0 ? -Math.PI / 2 : Math.PI / 2} />
          <Rug position={[bx - side * 2.8, 0, zc]} color="#4d4535" />
          <Plant position={[bx - side * 0.8, 0, zc + zEdge]} />
        </group>
      );
    default:
      return null;
  }
}
