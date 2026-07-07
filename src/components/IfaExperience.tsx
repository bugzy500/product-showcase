"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { timeline, allProducts } from "@/src/lib/content";
import {
  messeSignTexture,
  ifaBannerTexture,
  adPanelTexture,
  hallSignTexture,
  ifaFloorMapTexture,
} from "@/src/lib/textures";
import { ProductModel } from "./models";
import { Crowd } from "./Crowd";

/* Shared materials (dark premium plaza with a lit stone facade). */
const stoneMat = new THREE.MeshStandardMaterial({ color: "#9a9488", roughness: 0.88, metalness: 0.05 });
const plinthMat = new THREE.MeshStandardMaterial({ color: "#15171e", roughness: 0.5, metalness: 0.4 });
const letterMat = new THREE.MeshStandardMaterial({ color: "#f3f3f0", roughness: 0.45, metalness: 0.05 });
const poleMat = new THREE.MeshStandardMaterial({ color: "#9aa0a8", metalness: 0.8, roughness: 0.35 });
const boothMat = new THREE.MeshStandardMaterial({ color: "#20242e", roughness: 0.55, metalness: 0.3 });
const wallMat = new THREE.MeshStandardMaterial({ color: "#0b0d13", roughness: 0.7, metalness: 0.2 });

const PLINTH_SQUARES = ["#1565c0", "#ffd600", "#e0359c", "#43a047", "#f57c00", "#33c9dc", "#8e24aa", "#e53935"];
const FLAG_COLORS = ["#43a047", "#ffd600", "#00897b", "#1565c0", "#f57c00"];

