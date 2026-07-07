"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { timeline, allProducts, type FlatProduct } from "@/src/lib/content";
import { liveState } from "@/src/lib/store";
import { isHero, milestoneActivity, milestoneCenter, milestoneVisible } from "@/src/lib/timeline";
import { infoScreenTexture, glowTexture } from "@/src/lib/textures";
import { ProductModel } from "./models";
import { IfaExperience } from "./IfaExperience";

const stageMat = new THREE.MeshStandardMaterial({ color: "#16181f", roughness: 0.3, metalness: 0.5 });
const metalMat = new THREE.MeshStandardMaterial({ color: "#83878e", metalness: 0.85, roughness: 0.35 });
const stationBaseMat = new THREE.MeshStandardMaterial({ color: "#1b1f28", roughness: 0.42, metalness: 0.55 });
const stationTopMat = new THREE.MeshStandardMaterial({ color: "#d0d3d8", roughness: 0.45, metalness: 0.18 });
const screenFrameMat = new THREE.MeshStandardMaterial({ color: "#0d0f15", roughness: 0.5, metalness: 0.4 });
const beltMat = new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.82, metalness: 0.12 });
const chassisMat = new THREE.MeshStandardMaterial({ color: "#b9bdc5", metalness: 0.82, roughness: 0.3 });
const palletMat = new THREE.MeshStandardMaterial({ color: "#20242e", roughness: 0.5, metalness: 0.55 });
const gantryMat = new THREE.MeshStandardMaterial({ color: "#6b7078", metalness: 0.8, roughness: 0.4 });

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

/** Themed labels for the experience-zone stations (ms1). */
const STATION_LABELS: [string, string][] = [
  ["CHARGING BAR", "Fast & portable power"],
  ["PORTABLE POWER", "Everyday carry"],
  ["AIR PURIFICATION", "Clean-air demos"],
];

/** A single hands-on interaction station: detailed table + lit product pads +
 *  a backlit info screen. Products sit ON the top surface at eye level. */
function InteractionStation({
  products,
  accent,
  label,
}: {
  products: FlatProduct[];
  accent: string;
  label: [string, string];
}) {
  const led = useMemo(() => new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }), [accent]);
  const screenTex = useMemo(() => infoScreenTexture(label[0], label[1], accent), [label, accent]);
  const n = products.length;
  return (
    <group>
      {/* base body */}
      <RoundedBox args={[2.55, 0.9, 1.25]} radius={0.05} position={[0, 0.45, 0]} material={stationBaseMat} />
      {/* top slab with a slight overhang */}
      <RoundedBox args={[2.72, 0.1, 1.42]} radius={0.03} position={[0, 0.94, 0]} material={stationTopMat} />
      {/* accent LED strip along the front lip */}
      <mesh position={[0, 0.9, 0.7]} material={led}>
        <boxGeometry args={[2.6, 0.02, 0.04]} />
      </mesh>
      {/* faint accent wash spilling down the front */}
      <mesh position={[0, 0.5, 0.64]}>
        <planeGeometry args={[2.5, 0.72]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.09}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* backlit info screen on a slim stand behind the products */}
      <group position={[0, 0, -0.46]}>
        <mesh position={[0, 1.06, 0]} material={screenFrameMat}>
          <boxGeometry args={[0.06, 0.24, 0.06]} />
        </mesh>
        <mesh position={[0, 1.56, 0]} material={screenFrameMat}>
          <boxGeometry args={[1.52, 1.14, 0.05]} />
        </mesh>
        <mesh position={[0, 1.56, 0.031]}>
          <planeGeometry args={[1.42, 1.04]} />
          <meshBasicMaterial map={screenTex} toneMapped={false} />
        </mesh>
      </group>
      {/* product pads + products on the table top */}
      {products.map((p, i) => {
        const x = (i - (n - 1) / 2) * 1.24;
        return (
          <group key={p.id} position={[x, 0.99, 0.06]}>
            <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.42, 40]} />
              <meshBasicMaterial color={accent} transparent opacity={0.2} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={led}>
              <ringGeometry args={[0.4, 0.43, 40]} />
            </mesh>
            <ProductModel model={p.model} accent={p.accent} />
          </group>
        );
      })}
      {/* soft accent uplight so products read against the dark bay */}
      <pointLight position={[0, 1.5, 0.6]} color={accent} distance={4.5} intensity={1.2} />
    </group>
  );
}

