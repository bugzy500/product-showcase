"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { screenTexture } from "@/src/lib/textures";

/* Shared premium materials (created once, reused across every product). */
const alu = new THREE.MeshStandardMaterial({ color: "#d9dbdf", metalness: 0.85, roughness: 0.32 });
const aluDark = new THREE.MeshStandardMaterial({ color: "#83878e", metalness: 0.9, roughness: 0.35 });
const graphite = new THREE.MeshStandardMaterial({ color: "#3a3e45", metalness: 0.7, roughness: 0.4 });
const white = new THREE.MeshStandardMaterial({ color: "#f4f5f7", metalness: 0.15, roughness: 0.45 });
const offWhite = new THREE.MeshStandardMaterial({ color: "#e6e7ea", metalness: 0.2, roughness: 0.5 });
const silver = new THREE.MeshStandardMaterial({ color: "#c4c7cd", metalness: 0.8, roughness: 0.3 });
const dark = new THREE.MeshStandardMaterial({ color: "#191b20", metalness: 0.5, roughness: 0.45 });
const iceWhite = new THREE.MeshStandardMaterial({ color: "#eef0f3", metalness: 0.35, roughness: 0.3 });
const glass = new THREE.MeshPhysicalMaterial({
  color: "#bfd9e2",
  metalness: 0,
  roughness: 0.06,
  transparent: true,
  opacity: 0.2,
  side: THREE.DoubleSide,
});
const darkGlass = new THREE.MeshPhysicalMaterial({
  color: "#10141c",
  metalness: 0.4,
  roughness: 0.12,
  transparent: true,
  opacity: 0.82,
});

const accentMat = (color: string) =>
  new THREE.MeshBasicMaterial({ color, toneMapped: false });

interface ModelProps {
  accent: string;
}

/* ---------------------------------------------------------------- */
/* Climate                                                           */
/* ---------------------------------------------------------------- */

function AcVertical({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group>
      <RoundedBox args={[0.58, 1.9, 0.44]} radius={0.09} position={[0, 0.97, 0]} material={white} />
      {/* dual air outlets */}
      <RoundedBox args={[0.4, 0.34, 0.05]} radius={0.03} position={[0, 1.62, 0.21]} material={dark} />
      <RoundedBox args={[0.4, 0.34, 0.05]} radius={0.03} position={[0, 1.18, 0.21]} material={dark} />
      {/* LED status ring */}
      <mesh position={[0, 0.55, 0.223]} material={led}>
        <circleGeometry args={[0.035, 24]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} material={aluDark}>
        <cylinderGeometry args={[0.3, 0.34, 0.06, 32]} />
      </mesh>
    </group>
  );
}

/** Indoor split-AC unit, centred at the origin, louvre + LED facing +z. */
function AcWallUnit({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group>
      <RoundedBox args={[1.05, 0.33, 0.26]} radius={0.1} material={white} />
      <RoundedBox args={[0.98, 0.05, 0.02]} radius={0.01} position={[0, -0.12, 0.13]} material={dark} />
      <mesh position={[0.42, 0, 0.135]} material={led}>
        <circleGeometry args={[0.02, 20]} />
      </mesh>
    </group>
  );
}

/** Wall-mount model (no stand) — used for the Climate pods. */
function AcWall({ accent }: ModelProps) {
  return (
    <group position={[0, 0, 0]}>
      <AcWallUnit accent={accent} />
    </group>
  );
}