/** Giant white "IFA" block letters built from primitives. */
function IfaLetters() {
  return (
    <group position={[0, 1.0, 0]}>
      {/* I */}
      <mesh material={letterMat} position={[-2.3, 1.7, 0]}>
        <boxGeometry args={[0.62, 3.4, 0.62]} />
      </mesh>
      {/* F */}
      <mesh material={letterMat} position={[-0.75, 1.7, 0]}>
        <boxGeometry args={[0.6, 3.4, 0.62]} />
      </mesh>
      <mesh material={letterMat} position={[-0.05, 3.15, 0]}>
        <boxGeometry args={[1.5, 0.58, 0.62]} />
      </mesh>
      <mesh material={letterMat} position={[-0.15, 1.75, 0]}>
        <boxGeometry args={[1.2, 0.52, 0.62]} />
      </mesh>
      {/* A */}
      <mesh material={letterMat} position={[1.55, 1.7, 0]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[0.56, 3.5, 0.62]} />
      </mesh>
      <mesh material={letterMat} position={[2.55, 1.7, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[0.56, 3.5, 0.62]} />
      </mesh>
      <mesh material={letterMat} position={[2.05, 1.5, 0]}>
        <boxGeometry args={[1.05, 0.5, 0.62]} />
      </mesh>
    </group>
  );
}

/** Stepped plinth studded with the IFA colour squares. */
function Plinth() {
  return (
    <group>
      <mesh material={plinthMat} position={[0, 0.25, 0]}>
        <boxGeometry args={[7.4, 0.5, 3.2]} />
      </mesh>
      <mesh material={plinthMat} position={[0, 0.75, 0]}>
        <boxGeometry args={[5.8, 0.5, 2.5]} />
      </mesh>
      {/* colour squares along the front faces of both steps */}
      {[0.25, 0.75].map((y, row) =>
        PLINTH_SQUARES.map((c, i) => (
          <mesh
            key={`${row}-${i}`}
            position={[(i - (PLINTH_SQUARES.length - 1) / 2) * 0.62, y, (row === 0 ? 3.2 : 2.5) / 2 + 0.01]}
          >
            <planeGeometry args={[0.42, 0.42]} />
            <meshBasicMaterial color={c} toneMapped={false} />
          </mesh>
        ))
      )}
    </group>
  );
}

/** The Messe Berlin facade with a central entrance and rooftop lettering. */
function Facade({ banner, dates }: { banner: string; dates: string }) {
  const signTex = useMemo(() => messeSignTexture("MESSE BERLIN"), []);
  const bannerTex = useMemo(() => ifaBannerTexture(banner, dates), [banner, dates]);
  return (
    <group position={[0, 0, -11]}>
      {/* wall segments leaving a central opening */}
      <mesh material={stoneMat} position={[-7.25, 4.5, 0]}>
        <boxGeometry args={[7.5, 9, 0.6]} />
      </mesh>
      <mesh material={stoneMat} position={[7.25, 4.5, 0]}>
        <boxGeometry args={[7.5, 9, 0.6]} />
      </mesh>
      <mesh material={stoneMat} position={[0, 7.85, 0]}>
        <boxGeometry args={[7.5, 2.3, 0.6]} />
      </mesh>
      {/* rooftop MESSE BERLIN sign */}
      <mesh position={[0, 9.7, 0.35]}>
        <planeGeometry args={[13, 1.7]} />
        <meshBasicMaterial map={signTex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      {/* hero banner on the left wall face */}
      <mesh position={[-7.25, 4.7, 0.32]}>
        <planeGeometry args={[5.4, 3.2]} />
        <meshBasicMaterial map={bannerTex} toneMapped={false} />
      </mesh>
      {/* entrance jamb banners flanking the opening */}
      {[-3.4, 3.4].map((x) => (
        <mesh key={x} position={[x, 3, 0.32]}>
          <planeGeometry args={[0.9, 5]} />
          <meshBasicMaterial color="#ff6900" transparent opacity={0.5} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Two rows of flags lining the plaza walkway. */
function Flags() {
  const rows = [-6, 6];
  const zs = [6, 3, 0];
  return (
    <group>
      {rows.map((x) =>
        zs.map((z, i) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <mesh material={poleMat} position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 5, 8]} />
            </mesh>
            <mesh position={[x > 0 ? -0.65 : 0.65, 4.1, 0]} rotation={[0, x > 0 ? 0.1 : -0.1, 0]}>
              <planeGeometry args={[1.2, 0.8]} />
              <meshStandardMaterial
                color={FLAG_COLORS[(i + (x > 0 ? 2 : 0)) % FLAG_COLORS.length]}
                side={THREE.DoubleSide}
                roughness={0.8}
              />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}

/** Digital advertising towers flanking the plaza. */
function AdTowers({ accent }: { accent: string }) {
  const texA = useMemo(() => adPanelTexture("IFA 2026", "Innovation for all", accent), [accent]);
  const texB = useMemo(() => adPanelTexture("XIAOMI", "Smarter Living", "#5ec8f2"), []);
  const towers = useMemo(
    () => [
      { x: -8.5, tex: texA },
      { x: 8.5, tex: texB },
    ],
    [texA, texB]
  );
  return (
    <group>
      {towers.map((t) => (
        <group key={t.x} position={[t.x, 0, 4]}>
          <mesh material={boothMat} position={[0, 2.6, 0]}>
            <boxGeometry args={[1.3, 5.2, 0.7]} />
          </mesh>
          <mesh position={[0, 2.7, 0.37]}>
            <planeGeometry args={[1.15, 4.6]} />
            <meshBasicMaterial map={t.tex} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Illuminated floor map with animated visitor dots. */
function FloorMap({ zones, accent }: { zones: { name: string; color: string }[]; accent: string }) {
  const mapTex = useMemo(() => ifaFloorMapTexture(zones), [zones]);
  const dots = useRef<THREE.Group>(null);
  const seeds = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({ z: (i / 9 - 0.5) * 5.5, spd: 0.4 + (i % 3) * 0.25, off: i * 0.7 })),
    []
  );
  useFrame(({ clock }) => {
    if (!dots.current) return;
    const t = clock.elapsedTime;
    dots.current.children.forEach((d, i) => {
      const s = seeds[i];
      const x = (((t * s.spd + s.off) % 1) - 0.5) * 12;
      d.position.set(x, 0.12, 6.5 + s.z);
    });
  });
  return (
    <group>
      <mesh position={[0, 0.06, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 6.5]} />
        <meshBasicMaterial map={mapTex} toneMapped={false} />
      </mesh>
      <group ref={dots}>
        {seeds.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshBasicMaterial color={accent} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** One representative exhibition hall (LED wall + booths + product demo). */
function Hall({
  hall,
  position,
  rotationY,
}: {
  hall: { id: string; name: string; color: string; sign: string; products: string[] };
  position: [number, number, number];
  rotationY: number;
}) {
  const ledTex = useMemo(() => hallSignTexture(hall.name, hall.sign, hall.color), [hall]);
  const products = useMemo(
    () => hall.products.map((id) => allProducts.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p),
    [hall]
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* LED wall */}
      <mesh position={[0, 3, 0]}>
        <planeGeometry args={[6.4, 3.2]} />
        <meshBasicMaterial map={ledTex} toneMapped={false} />
      </mesh>
      {/* floor accent */}
      <mesh position={[0, 0.03, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 6]} />
        <meshBasicMaterial color={hall.color} transparent opacity={0.16} toneMapped={false} />
      </mesh>
      {/* booths */}
      {[-2, 2].map((x) => (
        <mesh key={x} material={boothMat} position={[x, 0.6, 3.4]}>
          <boxGeometry args={[1.3, 1.2, 1.3]} />
        </mesh>
      ))}
      {/* hanging banner */}
      <mesh position={[0, 5, 0.4]}>
        <planeGeometry args={[1.1, 2]} />
        <meshBasicMaterial color={hall.color} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      {/* product demo plinths */}
      {products.map((p, i) => {
        const x = (i - (products.length - 1) / 2) * 2.4;
        return (
          <group key={p.id} position={[x, 0, 2]}>
            <mesh material={plinthMat} position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.6, 0.65, 0.8, 24]} />
            </mesh>
            <group position={[0, 0.82, 0]}>
              <ProductModel model={p.model} accent={hall.color} />
            </group>
          </group>
        );
      })}
      <pointLight position={[0, 4, 3]} color={hall.color} distance={12} intensity={2.2} />
    </group>
  );
}

/** The interior exhibition space behind the facade. */
function HallInterior({ halls }: { halls: { id: string; name: string; color: string; sign: string; products: string[] }[] }) {
  return (
    <group>
      {/* interior floor */}
      <mesh position={[0, 0.02, -17]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 14]} />
        <meshStandardMaterial color="#0a0c12" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* side + back walls */}
      <mesh material={wallMat} position={[-10.6, 4, -17]}>
        <boxGeometry args={[0.4, 8, 13]} />
      </mesh>
      <mesh material={wallMat} position={[10.6, 4, -17]}>
        <boxGeometry args={[0.4, 8, 13]} />
      </mesh>
      <mesh material={wallMat} position={[0, 4, -23.4]}>
        <boxGeometry args={[21.6, 8, 0.4]} />
      </mesh>
      {/* ceiling accent strips */}
      {[-14, -18, -22].map((z) => (
        <mesh key={z} position={[0, 7.6, z]}>
          <boxGeometry args={[18, 0.06, 0.06]} />
          <meshBasicMaterial color="#ff8a3c" toneMapped={false} />
        </mesh>
      ))}
      {/* three halls: left wall, right wall, back wall */}
      {halls[0] && <Hall hall={halls[0]} position={[-10.2, 0, -14.5]} rotationY={Math.PI / 2} />}
      {halls[1] && <Hall hall={halls[1]} position={[10.2, 0, -17.5]} rotationY={-Math.PI / 2} />}
      {halls[2] && <Hall hall={halls[2]} position={[0, 0, -22.9]} rotationY={0} />}
      <Crowd count={22} width={16} depth={9} position={[0, 0, -16]} speed={0.45} />
    </group>
  );
}

/**
 * Cinematic IFA Berlin recreation (CR-01): Messe Berlin facade + entrance
 * plaza (IFA letters, flags, ad towers, crowd), an illuminated floor map,
 * and live exhibition halls behind the facade. Laid out in the ms2 bay's
 * local frame; the ms2 camera flythrough travels arrival → plaza → floor
 * map → hall → rise.
 */
export function IfaExperience({ index, accent }: { index: number; accent: string }) {
  const ifa = timeline!.milestones[index].ifa;
  if (!ifa) return null;
  return (
    <group>
      <Facade banner={ifa.banner} dates={ifa.dates} />
      <group position={[0, 0, -4.5]}>
        <Plinth />
        <IfaLetters />
      </group>
      <Flags />
      <AdTowers accent={accent} />
      <FloorMap zones={ifa.zones} accent={accent} />
      <Crowd count={24} width={15} depth={9} position={[0, 0, 2]} speed={0.5} />
      <HallInterior halls={ifa.halls} />
      {/* plaza key lights */}
      <pointLight position={[0, 6, 2]} color="#fff2e0" distance={26} intensity={2.4} />
      <pointLight position={[0, 5, -5]} color={accent} distance={22} intensity={2} />
    </group>
  );
}
