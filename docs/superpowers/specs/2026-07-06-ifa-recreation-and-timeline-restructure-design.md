# IFA Berlin Recreation & Website-Flow Restructure — Design

Date: 2026-07-06
Status: Approved (design confirmed with stakeholder on 2026-07-06)
Source: `Changes in Webpage.pdf` — Change Request 01 (IFA Berlin 2026 overhaul) + Change Request 02
(restructure the website flow around the timeline).

## Purpose

Two interlocking changes to the existing scroll-driven 3D experience:

- **CR‑01 — IFA Berlin overhaul.** The IFA milestone is currently a thin generic vignette (three arches
  + a departures board). Replace it with a cinematic, scroll-driven IFA Berlin 2026 experience that
  immediately reads as the real Messe Berlin venue: arrival at the iconic facade, an entrance plaza,
  a colour-coded interactive floor map, and a dip through a few live exhibition halls. It must
  communicate that **Xiaomi India is taking media to IFA Berlin 2026** while staying inside the
  existing premium visual language.
- **CR‑02 — flow restructure.** Today the site opens with the Smarter Living Media Event walkthrough and
  the AIoT timeline sits in the middle. Reverse this: the **AIoT H2 2026 timeline becomes the homepage**,
  every milestone becomes an immersive experience, the **Smarter Living Media Event becomes the flagship
  October milestone** that opens into the (unchanged) walkthrough, and the Amazon/product-availability
  beat is restored to its natural place at the end of that walkthrough. The whole site becomes one
  continuous chronological journey (Aug → Dec).

They interlock because CR‑02 changes the milestone structure that CR‑01's IFA experience lives in.
Implementation is therefore **phased: Phase A (CR‑02 restructure) first, then Phase B (CR‑01 IFA build)**.
This is one design doc; each phase is independently shippable and testable.

## Confirmed decisions

1. **Scope** — Both change requests, one design doc, implemented Phase A → Phase B.
2. **Milestone structure** — **7 nodes, one per initiative** (was 5). `MILESTONE_COUNT` 5 → 7.
3. **IFA fidelity of interaction** — **Cinematic scripted flythrough** (scroll-driven, reusing the existing
   camera model), not a free-roam interactive sub-app. Floor-map zone labels may be optionally clickable to
   scrub the camera within the IFA segment, but there is no separate navigation/state machine.
4. **IFA visual fidelity** — **Hybrid**: procedural Three.js geometry + canvas-generated signage textures,
   plus one baked branding asset (`/public/ifa/ifa-logo.png`) for the crispest wordmark. No external footage,
   no runtime network fetches. Consistent with the current no-asset, offline-safe architecture.
5. **Architecture for CR‑02** — **Reorder the single scroll runway** (Approach A) with a **local-progress
   remap** for the relocated walkthrough band (technique C) so the preserved walkthrough camera code runs
   effectively verbatim. Rejected: nested "walkthrough mode" with a second scroll context (breaks the
   single-progress model the codebase relies on and the "keep scrolling into November" beat).

## Current architecture (baseline)

One 0→1 scroll drives a weighted segment list in `src/lib/timeline.ts`:

```
[intro keynote] arrival → 8 zones → finale → timeline → ms0..ms4 → closing → amazon
```

- `src/lib/timeline.ts` — segment weights, world layout, milestone helpers, camera spline (`sampleCamera`,
  `sampleTimelineCamera`). Hero milestone is hardcoded as `index === 2` in several places.
- `src/lib/content.ts` + `content/experience.json` — all copy; `Milestone` / `TimelineContent` types.
- `src/components/Scene.tsx` — mounts Hall, 8 `ZoneEnvironment`s, `FinaleScene`, `TimelineScene`,
  5 `MilestoneEnvironment`s, `CameraRig`.
- `src/components/MilestoneEnvironment.tsx` — `EnvironmentSet` switches on index (0 ScreenWall, 1
  InteractionTables, 2 IfaHall, 3 AssemblyLine, 4 LaunchStage).
- Overlays: `IntroOverlay` (event keynote, gated `progress < 0.05`), `TimelineOverlay`, `AmazonOverlay`,
  `HUD` (chapter nav / breadcrumbs), `ZoneCaptions`, `ProductPanel`.

---

## Phase A — Flow restructure (CR‑02)

### A1. New scroll runway

Reorder `weights` in `src/lib/timeline.ts` to:

