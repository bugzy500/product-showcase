# Phase A — Timeline-as-Homepage Flow Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the single scroll-driven experience so the AIoT H2 2026 timeline is the homepage, the Smarter Living walkthrough becomes the flagship October milestone you dive into (preserved exactly), and the Amazon transition + product-availability message are restored to their natural place at the end of that walkthrough — then the camera returns to the timeline and scrolling continues into Nov/Dec.

**Architecture:** The whole site is one `0→1` scroll driving a weighted segment list in `src/lib/timeline.ts`. This plan **reorders that list** (Approach A). Because the walkthrough camera keyframes are derived from `segment(id)` lookups, reordering auto-relocates them; the only structural camera work is (1) making `zoneSegment` id-based and (2) rewriting `sampleCamera`'s dispatch to route by segment band. The deep-timeline↔front-hall world jump at the October entry/return is masked by a fade cover (the preserved Smarter Living keynote on entry, a plain veil on return), so no fragile cross-world camera fly is attempted. Milestone `hero`/`env` behaviour is generalized from the hardcoded `index === 2` / index-switch to data-driven flags.

**Tech Stack:** Next.js 15, React 19, Three.js 0.176, @react-three/fiber, @react-three/drei, @react-three/postprocessing, framer-motion, zustand, TypeScript 5.8.

## Global Constraints

- No test runner exists; **do not add one**. Verification per task = `npm run typecheck` (must pass) + `npm run build` (must pass; also runs ESLint) + concrete browser verification via the preview tools. Follow the repo's existing no-test pattern.
- Preserve the Smarter Living walkthrough exactly (CR‑02 §3): **no behavioural/visual edits** to `Hall.tsx`, `ZoneEnvironment.tsx`, `ClimatePods.tsx`, `FinaleScene.tsx`, `ProductDisplay.tsx`, `ProductPanel.tsx`, `effects.tsx`, `props.tsx`, `models.tsx`, `textures.ts`, or the 8 zones' content. Only *where* they sit in the runway changes.
- No new runtime network fetches; offline-safe (canvas textures, procedural geometry) — the existing constraint.
- All on-screen copy lives in `content/experience.json`. Milestone/date copy is data-driven.
- `MILESTONE_COUNT` after this plan = **7**. Milestone ids/order (index → id): `0 purifier-launch`, `1 aiot-offline`, `2 ifa-berlin`, `3 smarter-living`, `4 ac-preheat`, `5 factory-visit`, `6 ac-launch`.
- Milestone `env` string values: `control-room`, `experience-zone`, `ifa`, `sl-portal`, `assembly-line`, `launch-stage`.
- Flagship (hero) milestone = index 3 (`smarter-living`). During Phase A, `ifa-berlin` (index 2) renders the current placeholder IFA bay; the rich IFA build is Phase B.
- Product-availability message (verbatim, CR‑02 §7) — stored in `content.amazon.availabilityMessage`:
  > While not every product showcased is intended for launch in India, each has been carefully curated to demonstrate the depth of Xiaomi's global AIoT ecosystem and our long-term vision for smart living. This showcase is designed to strengthen Xiaomi's premium innovation perception, reinforce our technology leadership, and inspire meaningful media storytelling that extends beyond individual product launches.
- Work on branch `feat/ifa-recreation-timeline-restructure` (already created). Commit after each task.
- Preview server: use `mcp__Claude_Preview__preview_start` with the `dev` config (`npm run dev`, port 3000). Create `.claude/launch.json` if absent (Task 0).

---

## Task 0: Preview launch config

**Files:**
- Create: `.claude/launch.json`

- [ ] **Step 1: Create the launch config if it does not already exist**

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 3000 }
  ]
}
```

- [ ] **Step 2: Baseline the current build is green**

Run: `npm run typecheck && npm run build`
Expected: both succeed (this is the pre-change baseline).

- [ ] **Step 3: Start the preview and capture a baseline**

Start server `dev`, then `preview_screenshot`. Expected: the site loads on the **Smarter Living keynote** (current behaviour) — this is what we are about to change.

- [ ] **Step 4: Commit**

```bash
git add .claude/launch.json
git commit -m "chore: add preview launch config"
```

---

## Task 1: Generalize milestone `hero`/`env` to data-driven flags (no visual change)

Pure refactor. Replaces hardcoded `index === 2` (hero) and the index-based `EnvironmentSet` switch with data. The site must look **identical** after this task (still 5 milestones, same order).

**Files:**
- Modify: `src/lib/content.ts` (add `env`, `hero` to `Milestone`)
- Modify: `content/experience.json` (add `env`/`hero` to the current 5 milestones)
- Modify: `src/lib/timeline.ts` (`milestoneCenterZ` hero check → flag)
- Modify: `src/components/TimelineScene.tsx` (`hero` from flag)
- Modify: `src/components/MilestoneEnvironment.tsx` (`hero` from flag; `EnvironmentSet` by `env`)

**Interfaces:**
- Produces: `Milestone.env: string`, `Milestone.hero?: boolean`; helper `isHero(index: number): boolean` in `timeline.ts`.
- Consumes: existing `timeline.milestones`.

- [ ] **Step 1: Add fields to the `Milestone` type**

In `src/lib/content.ts`, add to the `Milestone` interface (after `icon`):

```ts
  /** Themed environment key: control-room | experience-zone | ifa | sl-portal | assembly-line | launch-stage */
  env: string;
  /** Flagship milestone — larger node/glow and wider camera framing. */
  hero?: boolean;