/** Exhibition variant on a slim stand (used outside the pods layout). */
function AcSplit({ accent }: ModelProps) {
  return (
    <group>
      {/* exhibition stand */}
      <mesh position={[0, 0.65, 0]} material={aluDark}>
        <cylinderGeometry args={[0.025, 0.025, 1.3, 12]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={aluDark}>
        <cylinderGeometry args={[0.22, 0.26, 0.04, 24]} />
      </mesh>
      {/* wall unit */}
      <group position={[0, 1.45, 0]}>
        <AcWallUnit accent={accent} />
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Laundry                                                           */
/* ---------------------------------------------------------------- */

function SpinningDrum({
  radius,
  y,
  z,
  accent,
}: {
  radius: number;
  y: number;
  z: number;
  accent: string;
}) {
  const drum = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (drum.current) drum.current.rotation.z += dt * 1.6;
  });
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group position={[0, y, z]}>
      <mesh material={silver}>
        <torusGeometry args={[radius, radius * 0.13, 16, 40]} />
      </mesh>
      <mesh position={[0, 0, 0.01]} material={darkGlass}>
        <circleGeometry args={[radius * 0.92, 32]} />
      </mesh>
      <group ref={drum} position={[0, 0, -0.04]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0, 0, 0]} material={aluDark}>
            <boxGeometry args={[radius * 1.5, radius * 0.14, 0.02]} />
          </mesh>
        ))}
      </group>
      <mesh position={[radius * 0.72, radius * 0.72, 0.015]} material={led}>
        <circleGeometry args={[0.015, 16]} />
      </mesh>
    </group>
  );
}

function Washer({ accent, body = white }: ModelProps & { body?: THREE.Material }) {
  return (
    <group>
      <RoundedBox args={[0.64, 0.85, 0.64]} radius={0.05} position={[0, 0.46, 0]} material={body} />
      <SpinningDrum radius={0.21} y={0.44} z={0.33} accent={accent} />
      <RoundedBox args={[0.56, 0.07, 0.02]} radius={0.01} position={[0, 0.82, 0.325]} material={dark} />
    </group>
  );
}

function WasherGray({ accent }: ModelProps) {
  return <Washer accent={accent} body={graphite} />;
}

function WasherSilver({ accent }: ModelProps) {
  return <Washer accent={accent} body={silver} />;
}

function WasherTower({ accent }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[0.64, 1.55, 0.64]} radius={0.05} position={[0, 0.8, 0]} material={silver} />
      <SpinningDrum radius={0.21} y={0.5} z={0.33} accent={accent} />
      <SpinningDrum radius={0.13} y={1.18} z={0.33} accent={accent} />
      <RoundedBox args={[0.56, 0.06, 0.02]} radius={0.01} position={[0, 1.48, 0.325]} material={dark} />
    </group>
  );
}