```
timeline          (roadmap overview reveal; premium landing keynote sits over it at p≈0)
ms0   Aug         Air Purifier Pre-Heat & Launch          env: control-room
ms1   Sep         AIoT Offline Experience                 env: experience-zone
ms2   Sep 4–8     IFA Berlin 2026                          env: ifa            (extra weight; Phase B)
ms3   Oct         Xiaomi Smarter Living Media Event        env: sl-portal      (flagship / entry)
  arrival → 8 zones → finale → amazon    ← relocated, preserved Smarter Living walkthrough
  slreturn        camera rises from the venue back to the October node
ms4   Nov         Air Conditioner Pre-Heat                 env: control-room
ms5   Nov         Large Appliance Factory Visit            env: assembly-line
ms6   Dec         Air Conditioner Launch                   env: launch-stage
closing           "One Shared Vision"                      (now genuinely the end)
```

Because the walkthrough camera keyframes are already derived from `segment("arrival")`, `zoneSegment(i)`,
`segment("finale")`, reordering the weights automatically repositions them. The real work is in
`sampleCamera`: rewrite its dispatch to route by **which segment band `p` falls in** (currently a fixed
priority chain that assumes amazon-last / timeline-middle / walk-first).

`MILESTONE_COUNT` 5 → 7. `milestoneNodeX` distributes 7 nodes. `milestoneCenterZ` /
`milestoneCenter` and all `hero` visual treatment become **data-driven** off a `hero: true` flag on the
milestone (see A5) instead of the hardcoded `index === 2`.

### A2. Timeline is the homepage (CR‑02 §1)

- On load, the illuminated timeline overview is the first thing shown; the `timeline` segment is first in
  the runway.
- **Premium landing kept.** `IntroOverlay` is retargeted to introduce the **roadmap** using
  `timeline.intro` copy (kicker "The Journey Continues", heading "One Connected AIoT Strategy"). Button copy
  → "Begin the Journey". It gates on the timeline-overview band at the top (`progress < timeline.start + ε`)
  and `!introDone`, then fades as the user scrolls into `ms0`.
- Scrolling begins the roadmap from the first milestone; the timeline is the primary navigation experience.

### A3. Restore the Amazon ending (CR‑02 §5, §6, §7, §8)

- Move the `amazon` segment to sit **immediately after `finale`**, inside the relocated walkthrough band.
  Natural order becomes: Product Experience Zones → Grand Finale → *One Ecosystem. One Home.* →
  Amazon transition animation → **product-availability glass card** → Return to timeline.
- The Amazon fly-to-grid + `AmazonOverlay` play unchanged; only their position in the runway moves.
- **Product-availability message** (CR‑02 §7): the approved concluding message is displayed on the existing
  premium floating glass card immediately after the Amazon transition. Copy stored verbatim in JSON
  (`content.amazon.note`, or a dedicated `content.amazon.availabilityMessage`), rendered via the existing
  glass-card style. Exact text:

  > While not every product showcased is intended for launch in India, each has been carefully curated to
  > demonstrate the depth of Xiaomi's global AIoT ecosystem and our long-term vision for smart living. This
  > showcase is designed to strengthen Xiaomi's premium innovation perception, reinforce our technology
  > leadership, and inspire meaningful media storytelling that extends beyond individual product launches.

- The previously stranded post-`closing` Amazon beat is removed (it now lives inside the walkthrough).

### A4. October entry & return transitions (CR‑02 §4, §8)

- **Entry (`ms3`)** — a short scroll-driven transition: camera zooms toward the Smarter Living milestone
  card; the card expands; the timeline gently fades; the camera blends into the existing `arrival` opening
  pose so there is **no camera jump** into the walkthrough. The Smarter Living **event keynote**
  (`event.intro`) plays as a cinematic title overlay during this transition (preserved visuals — see A6).
- **Walkthrough** — plays exactly as today (A6).
- **Return (`slreturn`)** — the mirror of entry: the availability glass card fades, the camera pulls back
  from the venue, the October node re-collapses into the spine, and the visitor is back on the timeline at
  October. Scrolling continues naturally into **ms4 (Nov)**.

### A5. Milestone content mapping (7 nodes)

`content/experience.json` → `timeline.milestones` rewritten to 7 entries. Each gains an `env` string
(drives `EnvironmentSet`) and an optional `hero: true`. Product ids reuse existing entries.

