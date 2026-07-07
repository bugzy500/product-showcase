"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { timeline, allProducts } from "@/src/lib/content";
import { liveState } from "@/src/lib/store";
import { isHero, milestoneActivity, milestoneCenter, milestoneVisible } from "@/src/lib/timeline";
import { infoScreenTexture, glowTexture } from "@/src/lib/textures";
import { ProductModel } from "./models";
import { IfaExperience } from "./IfaExperience";

const plinthMat = new THREE.MeshStandardMaterial({ color: "#d6d8dc", roughness: 0.5, metalness: 0.12 });
const stageMat = new THREE.MeshStandardMaterial({ color: "#16181f", roughness: 0.3, metalness: 0.5 });
const metalMat = new THREE.MeshStandardMaterial({ color: "#83878e", metalness: 0.85, roughness: 0.35 });

/** Products to display in this milestone, laid out in a short row. */
function useMilestoneProducts(index: number) {
  return useMemo(() => {
    const ids = timeline!.milestones[index].products;
    return ids
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p);
  }, [index]);
}

/** A wall of glowing dashboard/marketing screens (ms0 control room). */
function ScreenWall({ accent }: { accent: string }) {
  const screens = useMemo(
    () =>
      (
        [
          ["SOCIAL CALENDAR", "42 posts scheduled", "42"],
          ["LAUNCH COUNTDOWN", "T-minus 07 days", "07"],
          ["CREATOR CONTENT", "18 collabs live", "18"],
          ["PERFORMANCE", "3.2M impressions", "3.2M"],
          ["TEASER CAMPAIGN", "Phase 2 active", ""],
          ["PRODUCT REVEAL", "Assets ready", ""],
        ] as const
      ).map(([title, sub, stat]) =>
        infoScreenTexture(title, sub, accent, { stat: stat || undefined })
      ),
    [accent]
  );
  return (
    <group position={[0, 2.6, -3]}>
      {screens.map((tex, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <mesh key={i} position={[(col - 1) * 3.1, (0.5 - row) * 2.1, 0]}>
            <planeGeometry args={[2.8, 1.9]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Low interaction tables (ms1 experience zone). */
function InteractionTables({ accent }: { accent: string }) {
  return (
    <group>
      {[-3.4, 0, 3.4].map((x, i) => (
        <group key={i} position={[x, 0, 1.5]}>
          <mesh position={[0, 0.5, 0]} material={plinthMat}>
            <boxGeometry args={[1.8, 1, 1.2]} />
          </mesh>
          <mesh position={[0, 1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.8, 1.2]} />
            <meshBasicMaterial color={accent} transparent opacity={0.25} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Assembly-line rail with moving carriers (ms3 factory). */
function AssemblyLine({ accent }: { accent: string }) {
  const carriers = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!carriers.current) return;
    carriers.current.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.6 + i * 1.5) % 12;
      c.position.x = -6 + t;
    });
  });
  return (
    <group position={[0, 0, 2]}>
      <mesh position={[0, 0.9, 0]} material={metalMat}>
        <boxGeometry args={[13, 0.2, 1]} />
      </mesh>
      <group ref={carriers}>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[-6 + i * 2.4, 1.2, 0]} material={plinthMat}>
            <boxGeometry args={[0.7, 0.4, 0.7]} />
          </mesh>
        ))}
      </group>
      {/* overhead cove light */}
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[13, 0.06, 0.06]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Sliding factory doors opening onto a lit launch stage (ms4). */
function LaunchStage({ accent, index }: { accent: string; index: number }) {
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  const flash = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const open = milestoneActivity(liveState.smoothProgress, index);
    if (left.current) left.current.position.x = -2 - open * 2.4;
    if (right.current) right.current.position.x = 2 + open * 2.4;
    if (flash.current)
      flash.current.intensity =
        open > 0.5 ? (Math.sin(performance.now() * 0.02) > 0.7 ? 6 : 0.5) : 0;
  });
  return (
    <group>
      {/* stage disc */}
      <mesh position={[0, 0.1, 0]} material={stageMat}>
        <cylinderGeometry args={[3.4, 3.4, 0.2, 48]} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.0, 3.2, 48]} />
        <meshBasicMaterial color={accent} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      {/* doors behind the stage */}
      <mesh ref={left} position={[-2, 3, -4]} material={metalMat}>
        <boxGeometry args={[4, 6, 0.3]} />
      </mesh>
      <mesh ref={right} position={[2, 3, -4]} material={metalMat}>
        <boxGeometry args={[4, 6, 0.3]} />
      </mesh>
      {/* spotlights */}
      <pointLight position={[-3, 5, 3]} color="#ffffff" distance={16} intensity={2} />
      <pointLight position={[3, 5, 3]} color={accent} distance={16} intensity={2} />
      <pointLight ref={flash} position={[0, 4, 5]} color="#ffffff" distance={12} intensity={0} />
    </group>
  );
}