```

- [ ] **Step 2: Add a data-driven hero helper in `timeline.ts`**

In `src/lib/timeline.ts`, near the other milestone helpers, add:

```ts
/** Whether milestone i is the flagship (data-driven; replaces the old hardcoded index). */
export function isHero(i: number): boolean {
  return !!timeline?.milestones[i]?.hero;
}
```

Add `timeline` to the existing import from `./content`:

```ts
import { content, allProducts, timeline } from "./content";
```

Then change `milestoneCenterZ` to use it:

```ts
export function milestoneCenterZ(i: number): number {
  return TL_OVERVIEW_Z - TL_BAY_DEPTH - (isHero(i) ? 4 : 0);
}
```

- [ ] **Step 3: Add `env`/`hero` to the current 5 milestones in JSON**

In `content/experience.json`, `timeline.milestones`, add to each object (matching current behaviour):
- `purifier-launch`: `"env": "control-room"`
- `aiot-offline`: `"env": "experience-zone"`
- `hero-ifa`: `"env": "ifa", "hero": true`
- `ac-factory`: `"env": "assembly-line"`
- `ac-launch`: `"env": "launch-stage"`

- [ ] **Step 4: Use the hero flag in `TimelineScene.tsx`**

In `src/components/TimelineScene.tsx`, replace the two `const hero = index === 2;` occurrences (in `MilestoneNode`) with:

```ts
import { /* …existing… */ isHero } from "@/src/lib/timeline";
```
```ts
const hero = isHero(index);
```

- [ ] **Step 5: Use the hero flag + `env` switch in `MilestoneEnvironment.tsx`**

In `src/components/MilestoneEnvironment.tsx`:
- Change `const hero = index === 2;` (in `MilestoneEnvironment`) to `const hero = isHero(index);` and import `isHero`.
- Replace the index-based `EnvironmentSet` with an `env`-based one:

```tsx
function EnvironmentSet({ env, accent }: { env: string; accent: string }) {
  switch (env) {
    case "control-room":
      return <ScreenWall accent={accent} />;
    case "experience-zone":
      return <InteractionTables accent={accent} />;
    case "ifa":
      return <IfaHall accent={accent} />;
    case "assembly-line":
      return <AssemblyLine accent={accent} />;
    case "launch-stage":
      return <LaunchStage accent={accent} />;
    default:
      return null;
  }
}
```

- Update the render call from `<EnvironmentSet index={index} accent={accent} />` to `<EnvironmentSet env={m.env} accent={accent} />`.
- The `LaunchStage` `useFrame` uses `milestoneActivity(liveState.smoothProgress, 4)`; change the hardcoded `4` to the component's `index` prop. Thread `index` into `LaunchStage` (add `index` to its props and pass it from `EnvironmentSet`/`MilestoneEnvironment`). Minimal edit: give `EnvironmentSet` the `index` too and pass `index` to `LaunchStage`.

```tsx
function EnvironmentSet({ env, accent, index }: { env: string; accent: string; index: number }) {
  switch (env) {
    // …
    case "launch-stage":
      return <LaunchStage accent={accent} index={index} />;
    // …
  }
}
```
```tsx
function LaunchStage({ accent, index }: { accent: string; index: number }) {
  // …
  const open = milestoneActivity(liveState.smoothProgress, index);
  // …
}
```

- [ ] **Step 6: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 7: Preview — verify no visual change**

Reload preview. Scroll to the timeline act. Expected: 5 nodes exactly as before; hero (September/IFA) node still largest; each milestone bay renders its original environment; the AC-launch doors still open on dwell. `preview_screenshot` to compare against the Task 0 baseline of the timeline act.

- [ ] **Step 8: Commit**

```bash
git add src/lib/content.ts src/lib/timeline.ts content/experience.json src/components/TimelineScene.tsx src/components/MilestoneEnvironment.tsx
git commit -m "refactor(timeline): data-driven hero/env flags (no behaviour change)"
```

---

## Task 2: Restore the product-availability message after the Amazon transition

Move the "Why This Showcase Matters" message (currently duplicated inside the finale) to a premium floating glass closing card shown **after** the Amazon grid, and remove it from the finale so it appears once, in its restored place (CR‑02 §5, §7). This is order-independent from the reorder and is reviewable on its own.

**Files:**
- Modify: `src/lib/content.ts` (`amazon` type: add `availabilityMessage`)
- Modify: `content/experience.json` (`amazon.availabilityMessage`; remove `finale.closing`/`finale.closingTitle`)
- Modify: `src/components/overlays/AmazonOverlay.tsx` (render the closing card at high `localT`)

**Interfaces:**
- Produces: `content.amazon.availabilityMessage: string`.

- [ ] **Step 1: Add the field to the amazon content type**

In `src/lib/content.ts`, in the `amazon` block of `ExperienceContent`, add after `note: string;`:

```ts
    /** Approved concluding message shown as a floating glass card after the Amazon transition. */
    availabilityMessage: string;
```

- [ ] **Step 2: Move the message into `amazon` and de-dupe the finale in JSON**

In `content/experience.json`:
- Add to `amazon`: `"availabilityMessage": "While not every product showcased is intended for launch in India, each has been carefully curated to demonstrate the depth of Xiaomi's global AIoT ecosystem and our long-term vision for smart living. This showcase is designed to strengthen Xiaomi's premium innovation perception, reinforce our technology leadership, and inspire meaningful media storytelling that extends beyond individual product launches."`
- Delete the `finale.closingTitle` and `finale.closing` keys (README documents these as optional additions; removing reverts the finale to its shorter card).

- [ ] **Step 3: Render the closing glass card in `AmazonOverlay`**

In `src/components/overlays/AmazonOverlay.tsx`, add a closing card that fades in near the end of the amazon segment, reusing the existing `.tl-closing` glass style. After the `<footer className="az-footer">…</footer>` line and before `</motion.div>`, insert:

```tsx
          {t > 0.7 && (
            <motion.div
              className="tl-closing az-availability"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="tl-closing-title">Why This Showcase Matters</div>
              <p className="tl-closing-msg">{content.amazon.availabilityMessage}</p>
            </motion.div>
          )}
