"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import type { FlatProduct } from "@/src/lib/content";
import { liveState, useExperience } from "@/src/lib/store";
import { zoneActivity, type Slot } from "@/src/lib/timeline";
import { labelTexture, blobShadowTexture } from "@/src/lib/textures";
import { MODEL_REGISTRY, ProductModel } from "./models";

const pedestalMat = new THREE.MeshStandardMaterial({ color: "#f2f3f5", roughness: 0.35, metalness: 0.15 });
const pedestalTopMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.25, metalness: 0.1 });

const shadowTexCache: { tex: THREE.Texture | null } = { tex: null };

export function ProductDisplay({
  product,
  slot,
}: {
  product: FlatProduct;
  slot: Slot;
}) {
  const setFocus = useExperience((s) => s.setFocus);
  const [hovered, setHovered] = useState(false);
  const entry = MODEL_REGISTRY[product.model] ?? MODEL_REGISTRY["powerbank"];
  const spinner = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const label = useRef<THREE.Mesh>(null);

  const labelTex = useMemo(
    () => labelTexture(product.shortName, product.accent),
    [product.shortName, product.accent]
  );
  const shadowTex = useMemo(() => {
    if (!shadowTexCache.tex) shadowTexCache.tex = blobShadowTexture();
    return shadowTexCache.tex;
  }, []);

  const baseY = entry.pedestal ? 1.0 : 0.14;
  const focusedNow = () => {
    const f = useExperience.getState().focus;
    return !!f && f.zone === product.zoneIndex && f.product === product.productIndex;
  };

  useFrame((_, dt) => {
    const focused = focusedNow();
    if (spinner.current) {
      if (focused) {
        liveState.spin += (liveState.spinVelocity + 0.25) * dt;
        liveState.spinVelocity *= Math.pow(0.02, dt); // friction on drag momentum
        spinner.current.rotation.y = slot.rotationY + liveState.spin;
      } else {
        // ease back to the exhibition pose
        spinner.current.rotation.y +=
          (slot.rotationY - spinner.current.rotation.y) * Math.min(1, dt * 4);
      }
    }
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      const target = focused ? 0.9 : hovered ? 0.7 : 0.22;
      m.opacity += (target - m.opacity) * Math.min(1, dt * 8);
    }
    if (label.current) {
      const a = zoneActivity(liveState.smoothProgress, product.zoneIndex);
      (label.current.material as THREE.MeshBasicMaterial).opacity =
        (hovered ? 1 : 0.75) * a * (focused ? 0 : 1);
    }
  });

  const labelY =
    baseY + entry.focusHeight * entry.displayScale + (entry.pedestal ? 0.55 : 1.15);

  return (
    <group position={slot.position}>
      {/* pedestal */}
      {entry.pedestal ? (
        <group>
          <mesh position={[0, 0.5, 0]} material={pedestalMat}>
            <cylinderGeometry args={[0.32, 0.36, 1.0, 28]} />
          </mesh>
          <mesh position={[0, 1.0, 0]} material={pedestalTopMat}>
            <cylinderGeometry args={[0.36, 0.36, 0.03, 28]} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, 0.14, 0]} material={pedestalTopMat}>
          <cylinderGeometry args={[1.05, 1.1, 0.025, 36]} />
        </mesh>
      )}

      {/* accent ring */}
      <mesh
        ref={ring}
        position={[0, entry.pedestal ? 1.02 : 0.16, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={entry.pedestal ? [0.38, 0.42, 40] : [1.12, 1.2, 48]} />
        <meshBasicMaterial color={product.accent} transparent opacity={0.22} toneMapped={false} />
      </mesh>

      {/* soft shadow */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>

      {/* the product itself (click target) */}
      <group
        ref={spinner}
        position={[0, baseY, 0]}
        rotation={[0, slot.rotationY, 0]}
        onClick={(e) => {
          e.stopPropagation();
          liveState.spin = 0;
          liveState.spinVelocity = 0;
          setFocus({ zone: product.zoneIndex, product: product.productIndex });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <ProductModel model={product.model} accent={product.accent} />
      </group>

      {/* floating name chip */}
      <Billboard position={[0, labelY, 0]}>
        <mesh ref={label}>
          <planeGeometry args={[1.5, 0.375]} />
          <meshBasicMaterial map={labelTex} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}
