import * as THREE from "three";
import { content, allProducts } from "./content";

/* ------------------------------------------------------------------ */
/* World layout constants                                              */
/* ------------------------------------------------------------------ */

export const HALL_HALF_WIDTH = 11;
export const CEILING_HEIGHT = 7.6;
export const DOOR_Z = 16;
export const ZONE0_Z = -22;
export const ZONE_SPACING = 21;
/** Centre line of each zone's display platform. */
export const PLATFORM_X = 7.2;
/** Zone LED/backdrop wall. */
export const BACKDROP_X = 10.6;
export const FINALE_Z = ZONE0_Z - content.zones.length * ZONE_SPACING - 28; // rotunda centre
export const HALL_END_Z = FINALE_Z + 18; // walls stop, rotunda opens
export const TOTAL_SCROLL_VH = 1750;

export const zoneCenterZ = (i: number) => ZONE0_Z - i * ZONE_SPACING;
export const zoneSide = (i: number) => (i % 2 === 0 ? -1 : 1);

/* ------------------------------------------------------------------ */
/* Progress segments                                                   */
/* ------------------------------------------------------------------ */

export interface Segment {
  id: string;
  start: number;
  end: number;
}

const weights: Array<[string, number]> = [
  ["arrival", 1.5],
  ...content.zones.map((z): [string, number] => [z.id, 1]),
  ["finale", 1.7],
  ["amazon", 1.1],
];

const totalWeight = weights.reduce((a, [, w]) => a + w, 0);

export const segments: Segment[] = (() => {
  const list: Segment[] = [];
  let acc = 0;
  for (const [id, w] of weights) {
    list.push({ id, start: acc / totalWeight, end: (acc + w) / totalWeight });
    acc += w;
  }
  return list;
})();

export const segment = (id: string): Segment =>
  segments.find((s) => s.id === id)!;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Local 0..1 progress inside a segment (clamped). */
export const localT = (p: number, seg: Segment) =>
  clamp01((p - seg.start) / (seg.end - seg.start));

export const zoneSegment = (i: number) => segments[i + 1];

/** Index of the zone whose segment contains p, or -1. */
export function activeZoneIndex(p: number): number {
  for (let i = 0; i < content.zones.length; i++) {
    const s = zoneSegment(i);
    if (p >= s.start && p < s.end) return i;
  }
  return -1;
}

/* ------------------------------------------------------------------ */
/* Product slots                                                       */
/* ------------------------------------------------------------------ */

export interface Slot {
  position: THREE.Vector3;
  rotationY: number;
}

export function productSlots(zoneIndex: number): Slot[] {
  const zone = content.zones[zoneIndex];
  const side = zoneSide(zoneIndex);
  const zc = zoneCenterZ(zoneIndex);
  const n = zone.products.length;
  const spacing = n > 4 ? 2.9 : 3.3;
  return zone.products.map((_, j) => ({
    position: new THREE.Vector3(
      side * PLATFORM_X,
      0,
      zc + ((n - 1) / 2 - j) * spacing
    ),
    rotationY: side > 0 ? -Math.PI / 2 : Math.PI / 2,
  }));
}

export const slotForProduct = (zoneIndex: number, productIndex: number) =>
  productSlots(zoneIndex)[productIndex];

/* ------------------------------------------------------------------ */
/* Finale formation                                                    */
/* ------------------------------------------------------------------ */

const BIG_MODELS = new Set([
  "ac-vertical",
  "ac-split",
  "washer",
  "washer-tower",
  "washer-mini",
  "fridge-french",
  "fridge-cross",
  "fridge-threedoor",
  "tv",
  "purifier-tower",
]);

export interface FinaleSlot {
  start: THREE.Vector3;
  target: THREE.Vector3;
  rotationY: number;
  scale: number;
  delay: number; // 0..1 stagger offset
  big: boolean;
}

export const finaleSlots: FinaleSlot[] = (() => {
  const bigs = allProducts.filter((p) => BIG_MODELS.has(p.model));
  const smalls = allProducts.filter((p) => !BIG_MODELS.has(p.model));
  const map = new Map<string, FinaleSlot>();

  const place = (
    list: typeof allProducts,
    radius: number,
    y: number,
    scale: number,
    big: boolean
  ) => {
    list.forEach((p, i) => {
      const angle = (i / list.length) * Math.PI * 2 + Math.PI / list.length;
      const slot = slotForProduct(p.zoneIndex, p.productIndex);
      map.set(p.id, {
        start: slot.position.clone().add(new THREE.Vector3(0, 0.4, 0)),
        target: new THREE.Vector3(
          Math.sin(angle) * radius,
          y + (big ? 0 : Math.sin(i * 2.7) * 0.5),
          FINALE_Z + Math.cos(angle) * radius
        ),
        rotationY: Math.atan2(Math.sin(angle), Math.cos(angle)) + Math.PI,
        scale,
        delay: (i % 7) / 7,
        big,
      });
    });
  };

  place(bigs, 7.4, 0, 0.62, true);
  place(smalls, 4.2, 1.7, 1.15, false);

  return allProducts.map((p) => map.get(p.id)!);
})();