```

(`t` is the already-computed `localT(progress, segment("amazon"))`.)

- [ ] **Step 4: Add a minimal style hook**

In `app/globals.css`, append:

```css
/* Availability closing card sits above the Amazon grid, reusing .tl-closing */
.az-availability { z-index: 40; }
```

- [ ] **Step 5: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 6: Preview — verify**

Scroll to the Amazon beat (currently the final segment). Expected: the Amazon grid appears; near the end of that segment the glass "Why This Showcase Matters" card fades in with the availability text. Scroll to the finale: it now ends on the shorter card (no duplicated takeaway). `preview_screenshot` both.

- [ ] **Step 7: Commit**

```bash
git add src/lib/content.ts content/experience.json src/components/overlays/AmazonOverlay.tsx app/globals.css
git commit -m "feat(ending): restore availability message as post-Amazon closing card"
```

---

## Task 3: Reorder the scroll runway → 7 milestones + camera dispatch + entry/return

The heart of Phase A. Reorder `weights`, set `MILESTONE_COUNT = 7`, rewrite the milestone content to 7 entries, make `zoneSegment` id-based, and rewrite `sampleCamera` to route by segment band with an entry (`ms3`) and return (`slreturn`) transition. World-jump between the deep timeline and the front hall is masked by the fade cover added in Task 4 — this task only positions the camera; a brief hard transition is expected and acceptable until Task 4 lands.

**Files:**
- Modify: `src/lib/timeline.ts` (weights, `MILESTONE_COUNT`, `zoneSegment`, `activeZoneIndex`, `sampleCamera`, `tlKeys`, new entry/return pose keyframes)
- Modify: `content/experience.json` (`timeline.milestones` → 7 entries)

**Interfaces:**
- Consumes: `isHero`, `env` from Task 1.
- Produces: segment ids `timeline, ms0..ms6, arrival, <8 zone ids>, finale, amazon, slreturn, closing`; `MILESTONE_COUNT = 7`; `sampleCamera(p, pos, look)` covering the full new runway.

- [ ] **Step 1: Reorder the `weights` array**

In `src/lib/timeline.ts`, replace the `weights` definition with:

```ts
const weights: Array<[string, number]> = [
  ["timeline", 1.2], // roadmap overview reveal (homepage)
  ["ms0", 1.0], // Aug — Air Purifier Pre-Heat & Launch
  ["ms1", 1.0], // Sep — AIoT Offline Experience
  ["ms2", 2.6], // Sep 4–8 — IFA Berlin 2026 (extra runway; Phase B fills sub-beats)
  ["ms3", 1.0], // Oct — Smarter Living entry transition (dive into the walkthrough)
  ["arrival", 1.5],
  ...content.zones.map((z): [string, number] => [z.id, 1]),
  ["finale", 1.7],
  ["amazon", 1.1],
  ["slreturn", 0.9], // camera returns from the venue to the October node
  ["ms4", 1.0], // Nov — Air Conditioner Pre-Heat
  ["ms5", 1.1], // Nov — Large Appliance Factory Visit
  ["ms6", 1.0], // Dec — Air Conditioner Launch
  ["closing", 1.2], // "One Shared Vision" — the true end
];
```

- [ ] **Step 2: Set `MILESTONE_COUNT = 7`**

```ts
export const MILESTONE_COUNT = 7;
```

- [ ] **Step 3: Make `zoneSegment` and `activeZoneIndex` id-based**

The old `zoneSegment = (i) => segments[i + 1]` assumed arrival was index 0. Replace with an id lookup:

```ts
export const zoneSegment = (i: number) => segment(content.zones[i].id);
```

`activeZoneIndex` already iterates `zoneSegment(i)` — no change needed once `zoneSegment` is id-based. Verify it still reads:

```ts
export function activeZoneIndex(p: number): number {
  for (let i = 0; i < content.zones.length; i++) {
    const s = zoneSegment(i);
    if (p >= s.start && p < s.end) return i;
  }
  return -1;
}
```

- [ ] **Step 4: Rewrite the 7-milestone content in JSON**

In `content/experience.json`, replace `timeline.milestones` with the 7 entries below (reuse existing copy where a milestone maps to a former one; keep `icon` keys that already exist: `purifier`, `powerbank`, `globe`, `factory`, `ac`).

```jsonc
"milestones": [
  {
    "id": "purifier-launch", "month": "August 2026", "dateLabel": "AUG",
    "title": "Air Purifier Pre-Heat & Launch", "focus": "Pre-heat phase (7–10 days)",
    "environment": "Digital Marketing Control Room", "env": "control-room",
    "accent": "#5ec8f2", "icon": "purifier",
    "headline": "The launch begins before the launch.",
    "body": "A pre-heat control room orchestrates the countdown to the Air Purifier launch — every teaser, every creator drop, every dashboard in one command centre.",
    "bullets": ["Social media calendar","Teaser campaign","Product reveal","Launch countdown","Creator content","Performance dashboards"],
    "products": ["purifier-6","purifier-4compact"]
  },
  {
    "id": "aiot-offline", "month": "September 2026", "dateLabel": "SEP",
    "title": "AIoT Offline Experience", "focus": "Interactive experience inside the offline smartphone launch venue",
    "environment": "Premium Experience Zone", "env": "experience-zone",
    "accent": "#ffb46a", "icon": "powerbank",
    "headline": "AIoT, hands-on.",
    "body": "Inside the Q Note launch venue, a premium experience zone lets media and guests touch the ecosystem — charging bars, air-purification demos and smart-living displays.",
    "bullets": ["Charging experiences","Air purification demos","Product interaction tables","Hands-on media engagement","Smart living displays"],
    "products": ["pb-67w","pb-165w","pb-ultrathin","pb-qi22","purifier-6","purifier-4compact"]
  },
  {
    "id": "ifa-berlin", "month": "4–8 September 2026", "dateLabel": "SEP 4–8",
    "title": "IFA Berlin 2026", "focus": "The world's largest consumer-electronics exhibition",
    "environment": "IFA Berlin 2026 · Global Showcase", "env": "ifa",
    "accent": "#ff6900", "icon": "globe",
    "headline": "The world stage.",
    "body": "Xiaomi India takes its media to IFA Berlin 2026 — an immersive walk from the Messe Berlin entrance across the exhibition floor, showcasing the depth of the global AIoT ecosystem.",
    "bullets": ["Arrival at Messe Berlin","IFA entrance plaza","Interactive floor map","Global showcase presence"],
    "products": []
  },
  {
    "id": "smarter-living", "month": "October 2026", "dateLabel": "OCT",
    "title": "Xiaomi Smarter Living Media Event", "focus": "The flagship immersive walkthrough",
    "environment": "Smarter Living Media Event Venue", "env": "sl-portal",
    "accent": "#ff6900", "icon": "globe", "hero": true,
    "headline": "Step inside the flagship experience.",
    "body": "The October milestone opens directly into the Xiaomi Smarter Living Media Event — the full cinematic venue walkthrough, from the entrance keynote through every product zone to the Grand Finale ecosystem reveal.",
    "bullets": ["Entrance keynote","Eight product experience zones","Grand Finale ecosystem reveal","Amazon India availability"],
    "products": [],
    "experienceB": { "label": "Enter the Media Event", "action": "replay" }
  },
  {
    "id": "ac-preheat", "month": "November 2026", "dateLabel": "NOV",
    "title": "Air Conditioner Pre-Heat", "focus": "Building anticipation for the AC launch",
    "environment": "Digital Marketing Control Room", "env": "control-room",
    "accent": "#7ecb8f", "icon": "ac",
    "headline": "Warming up the launch.",
    "body": "A pre-heat campaign builds anticipation for the Air Conditioner — teasers, creator content and countdown dashboards orchestrated ahead of the reveal.",
    "bullets": ["Teaser campaign","Creator content","Countdown dashboards","Social calendar"],
    "products": ["ac-fresh-air-pro","ac-natural-wind"]
  },
  {
    "id": "factory-visit", "month": "November 2026", "dateLabel": "NOV",
    "title": "Large Appliance Factory Visit", "focus": "Engineering excellence and storytelling",
    "environment": "Guided Factory Tour", "env": "assembly-line",
    "accent": "#7ecb8f", "icon": "factory",
    "headline": "Where excellence is engineered.",
    "body": "A guided factory tour reveals the craft behind the large appliances — compressor technology, smart sensors and quality testing along a living assembly line.",
    "bullets": ["Component manufacturing","Compressor technology","Energy efficiency","Smart sensors","Quality testing","Assembly line processes"],
    "products": ["ac-fresh-air-pro","ac-natural-wind"]
  },
  {
    "id": "ac-launch", "month": "December 2026", "dateLabel": "DEC",
    "title": "Air Conditioner Launch", "focus": "Culmination of the H2 AIoT strategy",
    "environment": "Factory Doors → Premium Launch Stage", "env": "launch-stage",
    "accent": "#ff6900", "icon": "ac",
    "headline": "The doors open.",
    "body": "The factory doors part onto a premium launch stage — the hero Air Conditioner revealed under the lights, closing the H2 AIoT strategy.",
    "bullets": ["Product reveal","Launch event","Media photography","Digital campaign","Online availability","Hero product showcase"],
    "products": ["ac-fresh-air-pro"]
  }
]
```

> Note: verify product ids exist in `allProducts` (they carried over from the previous milestone content). If `ac-fresh-air-pro`/`ac-natural-wind`/`pb-*`/`purifier-*` are absent, use ids present in `content.zones[*].products`.

- [ ] **Step 5: Exclude `ms3` from the milestone-travel keyframes and add return-handoff keys**

In `src/lib/timeline.ts`, in the `tlKeys` IIFE, the `for` loop generates dive/dwell/rise keys for each milestone. `ms3` is now the entry transition (handled separately), and the walkthrough sits between `ms2` and `ms4`. Change the loop to skip `i === 3`:

```ts
  for (let i = 0; i < MILESTONE_COUNT; i++) {
    if (i === 3) continue; // ms3 (Oct) is the walkthrough entry — handled by the entry transition
    const s = milestoneSegment(i);
    // …unchanged dive/dwell/rise key pushes…
  }