/** Row of hands-on interaction stations (ms1 experience zone). Products are
 *  distributed across up to three themed stations and displayed on top. */
function InteractionStations({ products, accent }: { products: FlatProduct[]; accent: string }) {
  const stations = useMemo(() => {
    const per = Math.max(1, Math.ceil(products.length / 3));
    const groups: FlatProduct[][] = [];
    for (let i = 0; i < products.length; i += per) groups.push(products.slice(i, i + per));
    return groups.slice(0, 3);
  }, [products]);
  const baseX =
    stations.length === 1 ? [0] : stations.length === 2 ? [-2.4, 2.4] : [-3.7, 0, 3.7];
  return (
    <group position={[0, 0, 1.0]}>
      {stations.map((group, i) => (
        <group key={i} position={[baseX[i] ?? 0, 0, 0]}>
          <InteractionStation
            products={group}
            accent={accent}
            label={STATION_LABELS[i] ?? ["EXPERIENCE", "Hands-on demo"]}
          />
        </group>
      ))}
    </group>
  );
}

/** A partially-assembled large-appliance chassis riding a pallet down the line.
 *  Higher `stage` = further along assembly (taller body, more fitted parts). */
function Chassis({ accent, stage }: { accent: string; stage: number }) {
  const led = useMemo(() => new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }), [accent]);
  const h = 0.55 + stage * 0.24;
  return (
    <group>
      {/* pallet the unit rides on */}
      <RoundedBox args={[1.05, 0.14, 1.05]} radius={0.03} position={[0, 0.07, 0]} material={palletMat} />
      {/* metallic chassis body — grows as it moves down the line */}
      <RoundedBox args={[0.74, h, 0.74]} radius={0.05} position={[0, 0.14 + h / 2, 0]} material={chassisMat} />
      {/* front vent panel fitted from stage 2 */}
      {stage >= 2 && (
        <mesh position={[0, 0.14 + h * 0.55, 0.38]} material={screenFrameMat}>
          <boxGeometry args={[0.5, h * 0.5, 0.03]} />
        </mesh>
      )}
      {/* status LED lit once electronics go in (final stages) */}
      {stage >= 3 && (
        <mesh position={[0, 0.14 + h - 0.1, 0.385]} material={led}>
          <boxGeometry args={[0.42, 0.03, 0.02]} />
        </mesh>
      )}
    </group>
  );
}

/** A jointed factory robot straddling the belt, sweeping through a welding
 *  cycle with a pulsing accent tool-tip. `side` picks which flank it stands on. */