/** Glowing venue portal for the Smarter Living (October) milestone. */
function SmarterLivingPortal({ accent }: { accent: string }) {
  const marquee = useMemo(
    () => infoScreenTexture("XIAOMI SMARTER LIVING", "Media Event · Enter →", accent),
    [accent]
  );
  return (
    <group>
      {/* portal frame */}
      <mesh position={[-3.2, 3, -2]} material={metalMat}>
        <boxGeometry args={[0.4, 6, 0.4]} />
      </mesh>
      <mesh position={[3.2, 3, -2]} material={metalMat}>
        <boxGeometry args={[0.4, 6, 0.4]} />
      </mesh>
      <mesh position={[0, 6, -2]} material={metalMat}>
        <boxGeometry args={[6.8, 0.4, 0.4]} />
      </mesh>
      {/* glowing doorway */}
      <mesh position={[0, 3, -2.2]}>
        <planeGeometry args={[6, 5.6]} />
        <meshBasicMaterial color={accent} transparent opacity={0.22} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* marquee */}
      <mesh position={[0, 4.4, -1.8]}>
        <planeGeometry args={[6, 1.4]} />
        <meshBasicMaterial map={marquee} toneMapped={false} />
      </mesh>
    </group>
  );
}

function EnvironmentSet({ env, accent, index }: { env: string; accent: string; index: number }) {
  switch (env) {
    case "control-room":
      return <ScreenWall accent={accent} />;
    case "experience-zone":
      return <InteractionTables accent={accent} />;
    case "ifa":
      return <IfaExperience index={index} accent={accent} />;
    case "assembly-line":
      return <AssemblyLine accent={accent} />;
    case "launch-stage":
      return <LaunchStage accent={accent} index={index} />;
    case "sl-portal":
      return <SmarterLivingPortal accent={accent} />;
    default:
      return null;
  }
}

export function MilestoneEnvironment({ index }: { index: number }) {
  const m = timeline!.milestones[index];
  const center = useMemo(() => milestoneCenter(index), [index]);
  const products = useMilestoneProducts(index);
  const group = useRef<THREE.Group>(null);
  const keyLight = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const hero = isHero(index);

  const accent = m.accent;
  const glowTex = useMemo(() => glowTexture(accent), [accent]);

  useFrame(() => {
    const p = liveState.smoothProgress;
    if (group.current) {
      group.current.visible = milestoneVisible(p, index);
      if (!group.current.visible) return;
    }
    const act = milestoneActivity(p, index);
    if (keyLight.current) keyLight.current.intensity = 0.4 + act * (hero ? 3 : 2);
    if (glowRef.current) (glowRef.current.material as THREE.MeshBasicMaterial).opacity = act * 0.4;
  });

  return (
    <group ref={group} position={center} visible={false}>
      {/* floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[hero ? 26 : 18, hero ? 30 : 22]} />
        <meshStandardMaterial color="#0a0c12" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* accent wash */}
      <mesh ref={glowRef} position={[0, 3.2, -5]}>
        <planeGeometry args={[20, 10]} />
        <meshBasicMaterial
          map={glowTex}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <EnvironmentSet env={m.env} accent={accent} index={index} />

      {/* product row */}
      {products.map((p, i) => {
        const n = products.length;
        const x = (i - (n - 1) / 2) * 2.2;
        return (
          <group key={p.id} position={[x, 0.14, 0]}>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.7, 32]} />
              <meshBasicMaterial color={accent} transparent opacity={0.18} toneMapped={false} />
            </mesh>
            <ProductModel model={p.model} accent={p.accent} />
          </group>
        );
      })}

      <pointLight ref={keyLight} position={[0, 5, 4]} color={accent} distance={hero ? 26 : 18} intensity={0} />
      <ambientLight intensity={0.15} />
    </group>
  );
}