| idx | id | month | dateLabel | title | env | accent | hero | products |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | `purifier-launch` | August 2026 | AUG | Air Purifier Pre-Heat & Launch | control-room | `#5ec8f2` | | purifier-6, purifier-4compact |
| 1 | `aiot-offline` | September 2026 | SEP | AIoT Offline Experience | experience-zone | `#ffb46a` | | pb-67w, pb-165w, pb-ultrathin, pb-qi22, purifier-6, purifier-4compact |
| 2 | `ifa-berlin` | 4–8 September 2026 | SEP 4–8 | IFA Berlin 2026 | ifa | `#ff6900` | | (see Phase B) |
| 3 | `smarter-living` | October 2026 | OCT | Xiaomi Smarter Living Media Event | sl-portal | `#ff6900` | ✔ | — (opens the walkthrough) |
| 4 | `ac-preheat` | November 2026 | NOV | Air Conditioner Pre-Heat | control-room | `#7ecb8f` | | ac-fresh-air-pro, ac-natural-wind |
| 5 | `factory-visit` | November 2026 | NOV | Large Appliance Factory Visit | assembly-line | `#7ecb8f` | | ac-fresh-air-pro, ac-natural-wind |
| 6 | `ac-launch` | December 2026 | DEC | Air Conditioner Launch | launch-stage | `#ff6900` | | ac-fresh-air-pro |

- **Flagship** = ms3 (Oct, Smarter Living); **strong secondary** = ms2 (IFA). `hero` flag drives the larger
  node / glow / camera framing that `index === 2` drives today.
- `EnvironmentSet` switch is refactored from **index-based to `env`-based** (`control-room`,
  `experience-zone`, `ifa`, `sl-portal`, `assembly-line`, `launch-stage`). Existing env components are
  reused: `control-room` = current `ScreenWall`; `experience-zone` = `InteractionTables`;
  `assembly-line` = `AssemblyLine`; `launch-stage` = `LaunchStage`. `sl-portal` is a small new venue
  marquee/portal the camera dives through. `ifa` is the Phase‑B `IfaExperience`.
- Old `IfaHall` (arches) is removed/replaced by `IfaExperience`.
- Copy (headline/body/bullets) authored from the PDF roadmap; keep existing copy where a milestone maps
  1:1 to a former one.

### A6. Preserve the Smarter Living walkthrough exactly (CR‑02 §3)

No behavioural or visual edits to: `Hall`, `ZoneEnvironment`, `ClimatePods`, `FinaleScene`,
`ProductDisplay`, `ProductPanel`, `AmazonOverlay`, `effects.tsx`, `props.tsx`, `models.tsx`, the 8 zones'
content, camera choreography *within* the walkthrough, timing, lighting, transitions. Only **where** they
sit in the runway changes. Technique:

- **Local-progress remap.** Introduce a helper mapping the runway's walkthrough band
  `[arrival.start, amazon.end]` to a local `0..1`, and feed the existing walk/finale/amazon camera logic
  that local value — so the preserved code path is effectively unchanged.
- **Event keynote** (`event.intro`) is re-gated from `progress < 0.05` to the relocated `arrival` window,
  shown as a cinematic overlay during the A4 entry transition. Its markup/animation is preserved; the only
  change is *when* it appears (satisfying "the only change is how users arrive"). The legacy
  "Enter the Experience" click gate is no longer the entry mechanism (entry is scroll-driven per §4).

### A7. HUD / breadcrumbs & misc (CR‑02 §1; CR‑01 §1.1)

- `HUD` chapter stops rebuilt for the new order: timeline → 7 milestones (month labels; IFA shows
  `SEP 4–8`) → the Smarter Living walkthrough nested under October → closing. Letterbox/vignette logic
  updated for the new segment positions.
- `TimelineOverlay`: strip + per-milestone panel already data-driven over `timeline.milestones`; extends to
  7 automatically. `experienceB`/replay wiring updated for the reordered runway (October panel offers
  "Enter the Media Event ↓" that scrolls into the walkthrough band; closing "Replay" scrolls to top).
- Generalize hardcoded `hero === 2` in `timeline.ts`, `TimelineScene.tsx`, `MilestoneEnvironment.tsx` to the
  `hero` flag.

---

## Phase B — IFA Berlin 2026 experience (CR‑01)

Built as a scripted cinematic flythrough inside the `ms2` segment, which receives extra runway weight
(~2.5–3.0, like the former hero) to fit the multi-beat journey.

### B1. Camera journey — sub-beats across `ms2` (CR‑01 §2, §5)

Multiple keyframes authored across `ms2`'s local 0→1, reusing the existing Catmull-Rom spline / easing so
motion matches the rest of the site:

```
approach → MESSE BERLIN facade → IFA entrance plaza → floor-map flyover
        → dip through 2–3 representative halls → rise back → hand off to ms3 (Oct)
```

### B2. Entrance scene (CR‑01 §2)