function WasherMini({ accent }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[0.46, 0.6, 0.46]} radius={0.05} position={[0, 0.36, 0]} material={offWhite} />
      <SpinningDrum radius={0.14} y={0.36} z={0.24} accent={accent} />
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, 0.03, 0.15]} material={aluDark}>
          <cylinderGeometry args={[0.02, 0.025, 0.06, 10]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Kitchen                                                           */
/* ---------------------------------------------------------------- */

function Fridge({
  accent,
  width = 0.95,
  layout = "french",
}: ModelProps & { width?: number; layout?: "french" | "cross" | "three" }) {
  const led = useMemo(() => accentMat(accent), [accent]);
  const h = 1.85;
  const seam = new THREE.MeshBasicMaterial({ color: "#0c0d11" });
  return (
    <group>
      {/* Ice Crystal White flat-embedded body */}
      <RoundedBox args={[width, h, 0.68]} radius={0.04} position={[0, h / 2 + 0.02, 0]} material={iceWhite} />
      {/* door seams */}
      {layout !== "three" && (
        <mesh position={[0, h * 0.66, 0.345]} material={seam}>
          <boxGeometry args={[0.008, h * 0.62, 0.004]} />
        </mesh>
      )}
      <mesh position={[0, layout === "three" ? h * 0.62 : h * 0.36, 0.345]} material={seam}>
        <boxGeometry args={[width * 0.94, 0.008, 0.004]} />
      </mesh>
      {layout === "three" && (
        <mesh position={[0, h * 0.32, 0.345]} material={seam}>
          <boxGeometry args={[width * 0.94, 0.008, 0.004]} />
        </mesh>
      )}
      {layout === "cross" && (
        <mesh position={[0, h * 0.2, 0.345]} material={seam}>
          <boxGeometry args={[0.008, h * 0.3, 0.004]} />
        </mesh>
      )}
      {/* handles */}
      {[-width * 0.12, width * 0.12].map((x, i) => (
        <mesh key={i} position={[x, h * 0.72, 0.36]} material={aluDark}>
          <boxGeometry args={[0.02, 0.5, 0.02]} />
        </mesh>
      ))}
      {/* micro-chill display */}
      <mesh position={[-width * 0.28, h * 0.78, 0.348]} material={led}>
        <planeGeometry args={[0.09, 0.05]} />
      </mesh>
    </group>
  );
}

const FridgeFrench = (p: ModelProps) => <Fridge {...p} layout="french" />;
const FridgeCross = (p: ModelProps) => <Fridge {...p} layout="cross" />;
const FridgeThree = (p: ModelProps) => <Fridge {...p} width={0.78} layout="three" />;

/* ---------------------------------------------------------------- */
/* Cleaning                                                          */
/* ---------------------------------------------------------------- */

function VacuumStick({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group>
      {/* floor head */}
      <RoundedBox args={[0.3, 0.08, 0.2]} radius={0.03} position={[0, 0.05, 0.06]} material={graphite} />
      {/* pole */}
      <mesh position={[0, 0.62, 0]} rotation={[0.08, 0, 0]} material={alu}>
        <cylinderGeometry args={[0.018, 0.018, 1.1, 12]} />
      </mesh>
      {/* motor + cup */}
      <mesh position={[0, 1.2, 0.02]} rotation={[Math.PI / 2.4, 0, 0]} material={graphite}>
        <cylinderGeometry args={[0.07, 0.09, 0.24, 20]} />
      </mesh>
      <mesh position={[0, 1.08, 0.09]} rotation={[Math.PI / 2.4, 0, 0]} material={glass}>
        <cylinderGeometry args={[0.06, 0.06, 0.14, 20]} />
      </mesh>
      <mesh position={[0, 1.3, 0.09]} material={led}>
        <circleGeometry args={[0.02, 16]} />
      </mesh>
      {/* handle */}
      <mesh position={[0, 1.34, -0.05]} rotation={[1.2, 0, 0]} material={graphite}>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 10]} />
      </mesh>
    </group>
  );
}

function VacuumCar({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group>
      <mesh position={[0, 0.09, 0]} rotation={[0, 0, Math.PI / 2]} material={graphite}>
        <cylinderGeometry args={[0.05, 0.05, 0.24, 20]} />
      </mesh>
      <mesh position={[0.16, 0.09, 0]} rotation={[0, 0, Math.PI / 2]} material={dark}>
        <coneGeometry args={[0.03, 0.1, 16]} />
      </mesh>
      <mesh position={[-0.08, 0.145, 0]} material={led}>
        <circleGeometry args={[0.012, 12]} />
      </mesh>
    </group>
  );
}

