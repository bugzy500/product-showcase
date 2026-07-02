"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { allProducts, amazonProducts, content } from "@/src/lib/content";
import { liveState } from "@/src/lib/store";
import { FINALE_Z, finaleSlots, localT, segment, clamp01 } from "@/src/lib/timeline";
import { ledTextTexture } from "@/src/lib/textures";
import { ProductModel } from "./models";

const smooth = (t: number) => t * t * (3 - 2 * t);

const floorMat = new THREE.MeshStandardMaterial({ color: "#191b22", roughness: 0.2, metalness: 0.6 });
const ringMat = new THREE.MeshStandardMaterial({ color: "#e9eaed", roughness: 0.35, metalness: 0.2 });

/** Where each highlighted product lines up in front of the camera before the Amazon page. */
function gridTarget(i: number): THREE.Vector3 {
  const cols = 4;
  const row = Math.floor(i / cols);
  const inRow = Math.min(cols, amazonProducts.length - row * cols);
  const col = i % cols;
  return new THREE.Vector3(
    (col - (inRow - 1) / 2) * 2.4,
    1.5 + row * 1.6,
    FINALE_Z + 9.5
  );
}

function FlyingProduct({ index }: { index: number }) {
  const p = allProducts[index];
  const slot = finaleSlots[index];
  const group = useRef<THREE.Group>(null);
  const amazonIndex = useMemo(
    () => amazonProducts.findIndex((a) => a.id === p.id),
    [p.id]
  );
  const grid = useMemo(
    () => (amazonIndex >= 0 ? gridTarget(amazonIndex) : null),
    [amazonIndex]
  );
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const prog = liveState.smoothProgress;
    const ft = localT(prog, segment("finale"));
    const amT = localT(prog, segment("amazon"));

    const flight = smooth(clamp01((ft - 0.06 - slot.delay * 0.3) / 0.55));
    tmp.copy(slot.start).lerp(slot.target, flight);
    tmp.y += Math.sin(flight * Math.PI) * (slot.big ? 1.4 : 2.4);

    let scale = THREE.MathUtils.lerp(1, slot.scale, flight);
    let rotY = THREE.MathUtils.lerp(0, slot.rotationY, flight);

    if (amT > 0) {
      if (grid) {
        const toGrid = smooth(clamp01(amT / 0.5));
        tmp.lerp(grid, toGrid);
        rotY = THREE.MathUtils.lerp(rotY, 0, toGrid);
        const absorb = smooth(clamp01((amT - 0.55) / 0.35));
        scale = THREE.MathUtils.lerp(scale, slot.big ? 0.5 : 1.1, toGrid) * (1 - absorb);
      } else {
        tmp.y -= smooth(amT) * 1.2;
        scale *= 1 - amT * 0.4;
      }
    }

    g.position.copy(tmp);
    g.rotation.y = rotY;
    g.scale.setScalar(Math.max(scale, 0.0001));
    g.visible = flight > 0.001 && scale > 0.002;
  });

  return (
    <group ref={group} visible={false}>
      <ProductModel model={p.model} accent={p.accent} />
    </group>
  );
}

export function FinaleScene() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const coreLight = useRef<THREE.PointLight>(null);
  const panelMats = useRef<THREE.MeshBasicMaterial[]>([]);

  const panelTex = useMemo(
    () =>
      ledTextTexture(content.finale.title, {
        width: 1536,
        height: 512,
        sub: content.finale.tagline,
        font: "700 104px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }),
    []
  );

  useFrame(({ clock }) => {
    const prog = liveState.smoothProgress;
    const f = segment("finale");
    if (group.current) {
      group.current.visible = prog > f.start - 0.1;
      if (!group.current.visible) return;
    }
    const ft = smooth(localT(prog, f));
    const t = clock.elapsedTime;
    if (core.current) {
      core.current.rotation.y = t * 0.4;
      const m = core.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.75 + Math.sin(t * 2.2) * 0.25;
      m.opacity = (0.25 + ft * 0.75) * pulse;
      core.current.scale.setScalar(0.8 + ft * 0.3 + Math.sin(t * 2.2) * 0.03);
    }
    if (ringA.current) ringA.current.rotation.z = t * 0.3;
    if (ringB.current) ringB.current.rotation.z = -t * 0.22;
    if (coreLight.current) coreLight.current.intensity = ft * 5.5;
    panelMats.current.forEach((m) => (m.opacity = 0.15 + ft * 0.85));
  });

  return (
    <group ref={group} visible={false}>
      {/* rotunda floor */}
      <mesh position={[0, 0.01, FINALE_Z]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <circleGeometry args={[14.5, 64]} />
      </mesh>
      <mesh position={[0, 0.02, FINALE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.0, 9.2, 80]} />
        <meshBasicMaterial color="#ff6900" transparent opacity={0.6} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, FINALE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.0, 5.1, 64]} />
        <meshBasicMaterial color="#5ec8f2" transparent opacity={0.4} toneMapped={false} />
      </mesh>

      {/* ecosystem core */}
      <mesh position={[0, 0.35, FINALE_Z]} material={ringMat}>
        <cylinderGeometry args={[1.1, 1.3, 0.7, 40]} />
      </mesh>
      <mesh ref={core} position={[0, 2.1, FINALE_Z]}>
        <icosahedronGeometry args={[0.75, 1]} />
        <meshBasicMaterial color="#ff7a1a" transparent opacity={0.3} toneMapped={false} wireframe />
      </mesh>
      <mesh ref={ringA} position={[0, 2.1, FINALE_Z]}>
        <torusGeometry args={[1.35, 0.02, 10, 60]} />
        <meshBasicMaterial color="#ffb46a" toneMapped={false} />
      </mesh>
      <mesh ref={ringB} position={[0, 2.1, FINALE_Z]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.7, 0.015, 10, 60]} />
        <meshBasicMaterial color="#5ec8f2" toneMapped={false} />
      </mesh>
      <pointLight ref={coreLight} position={[0, 3, FINALE_Z]} color="#ff8c33" distance={26} intensity={0} />
      <pointLight position={[-11, 6, FINALE_Z + 6]} color="#bcd9f5" distance={30} intensity={1.6} />
      <pointLight position={[11, 6, FINALE_Z - 6]} color="#ffd9b0" distance={30} intensity={1.6} />

      {/* LED screens around the rotunda */}
      {[Math.PI * 0.5, Math.PI * 1.05, Math.PI * 1.95].map((ang, i) => (
        <mesh
          key={i}
          position={[Math.sin(ang) * 13, 3.9, FINALE_Z + Math.cos(ang) * 13]}
          rotation={[0, ang + Math.PI, 0]}
        >
          <planeGeometry args={[8, 2.7]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) panelMats.current[i] = m;
            }}
            map={panelTex}
            transparent
            opacity={0.15}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* the ecosystem itself */}
      {allProducts.map((_, i) => (
        <FlyingProduct key={allProducts[i].id} index={i} />
      ))}
    </group>
  );
}
