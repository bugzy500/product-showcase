"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { content } from "@/src/lib/content";
import { liveState } from "@/src/lib/store";
import {
  CEILING_HEIGHT,
  DOOR_Z,
  HALL_END_Z,
  HALL_HALF_WIDTH,
  FINALE_Z,
  localT,
  segment,
  clamp01,
} from "@/src/lib/timeline";
import { ledTextTexture } from "@/src/lib/textures";

const wallMat = new THREE.MeshStandardMaterial({ color: "#171920", roughness: 0.65, metalness: 0.25 });
const floorMat = new THREE.MeshStandardMaterial({ color: "#14161c", roughness: 0.42, metalness: 0.5 });
const ceilMat = new THREE.MeshStandardMaterial({ color: "#0f1015", roughness: 0.8 });
const columnMat = new THREE.MeshStandardMaterial({ color: "#e8e9ec", roughness: 0.45, metalness: 0.2 });
const doorMat = new THREE.MeshPhysicalMaterial({
  color: "#9fc4d4",
  transparent: true,
  opacity: 0.22,
  roughness: 0.05,
  metalness: 0.1,
});
const doorFrameMat = new THREE.MeshStandardMaterial({ color: "#5b5f66", metalness: 0.9, roughness: 0.3 });

export function Hall() {
  const hallLength = Math.abs(HALL_END_Z - DOOR_Z);
  const hallMidZ = (DOOR_Z + HALL_END_Z) / 2;

  const ledTex = useMemo(
    () =>
      ledTextTexture(content.event.ledWallText, {
        width: 2048,
        height: 384,
        sub: content.event.subtitle,
        font: "700 96px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }),
    []
  );

  const stripMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffe9c9", toneMapped: false }),
    []
  );
  const accentStripMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ff6900", toneMapped: false, transparent: true, opacity: 0.8 }),
    []
  );
  const doorL = useRef<THREE.Group>(null);
  const doorR = useRef<THREE.Group>(null);
  const hallLight = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const arrival = segment("arrival");
    const t = localT(liveState.smoothProgress, arrival);
    // doors slide open as the visitor approaches
    const open = clamp01((t - 0.52) / 0.28);
    const slide = open * open * (3 - 2 * open) * 2.6;
    if (doorL.current) doorL.current.position.x = -1.3 - slide;
    if (doorR.current) doorR.current.position.x = 1.3 + slide;
    // interior lights ramp on
    const on = 0.12 + 0.88 * clamp01((t - 0.4) / 0.35);
    stripMat.color.setRGB(1 * on, 0.91 * on, 0.78 * on);
    if (hallLight.current) hallLight.current.intensity = on * 0.7;
  });

  const strips = useMemo(() => {
    const list: number[] = [];
    for (let z = DOOR_Z - 8; z > HALL_END_Z; z -= 8) list.push(z);
    return list;
  }, []);

  return (
    <group>
      {/* floor spanning approach + hall + rotunda */}
      <mesh position={[0, 0, (70 + FINALE_Z - 30) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <planeGeometry args={[90, 70 - (FINALE_Z - 30)]} />
      </mesh>

      {/* approach guide lights */}
      {[24, 32, 40, 48, 56].map((z) =>
        [-3.2, 3.2].map((x) => (
          <mesh key={`${z}${x}`} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.16, 16]} />
            <meshBasicMaterial color="#ffb46a" toneMapped={false} />
          </mesh>
        ))
      )}

      {/* entry facade */}
      <group position={[0, 0, DOOR_Z]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * ((2.7 + HALL_HALF_WIDTH) / 2), CEILING_HEIGHT / 2, 0]} material={wallMat}>
            <boxGeometry args={[HALL_HALF_WIDTH - 2.7, CEILING_HEIGHT, 0.5]} />
          </mesh>
        ))}
        {/* header above the doorway (doorway is 5.4 wide × 4.4 high) */}
        <mesh position={[0, (4.4 + CEILING_HEIGHT) / 2, 0]} material={wallMat}>
          <boxGeometry args={[5.4, CEILING_HEIGHT - 4.4, 0.5]} />
        </mesh>
        {/* LED wall above the doors */}
        <mesh position={[0, 5.95, 0.32]}>
          <planeGeometry args={[10, 1.9]} />
          <meshBasicMaterial map={ledTex} toneMapped={false} />
        </mesh>
        <mesh position={[0, 4.92, 0.3]} material={accentStripMat}>
          <boxGeometry args={[10, 0.05, 0.02]} />
        </mesh>
        {/* sliding glass doors */}
        <group ref={doorL}>
          <mesh position={[0, 2.2, 0]} material={doorMat}>
            <boxGeometry args={[2.55, 4.35, 0.06]} />
          </mesh>
          <mesh position={[1.24, 2.2, 0]} material={doorFrameMat}>
            <boxGeometry args={[0.07, 4.35, 0.1]} />
          </mesh>
        </group>
        <group ref={doorR}>
          <mesh position={[0, 2.2, 0]} material={doorMat}>
            <boxGeometry args={[2.55, 4.35, 0.06]} />
          </mesh>
          <mesh position={[-1.24, 2.2, 0]} material={doorFrameMat}>
            <boxGeometry args={[0.07, 4.35, 0.1]} />
          </mesh>
        </group>
        {/* door frame */}
        <mesh position={[0, 4.5, 0]} material={doorFrameMat}>
          <boxGeometry args={[5.4, 0.14, 0.2]} />
        </mesh>
      </group>

      {/* side walls */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * HALL_HALF_WIDTH, CEILING_HEIGHT / 2, hallMidZ]}
          material={wallMat}
        >
          <boxGeometry args={[0.4, CEILING_HEIGHT, hallLength]} />
        </mesh>
      ))}

      {/* warm wall wash strips */}
      {[-1, 1].map((s) => (
        <mesh
          key={`w${s}`}
          position={[s * (HALL_HALF_WIDTH - 0.25), 2.5, hallMidZ]}
          material={accentStripMat}
        >
          <boxGeometry args={[0.02, 0.03, hallLength - 2]} />
        </mesh>
      ))}

      {/* ceiling */}
      <mesh position={[0, CEILING_HEIGHT, hallMidZ]} material={ceilMat}>
        <boxGeometry args={[HALL_HALF_WIDTH * 2, 0.3, hallLength]} />
      </mesh>

      {/* ceiling light strips */}
      {strips.map((z) => (
        <mesh key={z} position={[0, CEILING_HEIGHT - 0.18, z]} material={stripMat}>
          <boxGeometry args={[6, 0.04, 0.28]} />
        </mesh>
      ))}
      <pointLight ref={hallLight} position={[0, CEILING_HEIGHT - 1, -6]} distance={40} intensity={0} color="#ffe0b8" />

      {/* lobby */}
      <group position={[0, 0, 2]}>
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.36, 64]} />
          <meshBasicMaterial color="#ff6900" toneMapped={false} transparent opacity={0.85} />
        </mesh>
        {[-1, 1].map((s) =>
          [8, -4].map((z) => (
            <group key={`${s}${z}`} position={[s * 5.2, 0, z]}>
              <mesh position={[0, CEILING_HEIGHT / 2, 0]} material={columnMat}>
                <cylinderGeometry args={[0.28, 0.32, CEILING_HEIGHT, 20]} />
              </mesh>
              <mesh position={[0, 2.3, 0]}>
                <torusGeometry args={[0.31, 0.015, 8, 28]} />
                <meshBasicMaterial color="#ff6900" toneMapped={false} />
              </mesh>
            </group>
          ))
        )}
      </group>
    </group>
  );
}