function VacuumRobot({ accent }: ModelProps) {
  const turret = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (turret.current) turret.current.rotation.y += dt * 3;
  });
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group>
      <mesh position={[0, 0.05, 0]} material={white}>
        <cylinderGeometry args={[0.33, 0.33, 0.1, 40]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={dark}>
        <cylinderGeometry args={[0.335, 0.335, 0.03, 40]} />
      </mesh>
      <mesh ref={turret} position={[0, 0.13, 0]} material={graphite}>
        <cylinderGeometry args={[0.07, 0.08, 0.05, 24]} />
      </mesh>
      <mesh position={[0, 0.105, 0.2]} material={led}>
        <boxGeometry args={[0.1, 0.008, 0.02]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Entertainment                                                     */
/* ---------------------------------------------------------------- */

function MiniLedTv(_: ModelProps) {
  const tex = useMemo(() => screenTexture(), []);
  const screen = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (screen.current) {
      const m = screen.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.86 + Math.sin(clock.elapsedTime * 1.4) * 0.14;
      m.color.setScalar(pulse);
    }
  });
  return (
    <group>
      <RoundedBox args={[1.72, 0.99, 0.045]} radius={0.01} position={[0, 1.06, 0]} material={dark} />
      <mesh ref={screen} position={[0, 1.06, 0.026]}>
        <planeGeometry args={[1.66, 0.93]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.28, -0.02]} material={aluDark}>
        <boxGeometry args={[0.08, 0.56, 0.05]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={aluDark}>
        <cylinderGeometry args={[0.22, 0.26, 0.035, 32]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Air care                                                          */
/* ---------------------------------------------------------------- */

/** Purifier 6 — rounded-square white tower, circular display, perforated flanks. */
function PurifierTower({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  const h = 0.78;
  const w = 0.34;
  return (
    <group>
      <RoundedBox args={[w, h, w]} radius={0.06} position={[0, h / 2 + 0.03, 0]} material={white} />
      {/* perforated side intake panels */}
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[0.012, h * 0.82, w * 0.8]}
          radius={0.005}
          position={[s * (w / 2 + 0.002), h / 2 + 0.03, 0]}
          material={dark}
        />
      ))}
      {/* circular OLED display */}
      <mesh position={[0, h * 0.74, w / 2 + 0.003]} material={dark}>
        <circleGeometry args={[0.055, 28]} />
      </mesh>
      <mesh position={[0, h * 0.74, w / 2 + 0.004]} material={led}>
        <ringGeometry args={[0.038, 0.046, 28]} />
      </mesh>
      {/* top outlet */}
      <mesh position={[0, h + 0.032, 0]} material={dark}>
        <boxGeometry args={[w * 0.78, 0.015, w * 0.78]} />
      </mesh>
      {/* base */}
      <mesh position={[0, 0.02, 0]} material={dark}>
        <boxGeometry args={[w * 0.92, 0.04, w * 0.92]} />
      </mesh>
    </group>
  );
}

