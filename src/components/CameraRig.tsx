"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { liveState, useExperience } from "@/src/lib/store";
import { sampleCamera, slotForProduct } from "@/src/lib/timeline";
import { allProducts } from "@/src/lib/content";
import { MODEL_REGISTRY } from "./models";

const BIG_FOCUS_DISTANCE = 3.4;
const SMALL_FOCUS_DISTANCE = 1.6;

export function CameraRig() {
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const focusPos = useMemo(() => new THREE.Vector3(), []);
  const focusLook = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const blend = useRef({ value: 0 });
  const focus = useExperience((s) => s.focus);

  useEffect(() => {
    gsap.to(blend.current, {
      value: focus ? 1 : 0,
      duration: 1.25,
      ease: "power3.inOut",
    });
  }, [focus]);

  // keep the focus camera target up to date
  useEffect(() => {
    if (!focus) return;
    const product = allProducts.find(
      (p) => p.zoneIndex === focus.zone && p.productIndex === focus.product
    );
    if (!product) return;
    const slot = slotForProduct(focus.zone, focus.product);
    const entry = MODEL_REGISTRY[product.model] ?? MODEL_REGISTRY["powerbank"];
    const baseY = entry.pedestal ? 1.0 : 0.14;
    focusLook.copy(slot.position);
    focusLook.y = baseY + entry.focusHeight * entry.displayScale;

    // stand between the product and the hall centre line, slightly off-axis
    dir.set(-slot.position.x, 0, 0).normalize();
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.45);
    const distance = entry.pedestal ? SMALL_FOCUS_DISTANCE : BIG_FOCUS_DISTANCE;
    focusPos.copy(focusLook).addScaledVector(dir, distance);
    focusPos.y = focusLook.y + (entry.pedestal ? 0.15 : 0.45);

    // pan right so the product sits left of the info panel
    const lookDir = focusLook.clone().sub(focusPos).normalize();
    const right = lookDir.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    focusLook.addScaledVector(right, entry.pedestal ? 0.3 : 0.7);
  }, [focus, focusLook, focusPos, dir]);

  useFrame(({ camera, clock }, dt) => {
    const raw = useExperience.getState().progress;
    liveState.smoothProgress = THREE.MathUtils.damp(
      liveState.smoothProgress,
      raw,
      3.2,
      dt
    );

    sampleCamera(liveState.smoothProgress, pos, look);

    // subtle handheld sway for realism
    const t = clock.elapsedTime;
    const sway = 1 - blend.current.value;
    pos.x += Math.sin(t * 0.5) * 0.05 * sway;
    pos.y += Math.sin(t * 0.83) * 0.03 * sway;
    look.y += Math.sin(t * 0.62) * 0.02 * sway;

    if (blend.current.value > 0.0001) {
      pos.lerp(focusPos, blend.current.value);
      look.lerp(focusLook, blend.current.value);
    }

    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}
