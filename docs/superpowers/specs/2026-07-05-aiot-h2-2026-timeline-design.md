# Interactive AIoT H2 2026 Timeline — Design

Date: 2026-07-05
Status: Approved (design confirmed with stakeholder; decisions below fill gaps left by the brief in `req.md`)

## Purpose

Extend the existing Xiaomi Smarter Living Media Event virtual walkthrough into a broader **interactive AIoT
H2 2026 roadmap**. After the Grand Finale ecosystem showcase, the camera zooms out and the ecosystem morphs
into a glowing, illuminated timeline. Five milestones become interactive destinations the visitor travels
to — each an immersive, distinct environment — so leadership can see how every initiative (product launches,
media experiences, factory visits) fits one connected AIoT strategy. It must feel like a continuation of the
existing premium experience, not a separate page. Concept: *travel through time, not just a venue.*

## Key decisions (gaps filled from the brief)

1. **Placement** — The timeline is inserted as new scroll segments **between `finale` and `amazon`**, so the
   existing arrival → 8 zones → finale flow is untouched and the Amazon India commerce beat remains the final
   act. The ecosystem morphs into the timeline directly out of the finale.
2. **Milestone fidelity — hybrid** — Each milestone is a themed *vignette bay* (distinct lighting/color/
   atmosphere + light set-dressing from Three.js primitives + reused product models) plus a premium glass
   content panel. Not five fully-bespoke modeled environments. This keeps it cinematic, consistent with the
   existing look, and within the 60fps target.
3. **Navigation — scroll + click** — Milestones are driven by the same scroll runway (each is a segment) and
   are also clickable jump targets (via the existing `scrollToProgress` pattern). Camera travel dives from
   the timeline line into each milestone and rises back out, giving "return to the timeline" for free.
4. **Content in JSON** — All copy lives in `content/experience.json` under a new `timeline` object; authored
   from `req.md` and editable without touching code, matching the existing content-driven architecture.
5. **Offline-safe** — Reuse existing techniques: canvas-texture text for node/date labels (no font fetch),
   procedural lighting/particles (no HDR/asset downloads).

## Flow & progress segments

New weighted segments inserted between `finale` and `amazon` in `src/lib/timeline.ts`:

```
arrival → [8 zones] → finale → timeline → ms1 → ms2 → ms3 → ms4 → ms5 → closing → amazon
```

- **`timeline`** — finale ecosystem zooms out and morphs into a glowing horizontal Xiaomi-orange line with 5
  illuminated nodes. Camera at a wide head-on overview of the full line.
- **`ms1…ms5`** — one segment each. Camera path within a segment: **dive** from the line into the milestone
  environment (first ~third) → **dwell** in the environment (middle) → **rise** back toward the line (last
  ~third). Clickable node jumps scroll to the dwell point.
- **`closing`** — camera rises to a wide shot illuminating all 5 nodes; closing message displays; camera then
  flies back toward the finale rotunda so the existing Amazon fly-to-grid + overlay play unchanged.

Milestone `ms3` is the strategic peak (September) — largest node, strongest glow, largest animation, most
visually dominant environment.

## World layout

- Timeline overview lives in a new deep bay beyond the finale (further −Z than `FINALE_Z`). A glowing
  horizontal line spans the X axis at ~2.2m height with 5 evenly-spaced nodes.
- Each milestone environment occupies a bay set back (−Z) behind its node. `milestoneCenter(i)` derives from
  node X and a per-index depth. Bays are mounted only when their segment window is near (culling), mirroring
  `zoneVisible`.

## Content schema (`content/experience.json` → new `timeline` object)

```jsonc
"timeline": {
  "enabled": true,
  "chapter": "H2 2026 Roadmap",
  "intro": { "kicker": "...", "heading": "...", "subheading": "..." },
  "milestones": [
    {
      "id": "purifier-launch",
      "month": "August 2026",
      "dateLabel": "Aug 2026",
      "title": "Air Purifier Launch",
      "focus": "Pre-heat phase (7–10 days)",
      "environment": "Digital marketing control room",
      "accent": "#5ec8f2",
      "icon": "purifier",
      "state": "future",          // completed | active | future (active is derived at runtime)
      "headline": "...",
      "body": "...",
      "bullets": ["Social media calendar", "Teaser campaign", "..."],
      "products": ["purifier-6", "purifier-4compact"]
    }
    // ms2 AIoT Offline @ Q Note, ms3 Hero (IFA + Media Event), ms4 Factory, ms5 AC Launch
  ],
  "closing": {
    "title": "One Shared Vision",
    "message": "Every initiative, every launch, every experience, and every innovation contributes to one shared vision—establishing Xiaomi as India's most innovative and trusted AIoT ecosystem."
  }
}
```

Milestone content authored from `req.md`:

- **ms1 — August 2026, Air Purifier Launch.** Focus: pre-heat (7–10 days). Env: digital marketing control
  room. Bullets: social media calendar, teaser campaign, product reveal, launch countdown, creator content,
  performance dashboards. Products: Air Purifier 6, Air Purifier 4 Compact.