/** Purifier 4 Compact — small white cylinder with light ring. */
function PurifierCompact({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  const height = 0.48;
  const radius = 0.17;
  return (
    <group>
      <mesh position={[0, height / 2 + 0.02, 0]} material={white}>
        <cylinderGeometry args={[radius, radius * 1.04, height, 36]} />
      </mesh>
      <mesh position={[0, height * 0.3, 0]} material={dark}>
        <cylinderGeometry args={[radius * 1.005, radius * 1.045, height * 0.34, 36, 1, true]} />
      </mesh>
      <mesh position={[0, height + 0.02, 0]} material={dark}>
        <cylinderGeometry args={[radius * 0.82, radius * 0.82, 0.02, 36]} />
      </mesh>
      <mesh position={[0, height + 0.035, 0]} material={led}>
        <torusGeometry args={[radius * 0.6, 0.008, 10, 36]} />
      </mesh>
      <mesh position={[0, height * 0.72, radius + 0.002]} material={led}>
        <circleGeometry args={[0.028, 20]} />
      </mesh>
    </group>
  );
}

/** Smart Pet Fountain 2 — white two-tier water fountain with level window. */
function PetFountain({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group>
      <RoundedBox args={[0.27, 0.19, 0.25]} radius={0.045} position={[0, 0.115, 0]} material={white} />
      {/* raised top tier with dispenser */}
      <RoundedBox args={[0.2, 0.05, 0.17]} radius={0.02} position={[0, 0.235, -0.02]} material={offWhite} />
      <mesh position={[0, 0.262, -0.02]} material={dark}>
        <cylinderGeometry args={[0.012, 0.012, 0.01, 12]} />
      </mesh>
      {/* water level window */}
      <mesh position={[0, 0.1, 0.126]} material={darkGlass}>
        <planeGeometry args={[0.022, 0.1]} />
      </mesh>
      <mesh position={[0, 0.155, 0.126]} material={led}>
        <circleGeometry args={[0.006, 10]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Portable power                                                    */
/* ---------------------------------------------------------------- */

function PowerBank({ accent, thin = false, qi = false }: ModelProps & { thin?: boolean; qi?: boolean }) {
  const led = useMemo(() => accentMat(accent), [accent]);
  const phone = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (phone.current) {
      phone.current.position.y = 0.16 + Math.sin(clock.elapsedTime * 1.2) * 0.02;
    }
  });
  const d = thin ? 0.012 : 0.032;
  return (
    <group>
      <group rotation={[-0.5, 0, 0]} position={[0, 0.06, 0]}>
        <RoundedBox args={[0.16, d, 0.09]} radius={d / 2.4} material={graphite} />
        {qi && (
          <mesh position={[0, d / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} material={led}>
            <ringGeometry args={[0.025, 0.03, 28]} />
          </mesh>
        )}
        <mesh position={[0.055, d / 2 + 0.001, 0.028]} rotation={[-Math.PI / 2, 0, 0]} material={led}>
          <planeGeometry args={[0.028, 0.014]} />
        </mesh>
      </group>
      {qi && (
        <group ref={phone} position={[0, 0.16, 0]} rotation={[-0.5, 0, 0]}>
          <RoundedBox args={[0.075, 0.008, 0.15]} radius={0.004} material={dark} />
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.068, 0.14]} />
            <meshBasicMaterial color="#1c2f4a" toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}

const PowerBankStd = (p: ModelProps) => <PowerBank {...p} />;
const PowerBankQi = (p: ModelProps) => <PowerBank {...p} qi />;
const PowerBankThin = (p: ModelProps) => <PowerBank {...p} thin />;

/* ---------------------------------------------------------------- */
/* Lifestyle                                                         */
/* ---------------------------------------------------------------- */

function SmartPen({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group rotation={[0, 0, -0.5]} position={[0, 0.12, 0]}>
      <mesh material={dark}>
        <cylinderGeometry args={[0.009, 0.011, 0.15, 16]} />
      </mesh>
      <mesh position={[0, -0.087, 0]} material={aluDark}>
        <coneGeometry args={[0.008, 0.025, 16]} />
      </mesh>
      <mesh position={[0, 0.06, 0]} material={led}>
        <torusGeometry args={[0.011, 0.002, 8, 20]} />
      </mesh>
    </group>
  );
}

const duskGold = new THREE.MeshStandardMaterial({ color: "#d9bc9a", metalness: 0.85, roughness: 0.3 });

function HairDryer({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group position={[0, 0.1, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={duskGold}>
        <cylinderGeometry args={[0.045, 0.05, 0.16, 24]} />
      </mesh>
      <mesh position={[0.085, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={led}>
        <torusGeometry args={[0.038, 0.004, 10, 28]} />
      </mesh>
      <mesh position={[-0.03, -0.09, 0]} rotation={[0, 0, 0.15]} material={graphite}>
        <cylinderGeometry args={[0.018, 0.02, 0.13, 16]} />
      </mesh>
    </group>
  );
}

function Toothbrush({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group position={[0, 0.11, 0]}>
      <mesh material={white}>
        <capsuleGeometry args={[0.014, 0.14, 8, 16]} />
      </mesh>
      <mesh position={[0, 0.11, 0]} material={aluDark}>
        <cylinderGeometry args={[0.007, 0.01, 0.07, 12]} />
      </mesh>
      <mesh position={[0, 0.155, 0.006]} material={dark}>
        <boxGeometry args={[0.016, 0.045, 0.012]} />
      </mesh>
      <mesh position={[0, -0.02, 0.0145]} material={led}>
        <circleGeometry args={[0.006, 12]} />
      </mesh>
    </group>
  );
}

const parrotGreen = new THREE.MeshStandardMaterial({ color: "#2f5c46", metalness: 0.5, roughness: 0.35 });

function AiGlasses({ accent }: ModelProps) {
  const led = useMemo(() => accentMat(accent), [accent]);
  return (
    <group position={[0, 0.1, 0]}>
      {[-0.055, 0.055].map((x) => (
        <RoundedBox key={x} args={[0.09, 0.06, 0.012]} radius={0.02} position={[x, 0, 0]} material={parrotGreen} />
      ))}
      <mesh position={[0, 0.005, 0]} material={parrotGreen}>
        <boxGeometry args={[0.03, 0.01, 0.01]} />
      </mesh>
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.01, -0.07]} rotation={[0, i === 0 ? 0.15 : -0.15, 0]} material={parrotGreen}>
          <boxGeometry args={[0.008, 0.015, 0.15]} />
        </mesh>
      ))}
      <mesh position={[-0.095, 0.02, 0.007]} material={led}>
        <circleGeometry args={[0.006, 12]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Registry                                                          */
/* ---------------------------------------------------------------- */

export interface ModelEntry {
  Node: (props: ModelProps) => React.ReactNode;
  /** Exhibition display scale (small products are shown oversized). */
  displayScale: number;
  /** Height (m, pre-scale) the camera looks at when focused. */
  focusHeight: number;
  /** True → shown on a tall pedestal column. */
  pedestal: boolean;
}

export const MODEL_REGISTRY: Record<string, ModelEntry> = {
  "ac-vertical": { Node: AcVertical, displayScale: 1, focusHeight: 1.1, pedestal: false },
  "ac-split": { Node: AcSplit, displayScale: 1, focusHeight: 1.35, pedestal: false },
  "ac-wall": { Node: AcWall, displayScale: 1, focusHeight: 0, pedestal: false },
  washer: { Node: WasherGray, displayScale: 1, focusHeight: 0.55, pedestal: false },
  "washer-silver": { Node: WasherSilver, displayScale: 1, focusHeight: 0.55, pedestal: false },
  "washer-tower": { Node: WasherTower, displayScale: 1, focusHeight: 0.85, pedestal: false },
  "washer-mini": { Node: WasherMini, displayScale: 1, focusHeight: 0.42, pedestal: false },
  "fridge-french": { Node: FridgeFrench, displayScale: 1, focusHeight: 1.05, pedestal: false },
  "fridge-cross": { Node: FridgeCross, displayScale: 1, focusHeight: 1.05, pedestal: false },
  "fridge-threedoor": { Node: FridgeThree, displayScale: 1, focusHeight: 1.0, pedestal: false },
  "vacuum-stick": { Node: VacuumStick, displayScale: 1, focusHeight: 0.75, pedestal: false },
  "vacuum-car": { Node: VacuumCar, displayScale: 2.4, focusHeight: 0.12, pedestal: true },
  "vacuum-robot": { Node: VacuumRobot, displayScale: 1.4, focusHeight: 0.12, pedestal: false },
  tv: { Node: MiniLedTv, displayScale: 1, focusHeight: 1.05, pedestal: false },
  "purifier-tower": { Node: PurifierTower, displayScale: 1.15, focusHeight: 0.45, pedestal: false },
  "purifier-compact": { Node: PurifierCompact, displayScale: 1.15, focusHeight: 0.3, pedestal: false },
  powerbank: { Node: PowerBankStd, displayScale: 3.2, focusHeight: 0.08, pedestal: true },
  "powerbank-qi": { Node: PowerBankQi, displayScale: 3.2, focusHeight: 0.12, pedestal: true },
  "powerbank-thin": { Node: PowerBankThin, displayScale: 3.2, focusHeight: 0.07, pedestal: true },
  pen: { Node: SmartPen, displayScale: 3.6, focusHeight: 0.12, pedestal: true },
  petfountain: { Node: PetFountain, displayScale: 2.0, focusHeight: 0.14, pedestal: true },
  hairdryer: { Node: HairDryer, displayScale: 2.6, focusHeight: 0.1, pedestal: true },
  toothbrush: { Node: Toothbrush, displayScale: 2.8, focusHeight: 0.11, pedestal: true },
  glasses: { Node: AiGlasses, displayScale: 3.0, focusHeight: 0.1, pedestal: true },
};

export { AcWallUnit };

export function ProductModel({ model, accent }: { model: string; accent: string }) {
  const entry = MODEL_REGISTRY[model] ?? MODEL_REGISTRY["powerbank"];
  const { Node, displayScale } = entry;
  return (
    <group scale={displayScale}>
      <Node accent={accent} />
    </group>
  );
}