```

The wide-reveal intro keys (at `tl.start`) and the closing wide key (at `closing.start`) remain. Because `sampleTimelineCamera` is only *called* for `p < ms3.start` or `p >= ms4.start` (see Step 6), the milestone travel spline naturally covers `timeline→ms0→ms1→ms2` and `ms4→ms5→ms6→closing`; the gap over the walkthrough is never sampled here.

- [ ] **Step 6: Rewrite `sampleCamera` dispatch to route by segment band**

Replace the body of `sampleCamera` in `src/lib/timeline.ts` with:

```ts
export function sampleCamera(p: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const ms3 = segment("ms3");
  const arr = segment("arrival");
  const f = segment("finale");
  const am = segment("amazon");
  const slr = segment("slreturn");
  const ms4 = segment("ms4");

  // 1. timeline overview + ms0..ms2 milestone travel
  if (p < ms3.start) {
    sampleTimelineCamera(p, pos, look);
    return;
  }
  // 2. ms3 — October entry transition (push toward the portal; cover fades in via Task 4)
  if (p < arr.start) {
    entryPose(localT(p, ms3), pos, look);
    return;
  }
  // 3. arrival → 8 zones → finale — the preserved walkthrough (keys auto-relocated)
  if (p < am.start) {
    if (p >= f.start) {
      orbitPose(smooth(localT(p, f)) * 0.999, pos, look);
    } else {
      sampleWalkKeys(p, pos, look);
    }
    return;
  }
  // 4. amazon — existing pull-back
  if (p < slr.start) {
    const t = smooth(localT(p, am));
    orbitPose(1, _oEnd.pos, _oEnd.look);
    pos.copy(_oEnd.pos).lerp(new THREE.Vector3(0, 3.0, FINALE_Z + 16), t);
    look.copy(_oEnd.look).lerp(new THREE.Vector3(0, 2.6, FINALE_Z), t);
    return;
  }
  // 5. slreturn — return from the venue to the October node (cover masks the jump)
  if (p < ms4.start) {
    returnPose(localT(p, slr), pos, look);
    return;
  }
  // 6. ms4..ms6 milestone travel + closing
  sampleTimelineCamera(p, pos, look);
}
```

- [ ] **Step 7: Extract the walkthrough keyframe sampler into `sampleWalkKeys`**

The old `sampleCamera` tail (the `camKeys` catmull sampler) is now called from band 3. Extract it verbatim into a helper so it can be reused:

```ts
function sampleWalkKeys(p: number, pos: THREE.Vector3, look: THREE.Vector3) {
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
```

- [ ] **Step 8: Add `entryPose` and `returnPose`**

These position the camera at each end of the transition. The mid-transition world jump is hidden by the Task 4 cover. Add near the other camera helpers in `timeline.ts`:

```ts
/** October entry: gentle push toward the Smarter Living portal node in the timeline bay.
 *  At t→1 the cover is opaque; the walkthrough begins at arrival's first pose on the far side. */
function entryPose(t: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const nodeX = milestoneNodeX(3);
  const st = smooth(t);
  pos.set(nodeX * 0.5, TL_LINE_Y + 1.4 - st * 0.6, TL_OVERVIEW_Z + 6 - st * 3);
  look.set(nodeX * 0.4, TL_LINE_Y - st * 0.8, TL_OVERVIEW_Z - 2 - st * 6);
}

/** October return: from the venue back to the timeline at the October node.
 *  At t→1 we settle on the milestone-travel pose so band 6 continues seamlessly. */
function returnPose(t: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const nodeX = milestoneNodeX(3);
  const st = smooth(t);
  const endPos = new THREE.Vector3(nodeX * 0.6, TL_LINE_Y + 1.5, TL_OVERVIEW_Z + 6);
  const endLook = new THREE.Vector3(nodeX * 0.5, TL_LINE_Y, TL_OVERVIEW_Z);
  const startPos = new THREE.Vector3(0, 3.0, FINALE_Z + 16);
  const startLook = new THREE.Vector3(0, 2.6, FINALE_Z);
  pos.copy(startPos).lerp(endPos, st);
  look.copy(startLook).lerp(endLook, st);
}
```

- [ ] **Step 9: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both pass. Fix any references to the removed `sampleTimelineCamera` closing branch or the old `sampleCamera` tail (they moved into `sampleWalkKeys`). `sampleTimelineCamera` keeps its existing closing-branch logic for band 6's closing wide shot.

- [ ] **Step 10: Preview — verify the new runway order**

Reload. Expected on scroll from top: timeline overview first → Aug → Sep (AIoT) → Sep 4–8 (IFA placeholder bay) → Oct (a brief transition, then) the Smarter Living walkthrough (arrival → zones → finale → Amazon → availability card) → back to the timeline → Nov (AC pre-heat) → Nov (factory) → Dec (AC launch) → "One Shared Vision" closing. The October entry/return will show a visible hard jump for now (cover comes in Task 4). Use `preview_eval` `window.scrollTo(0, document.body.scrollHeight * X)` for X ∈ {0.05, 0.2, 0.35, 0.5, 0.7, 0.9} and `preview_screenshot` each. Note any pose that frames badly and adjust the numbers in Steps 6/8 (pose values are starting points).

- [ ] **Step 11: Commit**

```bash
git add src/lib/timeline.ts content/experience.json
git commit -m "feat(flow): reorder runway to timeline-first with 7 milestones + walkthrough entry/return"
```

---

## Task 4: Retarget the landing overlay + add the October entry/return cover

The premium landing keynote now introduces the **roadmap** at the top. The preserved **Smarter Living event keynote** becomes the cinematic cover during the October entry (masking the world jump), and a plain veil covers the return. This satisfies CR‑02 §1 (keep the landing), §3 (preserve the event intro), §4 (seamless transition).

**Files:**
- Modify: `src/components/overlays/IntroOverlay.tsx`
- Create: `src/components/overlays/TransitionCover.tsx`
- Modify: `src/components/ExperienceApp.tsx` (mount `TransitionCover`)
- Modify: `app/globals.css` (cover styles)

**Interfaces:**
- Consumes: `segment`, `localT` from `timeline.ts`; `content.timeline.intro`, `content.event.intro`.

- [ ] **Step 1: Point the top landing at the roadmap intro**

In `src/components/overlays/IntroOverlay.tsx`, change the content source from the event intro to the roadmap intro, and gate it on the timeline-overview band. Replace:

```ts
const intro = content.event.intro;
```
with:
```ts
import { timeline } from "@/src/lib/content";
const intro = timeline!.intro;
```

The roadmap intro has `kicker`/`heading`/`subheading` but no `body`/`snapshot`. Guard those blocks:
- Replace the body map with: `{("body" in intro ? (intro as { body?: string[] }).body ?? [] : []).map(...)}` — or simpler, since `timeline.intro` has no body, remove the `keynote-body` block and the right-hand `keynote-card` aside for the roadmap landing (the roadmap intro is a headline landing, not the event snapshot). Keep brand, heading, accents, subheading, and CTA.
- Change the CTA button label to `Begin the Journey`.

Gating stays `!introDone && progress < 0.05` — at the top the first segment is `timeline`, so `progress < 0.05` is the overview. Keep `setIntroDone` on the button.

- [ ] **Step 2: Create the `TransitionCover` overlay (event keynote on entry, veil on return)**

Create `src/components/overlays/TransitionCover.tsx`:

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { content } from "@/src/lib/content";
import { useExperience } from "@/src/lib/store";
import { segment, localT } from "@/src/lib/timeline";

const evIntro = content.event.intro;

/** Opacity that ramps 0→1→0 across a segment, peaking mid-way to fully mask the world jump. */
function coverOpacity(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 0;
  return Math.min(1, Math.sin(t * Math.PI) * 1.6);
}

export function TransitionCover() {
  const progress = useExperience((s) => s.progress);
  const focus = useExperience((s) => s.focus);
  if (focus) return null;

  const ms3 = segment("ms3");
  const slr = segment("slreturn");

  const entryT = localT(progress, ms3);
  const returnT = localT(progress, slr);
  const inEntry = progress >= ms3.start && progress < ms3.end;
  const inReturn = progress >= slr.start && progress < slr.end;

  return (
    <AnimatePresence>
      {inEntry && (
        <motion.div
          key="entry"
          className="transition-cover entry"
          style={{ opacity: coverOpacity(entryT) }}
        >
          <div className="transition-keynote">
            <div className="transition-kicker">{evIntro.kicker}</div>
            <h2 className="transition-heading">{content.event.title}</h2>
            <p className="transition-sub">{content.event.subtitle}</p>
          </div>
        </motion.div>
      )}
      {inReturn && (
        <motion.div
          key="return"
          className="transition-cover return"
          style={{ opacity: coverOpacity(returnT) }}
        />
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Mount it in `ExperienceApp`**

In `src/components/ExperienceApp.tsx`, import and render `<TransitionCover />` alongside the other overlays (after `<TimelineOverlay />`):

```tsx
import { TransitionCover } from "./overlays/TransitionCover";
// …
      <TimelineOverlay />
      <TransitionCover />
```

- [ ] **Step 4: Style the cover**

Append to `app/globals.css`:

```css
.transition-cover {
  position: fixed; inset: 0; z-index: 45;
  background: radial-gradient(circle at 50% 45%, #0b0d13 0%, #05060a 100%);
  display: flex; align-items: center; justify-content: center;
  pointer-events: none; text-align: center;
}
.transition-keynote { max-width: 620px; padding: 0 24px; }
.transition-kicker { letter-spacing: 0.32em; text-transform: uppercase; font-size: 12px; color: #ff8a3c; margin-bottom: 18px; }
.transition-heading { font-size: clamp(28px, 5vw, 54px); font-weight: 600; color: #f4f6fb; margin: 0 0 12px; }
.transition-sub { color: #aab2c4; font-size: 15px; }
```

- [ ] **Step 5: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 6: Preview — verify seamless entry/return**

Reload. Expected: top shows the roadmap landing ("One Connected AIoT Strategy", "Begin the Journey"). Scroll into October: the event keynote cover fades up to fully mask the transition, then fades to reveal the Smarter Living arrival — no visible world jump. After the availability card, the return veil masks the pull-back and reveals the timeline at October. `preview_screenshot` at entry mid-point (should be near-opaque cover) and just after (arrival visible).

- [ ] **Step 7: Commit**

```bash
git add src/components/overlays/IntroOverlay.tsx src/components/overlays/TransitionCover.tsx src/components/ExperienceApp.tsx app/globals.css
git commit -m "feat(flow): roadmap landing + October entry/return cinematic cover"
```

---

## Task 5: `sl-portal` environment for the October node

A small venue marquee/portal in the timeline bay behind the October node, so the flagship milestone reads as a doorway into the Media Event rather than an empty node. Rendered via the `env: "sl-portal"` case.

**Files:**
- Modify: `src/components/MilestoneEnvironment.tsx` (add `SmarterLivingPortal`, wire `sl-portal` in `EnvironmentSet`)

**Interfaces:**
- Consumes: `env` switch from Task 1.

- [ ] **Step 1: Add the portal component**

In `src/components/MilestoneEnvironment.tsx`, add near the other environment set-pieces:

```tsx
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
```

- [ ] **Step 2: Wire it into `EnvironmentSet`**

Add the case:

```tsx
    case "sl-portal":
      return <SmarterLivingPortal accent={accent} />;
```

- [ ] **Step 3: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 4: Preview — verify**

Scroll to just before the October entry (end of the IFA/`ms2` region into `ms3`). Expected: the glowing "XIAOMI SMARTER LIVING · Media Event · Enter →" portal appears behind the October node before the cover takes over. `preview_screenshot`.

- [ ] **Step 5: Commit**

```bash
git add src/components/MilestoneEnvironment.tsx
git commit -m "feat(timeline): Smarter Living venue portal for the October node"
```

---

## Task 6: HUD chapter stops + letterbox for the new order

Rebuild the HUD chapter navigation so breadcrumbs reflect the new chronological order (timeline → 7 milestones with month labels; Smarter Living nested under October → closing), and fix the letterbox logic that assumed arrival was first.

**Files:**
- Modify: `src/components/overlays/HUD.tsx`

**Interfaces:**
- Consumes: `segment`, `milestoneSegment`, `zoneSegment`, `localT` from `timeline.ts`; `timeline.milestones`.

- [ ] **Step 1: Rebuild the `stops` array in the new order**

In `src/components/overlays/HUD.tsx`, replace the `stops` definition with:

```ts
  const ms = (i: number) =>
    milestoneSegment(i).start + (milestoneSegment(i).end - milestoneSegment(i).start) * 0.55;

  const stops = timeline?.enabled
    ? [
        { id: "timeline", label: timeline.chapter, p: segment("timeline").start },
        { id: "ms0", label: "Aug", p: ms(0) },
        { id: "ms1", label: "Sep", p: ms(1) },
        { id: "ms2", label: timeline.milestones[2].dateLabel, p: ms(2) },
        { id: "ms3", label: "Oct", p: ms(3) },
        // Smarter Living walkthrough nested under October
        { id: "arrival", label: content.event.title, p: segment("arrival").start },
        { id: "finale", label: content.finale.chapter, p: segment("finale").start },
        { id: "amazon", label: content.amazon.chapter, p: segment("amazon").start },
        { id: "ms4", label: "Nov", p: ms(4) },
        { id: "ms5", label: "Nov", p: ms(5) },
        { id: "ms6", label: "Dec", p: ms(6) },
        { id: "closing", label: timeline.closing.title, p: segment("closing").start },
      ]
    : [
        { id: "arrival", label: "Arrival", p: 0 },
        ...content.zones.map((z, i) => ({ id: z.id, label: z.name, p: zoneSegment(i).start })),
        { id: "finale", label: content.finale.chapter, p: segment("finale").start },
        { id: "amazon", label: content.amazon.chapter, p: segment("amazon").start },
      ];
```

- [ ] **Step 2: Fix the letterbox trigger**

The old letterbox used `localT(progress, segment("arrival"))` assuming arrival was the opening. Update so bars show during the roadmap landing, the walkthrough arrival, and the finale/amazon beats:

```ts
  const landingT = localT(progress, segment("timeline"));
  const arrivalT = localT(progress, segment("arrival"));
  const inFinaleAmazon = progress >= segment("finale").start && progress < segment("slreturn").start;
  const bars =
    (!introDone || landingT < 0.9 || (progress >= segment("arrival").start && arrivalT < 0.9) || inFinaleAmazon) &&
    !focus
      ? "6vh"
      : "0vh";
```

- [ ] **Step 3: Update the scroll-hint gate**

The hint currently shows at `progress < 0.01`. Keep it — at the top that's the roadmap landing. No change required beyond confirming it reads `content.event.entryHint` (leave copy as-is or change to a roadmap hint later).

- [ ] **Step 4: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 5: Preview — verify breadcrumbs + letterbox**

Reload. Expected: HUD chapter dots read timeline → Aug → Sep → SEP 4–8 → Oct → (Smarter Living / Grand Finale / Available Now) → Nov → Nov → Dec → One Shared Vision. Clicking each dot scrolls to that beat. Letterbox bars appear during the landing, the walkthrough arrival, and the finale/Amazon beats, and are hidden during mid-timeline milestone travel. `preview_snapshot` to read the dot labels.

- [ ] **Step 6: Commit**

```bash
git add src/components/overlays/HUD.tsx
git commit -m "feat(hud): chapter stops + letterbox for timeline-first order"
```

---

## Task 7: TimelineOverlay — October "Enter the Media Event" wiring + reordered jumps

The per-milestone panel and strip are already data-driven over `timeline.milestones`, so they extend to 7 automatically. Fix the milestone-jump math for the walkthrough band, wire the October panel's action to scroll into the walkthrough, and keep the strip/panel hidden while inside the walkthrough (the walkthrough has its own overlays).

**Files:**
- Modify: `src/components/overlays/TimelineOverlay.tsx`

**Interfaces:**
- Consumes: `segment`, `milestoneSegment`, `milestoneActivity`, `localT` from `timeline.ts`.

- [ ] **Step 1: Hide the timeline overlay while inside the walkthrough band**

In `src/components/overlays/TimelineOverlay.tsx`, after the existing early returns, add a guard so the strip/panels don't show over the preserved walkthrough (arrival → amazon):

```ts
  const arrival = segment("arrival");
  const slreturn = segment("slreturn");
  const inWalkthrough = progress >= arrival.start && progress < slreturn.end;
  if (inWalkthrough) return null;
```

Place this after `if (!timeline?.enabled || focus) return null;` and after the `inTimelineAct` computation (adjust `inTimelineAct` to also treat the post-return milestones as in-act — see Step 2).

- [ ] **Step 2: Extend the "in timeline act" window**

The overlay currently activates from `timeline.start` until `amazon.start`. With the reorder, the act spans the whole runway except the walkthrough. Replace the `inTimelineAct` check:

```ts
  const tl = segment("timeline");
  const closing = segment("closing");
  const inTimelineAct = progress >= tl.start - 0.01 && progress <= closing.end;
  if (!inTimelineAct) return null;
```

(The `inWalkthrough` guard from Step 1 carves out the walkthrough band.)

- [ ] **Step 3: Wire the October `experienceB` action to enter the walkthrough**

The `smarter-living` milestone has `experienceB: { label: "Enter the Media Event", action: "replay" }`. Change its button to scroll into the walkthrough (arrival) instead of `scrollToProgress(0)`:

```tsx
            {m.experienceB && (
              <button
                className="tl-experience-b"
                onClick={() => scrollToProgress(segment("arrival").start)}
              >
                {m.experienceB.label} →
              </button>
            )}
```

- [ ] **Step 4: Fix the closing "Replay" to return to the top (roadmap landing)**

The closing card's replay should scroll to the very top (now the roadmap landing). It already calls `scrollToProgress(0)` — verify and keep. The "↑ Return to timeline" button calls `scrollToProgress(tl.start)` — keep.

- [ ] **Step 5: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 6: Preview — verify**

Reload. Expected: strip shows all 7 chips (AUG…DEC) with correct states (completed/active/future) as you scroll; the October panel shows an "Enter the Media Event →" button that scrolls into the walkthrough; no timeline strip/panels appear while inside the walkthrough; the "One Shared Vision" closing shows at the end with a working Replay. Click the October button and confirm it dives into the arrival. `preview_click` the chips to confirm jumps.

- [ ] **Step 7: Commit**

```bash
git add src/components/overlays/TimelineOverlay.tsx
git commit -m "feat(timeline): October entry wiring + reordered jumps; hide overlay inside walkthrough"
```

---

## Task 8: End-to-end Phase-A integration verification

No new code unless a defect is found. Confirm the whole reordered journey works and the walkthrough is unchanged.

**Files:** none (verification), plus fixes if needed.

- [ ] **Step 1: Full build**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 2: Scripted scroll pass**

With the preview running, step `window.scrollTo` across the full range (e.g. 0, 0.05, 0.12, 0.2, 0.28, 0.36, 0.44 …, 0.98) via `preview_eval`, `preview_screenshot` at each, and confirm the sequence:
timeline landing → Aug → Sep (AIoT) → Sep 4–8 (IFA placeholder) → Oct cover → arrival keynote → 8 zones → Grand Finale ("One Ecosystem. One Home.") → Amazon grid → availability glass card → return cover → timeline at October → Nov (AC pre-heat) → Nov (factory) → Dec (AC launch) → "One Shared Vision".

- [ ] **Step 3: Console + regression checks**

`preview_console_logs` (level error) — expect none. Confirm the walkthrough itself (zones, ProductPanel focus, finale orbit, Amazon fly-to-grid) behaves exactly as before the change (spot-check a product focus/close, an LED zone caption, the finale reveal).

- [ ] **Step 4: Date consistency spot-check (CR‑01 §1.1 groundwork)**

Confirm the IFA milestone shows `SEP 4–8` / `4–8 September 2026` on its node label, strip chip, panel date, and HUD dot. (Full IFA date propagation to the entrance screen is Phase B.)

- [ ] **Step 5: Final screenshot for the user + commit any fixes**

`preview_screenshot` the roadmap landing and the restored availability card. If any defect fixes were made, commit them:

```bash
git add -A
git commit -m "fix(flow): Phase-A integration fixes"
```

---

## Self-Review

**Spec coverage (Phase A rows of the spec's traceability table):**
- CR‑02 §1 timeline homepage → Task 3 (runway) + Task 4 (landing). ✔
- CR‑02 §2 Smarter Living → October; revised roadmap → Task 3 (7 milestones). ✔
- CR‑02 §3 preserve walkthrough → Global Constraints + Task 8 regression. ✔ (no walkthrough files edited)
- CR‑02 §4 entry/return transition → Task 3 (poses) + Task 4 (cover). ✔
- CR‑02 §5 restore ending order → Task 2 + Task 3 (amazon after finale). ✔
- CR‑02 §6 Amazon transition flow → preserved `AmazonOverlay`, repositioned by Task 3. ✔
- CR‑02 §7 availability message → Task 2. ✔
- CR‑02 §8 return to timeline → Task 3 (`slreturn`) + Task 4 (return cover) + Task 6/7 (continue nav). ✔
- CR‑01 §1.1 date consistency groundwork (node/strip/panel/HUD) → Task 3 content + Task 8 spot-check. (Entrance-screen propagation = Phase B.)

**Placeholder scan:** No TBD/TODO; every code step shows concrete code. Camera pose numbers are explicitly flagged as starting values to tune in preview (Task 3 Step 10) — this is expected iterative tuning, not a placeholder.

**Type consistency:** `Milestone.env`/`hero` defined in Task 1 and consumed in Tasks 1/3/5. `isHero` defined Task 1, used Tasks 1. `content.amazon.availabilityMessage` defined Task 2, used Task 2. `sampleWalkKeys`/`entryPose`/`returnPose` defined Task 3 and referenced only within `sampleCamera` (Task 3). `TransitionCover` defined Task 4, mounted Task 4. Segment ids (`timeline, ms0..ms6, arrival, <zones>, finale, amazon, slreturn, closing`) are consistent across Tasks 3/4/6/7.

**Known follow-ups for Phase B (out of scope here):** the rich IFA experience (`env: "ifa"` currently renders the placeholder `IfaHall`), procedural crowd, floor map, halls, IFA date propagation to the entrance screen, and `IfaContent` schema.
```