Procedural geometry + canvas/baked textures:
- Stylised **MESSE BERLIN** stone facade with rooftop lettering (canvas-texture text) + a large hero
  banner on the facade.
- Giant white **IFA** block letters from primitives, on the **stepped plinth studded with coloured
  squares** (emissive quad grid) from the reference photo.
- **Double rows of flags** lining the plaza, **digital ad towers** (emissive canvas-texture panels),
  **entrance banners**, and a **procedural crowd** of walking visitors so the plaza is never empty.
- One baked asset: `/public/ifa/ifa-logo.png` (crisp wordmark); all other signage canvas-generated.
- Camera arrival uses the same cinematic movement as the rest of the site.

### B3. Interactive floor map (CR‑01 §3, §4)

A large illuminated floor plan the camera flies over — **not an exact replica**, but preserving:
- the **overall zoning concept** and **hall grouping** (colour-coded zone blocks clustered like the real
  map),
- **similar colour coding** (see legend below),
- **labelled exhibition zones** (floating labels / navigation hotspots),
- **connected pathways** between halls (glowing lines),
- **highlighted visitor movement** (animated dots flowing along pathways).

Zone labels are **optionally clickable** to scrub the camera to that hall's moment within `ms2` (light
interactivity; no separate state machine). All zone/stage names + colours live in JSON.

Colour legend (from the IFA floor map):

| Zone | Colour |
| --- | --- |
| Home Appliances | blue |
| Smart Home | red |
| Communication & Connectivity | cyan |
| Computing & Gaming | yellow |
| Home & Entertainment | magenta |
| Audio | teal |
| Beauty Tech & Wellbeing | orange |
| Mobility | purple |
| Content Creation | green |
| IFA Next | green (gradient) |
| IFA Global Markets | maroon |

Plus special stages / areas as labels: Creator Hub, Content Creation, Innovation Stage, Dream Stage,
Retail Innovation Zone, IFA Global Markets, Reseller Park, IFA GM Expert Talks Stage.

### B4. Exhibition halls (CR‑01 §6)

2–3 representative halls as procedural bays the camera dips into, each with: **LED walls** (emissive canvas
textures), **hanging banners**, **hall-identifier signage**, **booths** (primitives), a **product-demo
plinth** reusing existing `ProductModel`s, **procedural crowd**, and **animated dynamic lighting** — so
each hall feels alive. Avoid empty spaces.

### B5. Content & date consistency (CR‑01 §1.1, §8)

New `ifa` sub-object on the IFA milestone in `experience.json`: entrance-screen text, zone list
(name + colour), hall definitions, and a single source-of-truth date **"4–8 September 2026"**. This date
flows to: the milestone card, IFA entrance screen, info panels, HUD breadcrumb (`SEP 4–8`), experience
title, and timeline overview — consistent everywhere. The IFA panel copy communicates that Xiaomi India is
taking media to IFA Berlin 2026, the world's largest consumer-electronics & home-appliances trade show.

### B6. Design language preserved (CR‑01 §7)

IFA info panels reuse the existing `tl-panel` glass style. Dark premium theme, glassmorphism, typography,
existing animations/transitions/navigation untouched. Only the 3D environment + floating labels are new.

---

## Content schema changes (`content/experience.json` + `src/lib/content.ts`)

- `Milestone` gains: `env: string`, `hero?: boolean`, and optional `ifa?: IfaContent`.
- New `IfaContent` type:
  ```jsonc
  "ifa": {
    "dates": "4–8 September 2026",
    "entrance": { "venue": "Messe Berlin", "banner": "For the bold. For the curious. For all.", "title": "IFA Berlin 2026" },
    "zones": [ { "name": "Home Appliances", "color": "#1565c0" }, /* … all zones + stages … */ ],
    "halls": [ { "id": "home-appliances", "name": "Home Appliances", "color": "#1565c0", "products": ["…"], "signage": "…" }, /* 2–3 */ ]
  }
  ```
- `amazon` gains `availabilityMessage` (verbatim PDF text) if not reusing `note`.
- `timeline.milestones` rewritten to the 7 entries in A5.

## New / changed components (full list)

Phase A:
- `src/lib/timeline.ts` — reordered `weights`; `MILESTONE_COUNT` → 7; `sampleCamera` dispatch rewritten to
  route by segment band; local-progress remap helper for the walkthrough band; `ms3` entry + `slreturn`
  return camera keyframes; `hero`-flag-driven node/depth helpers.