- **ms2 — September 2026, AIoT Offline Experience @ Q Note Launch.** Focus: interactive experience inside the
  offline smartphone launch venue. Env: premium experience zone. Bullets: charging experiences, air
  purification demos, product interaction tables, hands-on media engagement, smart living displays. Products:
  Power Bank 20000 67W, 20000 165W, MagSafe 45W, Ultra Thin MagSafe; Air Purifier 6, Air Purifier 4 Compact.
- **ms3 — 4–6 September 2026, Hero Milestone.** Strategic peak; larger animations, strong emphasis. Experience
  A: airport departure → IFA Berlin 2026 halls/global showcase. Experience B: connects to the existing
  virtual website (Smarter Living Media Event) as the centrepiece — a replay action.
- **ms4 — November 2026, AC Pre-Heat & Factory Visit.** Focus: engineering excellence + storytelling. Env:
  guided factory tour. Bullets: component manufacturing, compressor technology, energy efficiency, smart
  sensors, quality testing, assembly line.
- **ms5 — December 2026, AC Launch.** Focus: culmination of the H2 AIoT strategy. Env: factory doors opening
  into a premium launch stage. Bullets: product reveal, launch event, media photography, digital campaign,
  online availability, hero product showcase.

## New / changed components

- **`src/lib/timeline.ts`** — add timeline world constants, new segments (weights) between finale and amazon,
  milestone world positions + culling helpers, and camera keyframes for zoom-out, per-milestone dive/dwell/
  rise, and the closing wide shot + return-to-rotunda. `sampleCamera` extended to cover the new range while
  the existing amazon branch is preserved.
- **`src/lib/content.ts`** — add `Milestone` and `TimelineContent` types; expose parsed `timeline`.
- **`content/experience.json`** — add the `timeline` object (copy above).
- **`src/components/TimelineScene.tsx`** (new) — glowing spine + animated nodes with the three states
  (Completed: soft glow; Active: expand + animate; Future: semi-transparent), floating date indicators and
  month labels via canvas textures. Morph-in ramp keyed off the `timeline` segment; ms3 node visually
  dominant. Mounted across timeline…closing.
- **`src/components/MilestoneEnvironment.tsx`** (new) — one themed bay per milestone, culled by segment
  window. Distinct lighting/color + primitive set-dressing + reused `ProductModel`s:
  - ms1: dark control room, wall of glowing dashboard screens (canvas textures), purifiers.
  - ms2: warm experience zone, interaction tables, power banks + purifiers, charging-glow.
  - ms3 (hero): airport-departure motif → IFA Berlin arches/exhibition glow; largest scale.
  - ms4: industrial assembly-line rail with moving segments, compressor/component props, AC models.
  - ms5: sliding factory doors opening onto a lit launch stage, hero AC on rotating plinth, photo-flash bloom.
- **`src/components/overlays/TimelineOverlay.tsx`** (new) — floating premium glass timeline strip (all
  milestones + month labels + live state, clickable to jump), per-milestone content panel (date, focus,
  bullets, products) sliding in like `ProductPanel`, and full-screen closing message. Per-milestone actions:
  jump between milestones, "↑ Return to timeline", continue scrolling, replay (ms3 → scroll to arrival).
- **`src/components/Scene.tsx`** — mount `<TimelineScene/>` and the `<MilestoneEnvironment/>` set.
- **`src/components/ExperienceApp.tsx`** — mount `<TimelineOverlay/>`.
- **`src/components/overlays/HUD.tsx`** — extend chapter nav stops to include timeline + 5 milestones +
  closing.
- **`app/globals.css`** — styles for the timeline strip, milestone glass panel, closing message, node labels,
  action buttons.

## Interaction & navigation

- Scroll drives progress as today; each milestone is a segment.
- Timeline strip and HUD dots jump via `scrollToProgress(segment.start + offset)`.
- "Return to timeline" jumps to the `timeline` segment overview.
- Replay (ms3 Experience B) scrolls to top (arrival), re-entering the existing walkthrough — one continuous
  journey.
- Product focus interaction inside milestone bays reuses the existing focus/`ProductPanel` mechanism where a
  milestone product maps to an existing zone product; otherwise the milestone panel is informational.

## State logic (node visuals)

- **Completed** — softly glowing (progress has passed the milestone's segment).
- **Active** — expanded + animated (the milestone whose segment currently contains progress).
- **Future** — slightly transparent until selected (segments not yet reached).
Derived at runtime from smoothed progress vs each milestone segment; `content` `state` field is an optional
override/default.

## Performance

- Milestone bays mount only within their progress window (culling like `zoneVisible`).
- Reuse instanced/points particles and canvas-texture text; no new network fetches.
- DPR clamp and effect composer unchanged. Target 60fps on a mid laptop.

## Testing

`npm run typecheck` + `next build` must pass. Manual verification via dev server + browser:
scroll through timeline → each milestone → closing → Amazon; click each node in the strip and each HUD dot;
verify state transitions (completed/active/future); verify ms3 replay returns to arrival; verify the
closing→Amazon transition plays with no camera jump; verify all copy is populated from JSON.

## Out of scope

Real GLB milestone-environment models, real IFA/factory footage, CMS backend, multi-language. The content
schema leaves room for these later.