function RoboticArm({ accent, side, phase }: { accent: string; side: 1 | -1; phase: number }) {
  const shoulder = useRef<THREE.Group>(null);
  const forearm = useRef<THREE.Group>(null);
  const spark = useRef<THREE.PointLight>(null);
  const led = useMemo(() => new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }), [accent]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 1.3 + phase;
    if (shoulder.current) shoulder.current.rotation.x = -0.45 + Math.sin(t) * 0.26;
    if (forearm.current) forearm.current.rotation.x = 0.65 + Math.cos(t * 1.15) * 0.3;
    if (spark.current) spark.current.intensity = Math.sin(t * 6) > 0.55 ? 3.4 : 0.15;
  });
  return (
    <group rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
      {/* bolted base */}
      <mesh position={[0, 0.12, 0]} material={metalMat}>
        <cylinderGeometry args={[0.36, 0.44, 0.24, 24]} />
      </mesh>
      {/* rotating column — tall enough to reach down over the chassis */}
      <mesh position={[0, 1.05, 0]} material={gantryMat}>
        <boxGeometry args={[0.32, 1.8, 0.32]} />
      </mesh>
      {/* shoulder pivot — the whole arm sweeps from here */}
      <group ref={shoulder} position={[0, 1.98, 0]}>
        {/* upper arm reaching over the belt (toward local −z) */}
        <mesh position={[0, 0, -0.9]} material={metalMat}>
          <boxGeometry args={[0.22, 0.22, 1.9]} />
        </mesh>
        <mesh position={[0, 0.13, -0.4]} material={led}>
          <boxGeometry args={[0.24, 0.03, 0.5]} />
        </mesh>
        {/* elbow → forearm → welding head */}
        <group ref={forearm} position={[0, 0, -1.85]}>
          <mesh position={[0, -0.45, 0]} material={metalMat}>
            <boxGeometry args={[0.18, 1.0, 0.18]} />
          </mesh>
          <mesh position={[0, -0.98, 0]} material={gantryMat}>
            <coneGeometry args={[0.1, 0.26, 16]} />
          </mesh>
          <mesh position={[0, -1.14, 0]} material={led}>
            <sphereGeometry args={[0.05, 12, 12]} />
          </mesh>
          <pointLight ref={spark} position={[0, -1.16, 0]} color={accent} distance={3} intensity={0.15} />
        </group>
      </group>
    </group>
  );
}

/** Living assembly line (ms5 — Large Appliance Factory Visit): a structural
 *  conveyor carrying appliance chassis at progressive build stages, flanked by
 *  welding robots, an overhead gantry, and a quality-testing scan gate. */