- `src/lib/content.ts` — `Milestone.env`, `Milestone.hero`, `IfaContent`, amazon message field.
- `content/experience.json` — 7 milestones; relocated amazon copy + availability message.
- `src/components/MilestoneEnvironment.tsx` — `env`-based `EnvironmentSet`; new `sl-portal` env; `hero`
  flag; remove `IfaHall`.
- `src/components/TimelineScene.tsx` — 7 nodes; `hero`-flag visuals.
- `src/components/overlays/IntroOverlay.tsx` — retarget to roadmap landing; add arrival-gated Smarter
  Living keynote (preserved visuals).
- `src/components/overlays/HUD.tsx` — rebuilt chapter stops; updated letterbox logic.
- `src/components/overlays/TimelineOverlay.tsx` — October "enter the media event" wiring; reordered jumps.
- `src/components/overlays/AmazonOverlay.tsx` — availability glass card content (position/order only).
- `app/globals.css` — any new styles for the sl-portal/landing tweaks.

Phase B:
- `src/components/IfaExperience.tsx` (new) — facade, plaza, IFA letters + coloured plinth, flags, ad
  towers, crowd, floor map, halls. Mounted for the `ms2` window.
- `src/components/Crowd.tsx` (new) — lightweight instanced procedural crowd (reused by plaza + halls).
- `src/lib/textures.ts` — IFA texture generators (MESSE BERLIN sign, banners, LED-wall content, floor-map
  labels).
- `src/lib/timeline.ts` — `ms2` sub-beat camera keyframes; extra `ms2` weight.
- `src/components/Scene.tsx` — mount `IfaExperience` (via the `env: "ifa"` path).
- `public/ifa/ifa-logo.png` (new baked asset).

## Interaction & navigation

- Scroll drives progress as today; each milestone is a segment; the walkthrough is a band inside the runway.
- HUD dots + timeline strip jump via the existing `scrollToProgress`.
- October panel → "Enter the Media Event ↓" scrolls into the walkthrough band; closing "Replay" → top.
- IFA floor-map labels optionally scrub within `ms2`.

## Performance

Instanced crowd; canvas textures; IFA bay + crowd culled to the `ms2` window (like `zoneVisible`);
milestone bays culled to their windows; no new runtime network fetches. DPR clamp + effect composer
unchanged. Target 60 fps on a mid-range laptop.

## Testing

`npm run typecheck` + `next build` must pass. Manual verification via dev server + browser:

Phase A: site loads on the timeline (not the walkthrough); roadmap landing shows; scroll Aug→Dec; the 7
nodes render with correct labels/dates; October dives into the walkthrough with no camera jump; walkthrough
plays identically to before; Grand Finale → One Ecosystem → Amazon → availability card → return to timeline
at October; scrolling continues into Nov/Dec; closing is the true end; HUD stops/breadcrumbs correct.

Phase B: IFA milestone plays the arrival → plaza → floor-map → halls → return flythrough; MESSE BERLIN +
IFA branding read clearly; floor map shows colour-coded zones, labels, pathways, visitor movement; halls
feel alive (crowd, LED walls, signage, lighting); date "4–8 September 2026" appears consistently; camera
matches the site's cinematic feel; 60 fps holds; no external fetches.

## Traceability (PDF → design)

| PDF item | Addressed in |
| --- | --- |
| CR‑01 §1.1 Update dates (4–8 Sep) everywhere | A7, B5 |
| CR‑01 §2 Recreate Messe Berlin entrance | B2 |
| CR‑01 §3 Official IFA hall naming (labels/hotspots) | B3 |
| CR‑01 §4 Interactive floor map (zoning, colours, pathways, movement) | B3 |
| CR‑01 §5 Camera journey sequence | B1 |
| CR‑01 §6 Exhibition halls feel alive | B4 |
| CR‑01 §7 Maintain website design language | B6, decision 4 |
| CR‑01 §8 Overall objective (Xiaomi → IFA) | B5 |
| CR‑02 §1 Timeline is the homepage | A2 |
| CR‑02 §2 Move Smarter Living to October; revised roadmap | A1, A5 |
| CR‑02 §3 Preserve the walkthrough exactly | A6 |
| CR‑02 §4 Timeline→experience transition | A4 |
| CR‑02 §5 Restore the original ending | A3 |
| CR‑02 §6 Restore Amazon transition flow | A3 |
| CR‑02 §7 Restore product-availability message | A3 |
| CR‑02 §8 Return to the timeline | A4 |

## Out of scope

Real GLB IFA/venue models, real IFA/Messe Berlin footage or photographic environments, free-roam
click-to-enter hall navigation, a CMS backend, multi-language. The schema leaves room for these later.