/* ------------------------------------------------------------------ */
/* Camera path                                                         */
/* ------------------------------------------------------------------ */

interface CamKey {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
}

const camKeys: CamKey[] = (() => {
  const keys: CamKey[] = [];
  const a = segment("arrival");
  const aw = a.end - a.start;
  keys.push(
    { p: 0, pos: [0, 3.4, 60], look: [0, 7.5, 14] },
    { p: a.start + aw * 0.35, pos: [0, 2.7, 42], look: [0, 6.5, 12] },
    { p: a.start + aw * 0.6, pos: [0, 2.2, 27], look: [0, 3.6, 8] },
    { p: a.start + aw * 0.82, pos: [0, 2.0, 13], look: [0, 2.6, -8] },
    { p: a.end, pos: [0, 2.0, -2], look: [0, 2.4, -28] }
  );

  content.zones.forEach((_, i) => {
    const s = zoneSegment(i);
    const w = s.end - s.start;
    const side = zoneSide(i);
    const zc = zoneCenterZ(i);
    keys.push(
      {
        p: s.start + w * 0.12,
        pos: [-side * 1.6, 2.05, zc + 11.5],
        look: [side * 5.2, 2.0, zc + 2.5],
      },
      {
        p: s.start + w * 0.42,
        pos: [side * 1.7, 2.1, zc + 2.4],
        look: [side * 7.1, 1.4, zc - 0.5],
      },
      {
        p: s.start + w * 0.68,
        pos: [side * 1.3, 2.1, zc - 2.8],
        look: [side * 6.9, 1.3, zc - 2.4],
      },
      {
        p: s.start + w * 0.9,
        pos: [side * 1.2, 2.0, zc - 7.5],
        look: [-side * 2.8, 2.0, zc - 18],
      }
    );
  });

  // glide toward the rotunda entrance; the finale itself orbits procedurally
  const f = segment("finale");
  keys.push({
    p: f.start,
    pos: [0, 2.2, FINALE_Z + 11],
    look: [0, 2.4, FINALE_Z],
  });
  return keys;
})();

const FINALE_ORBIT_SWEEP = Math.PI * 1.66;

function orbitPose(t: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const angle = t * FINALE_ORBIT_SWEEP;
  const radius = 11 - t * 1.2;
  pos.set(
    Math.sin(angle) * radius,
    2.2 + t * 2.4,
    FINALE_Z + Math.cos(angle) * radius
  );
  look.set(0, 2.0 + t * 0.6, FINALE_Z);
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

const _oEnd = { pos: new THREE.Vector3(), look: new THREE.Vector3() };

/**
 * Sample the walkthrough camera at progress p. Writes into pos/look.
 * Covers the keyframed walk, the procedural finale orbit and the
 * Amazon pull-back.
 */
export function sampleCamera(
  p: number,
  pos: THREE.Vector3,
  look: THREE.Vector3
) {
  const f = segment("finale");
  const am = segment("amazon");

  if (p >= am.start) {
    const t = smooth(localT(p, am));
    orbitPose(1, _oEnd.pos, _oEnd.look);
    pos.copy(_oEnd.pos).lerp(new THREE.Vector3(0, 3.0, FINALE_Z + 16), t);
    look.copy(_oEnd.look).lerp(new THREE.Vector3(0, 2.6, FINALE_Z), t);
    return;
  }

  if (p >= f.start) {
    orbitPose(smooth(localT(p, f)) * 0.999, pos, look);
    return;
  }

  const keys = camKeys;
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].p < p) i++;
  const k1 = keys[i];
  const k2 = keys[Math.min(i + 1, keys.length - 1)];
  const k0 = keys[Math.max(i - 1, 0)];
  const k3 = keys[Math.min(i + 2, keys.length - 1)];
  const span = Math.max(k2.p - k1.p, 1e-5);
  const t = clamp01((p - k1.p) / span);

  pos.set(
    catmull(k0.pos[0], k1.pos[0], k2.pos[0], k3.pos[0], t),
    catmull(k0.pos[1], k1.pos[1], k2.pos[1], k3.pos[1], t),
    catmull(k0.pos[2], k1.pos[2], k2.pos[2], k3.pos[2], t)
  );
  const st = smooth(t);
  look.set(
    k1.look[0] + (k2.look[0] - k1.look[0]) * st,
    k1.look[1] + (k2.look[1] - k1.look[1]) * st,
    k1.look[2] + (k2.look[2] - k1.look[2]) * st
  );
}

/** How "active" zone i is at progress p — 0 outside, ramps to 1 inside. */
export function zoneActivity(p: number, i: number): number {
  const s = zoneSegment(i);
  const t = (p - s.start) / (s.end - s.start);
  if (t < -0.35 || t > 1.35) return 0;
  return clamp01(1 - (Math.abs(t - 0.5) - 0.5) / 0.35);
}

/** Whether zone i should be mounted at all (culling window). */
export function zoneVisible(p: number, i: number): boolean {
  const s = zoneSegment(i);
  return p > s.start - 0.12 && p < s.end + 0.12;
}