function AssemblyLine({ accent }: { accent: string }) {
  const carriers = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const BELT_LEN = 13.4;
  const SPAN = BELT_LEN; // travel distance before a carrier recycles
  const N = 5;
  const specTex = useMemo(() => infoScreenTexture("ASSEMBLY LINE", "Component → finished unit", accent), [accent]);
  const qaTex = useMemo(() => infoScreenTexture("QUALITY TESTING", "Compressor · sensors · kWh", accent), [accent]);
  const coveMat = useMemo(() => new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }), [accent]);
  const laneMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.3, toneMapped: false }),
    [accent]
  );

  useFrame(({ clock }) => {
    if (carriers.current) {
      carriers.current.children.forEach((c, i) => {
        const t = (clock.elapsedTime * 0.9 + (i * SPAN) / N) % SPAN;
        c.position.x = -SPAN / 2 + t;
      });
    }
    if (scan.current) {
      const m = scan.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.22 + (Math.sin(clock.elapsedTime * 3) * 0.5 + 0.5) * 0.4;
    }
  });

  const legXs = [-5.5, -2.75, 0, 2.75, 5.5];

  return (
    <group position={[0, 0, 2]}>
      {/* ---- conveyor structure ---- */}
      {/* dark rubber belt bed */}
      <mesh position={[0, 0.92, 0]} material={beltMat}>
        <boxGeometry args={[BELT_LEN, 0.14, 1.7]} />
      </mesh>
      {/* side rails */}
      <mesh position={[0, 0.99, 0.86]} material={gantryMat}>
        <boxGeometry args={[BELT_LEN, 0.12, 0.1]} />
      </mesh>
      <mesh position={[0, 0.99, -0.86]} material={gantryMat}>
        <boxGeometry args={[BELT_LEN, 0.12, 0.1]} />
      </mesh>
      {/* drum rollers at each end */}
      {[-BELT_LEN / 2, BELT_LEN / 2].map((x) => (
        <mesh key={x} position={[x, 0.92, 0]} rotation={[Math.PI / 2, 0, 0]} material={metalMat}>
          <cylinderGeometry args={[0.2, 0.2, 1.72, 20]} />
        </mesh>
      ))}
      {/* support legs */}
      {legXs.map((x) =>
        [-0.6, 0.6].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 0.42, z]} material={gantryMat}>
            <boxGeometry args={[0.12, 0.84, 0.12]} />
          </mesh>
        ))
      )}

      {/* ---- chassis riding the belt ---- */}
      <group ref={carriers}>
        {Array.from({ length: N }, (_, i) => (
          <group key={i} position={[-SPAN / 2 + (i * SPAN) / N, 0.99, 0]}>
            <Chassis accent={accent} stage={i} />
          </group>
        ))}
      </group>

      {/* ---- welding robots on the back flank, arcing forward over the line ---- */}
      <group position={[-2.6, 0, -1.7]}>
        <RoboticArm accent={accent} side={-1} phase={0} />
      </group>
      <group position={[1.9, 0, -1.7]}>
        <RoboticArm accent={accent} side={-1} phase={1.7} />
      </group>

      {/* ---- overhead gantry truss (the accent cove now mounts to it) ---- */}
      <mesh position={[-6.7, 1.9, 0]} material={gantryMat}>
        <boxGeometry args={[0.18, 3.8, 0.18]} />
      </mesh>
      <mesh position={[6.7, 1.9, 0]} material={gantryMat}>
        <boxGeometry args={[0.18, 3.8, 0.18]} />
      </mesh>
      <mesh position={[0, 3.7, 0]} material={gantryMat}>
        <boxGeometry args={[13.8, 0.18, 0.18]} />
      </mesh>
      {/* accent cove strip along the underside of the beam */}
      <mesh position={[0, 3.55, 0]} material={coveMat}>
        <boxGeometry args={[13, 0.05, 0.05]} />
      </mesh>

      {/* ---- quality-testing scan gate near the exit ---- */}
      <group position={[5.0, 0, 0]}>
        <mesh position={[0, 1.05, 1.0]} material={gantryMat}>
          <boxGeometry args={[0.14, 2.1, 0.14]} />
        </mesh>
        <mesh position={[0, 1.05, -1.0]} material={gantryMat}>
          <boxGeometry args={[0.14, 2.1, 0.14]} />
        </mesh>
        <mesh position={[0, 2.05, 0]} material={gantryMat}>
          <boxGeometry args={[0.14, 0.14, 2.1]} />
        </mesh>
        {/* sweeping scan plane */}
        <mesh ref={scan} position={[0, 1.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.9, 1.7]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.3}
            toneMapped={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ---- backlit signage on the gantry ---- */}
      {[
        { x: -3.6, tex: specTex },
        { x: 3.4, tex: qaTex },
      ].map(({ x, tex }) => (
        <group key={x} position={[x, 2.7, -1.55]}>
          <mesh material={screenFrameMat}>
            <boxGeometry args={[2.1, 1.28, 0.06]} />
          </mesh>
          <mesh position={[0, 0, 0.032]}>
            <planeGeometry args={[1.98, 1.16]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* ---- painted floor safety lanes ---- */}
      {[-1.35, 1.35].map((z) => (
        <mesh key={z} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} material={laneMat}>
          <planeGeometry args={[BELT_LEN + 1, 0.09]} />
        </mesh>
      ))}

      {/* accent fill so the machinery reads against the dark bay */}
      <pointLight position={[0, 2.4, 1.4]} color={accent} distance={11} intensity={1.6} />
      <pointLight position={[4.8, 1.8, 0]} color={accent} distance={6} intensity={1.4} />
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

function EnvironmentSet({
  env,
  accent,
  index,
  products,
}: {
  env: string;
  accent: string;
  index: number;
  products: FlatProduct[];
}) {
  switch (env) {
    case "control-room":
      return <ScreenWall accent={accent} />;
    case "experience-zone":
      return <InteractionStations products={products} accent={accent} />;
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

      <EnvironmentSet env={m.env} accent={accent} index={index} products={products} />

      {/* product row — skipped for environments that stage their own products:
          the experience zone (products sit on its station tops) and the
          assembly line (the belt's chassis are the appliances being built, so a
          duplicate floor row of the AC units just reads as leftover pre-heat props) */}
      {m.env !== "experience-zone" &&
        m.env !== "assembly-line" &&
        products.map((p, i) => {
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
