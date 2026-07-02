# Xiaomi Smarter Living Media Event — Virtual Walkthrough: Design

Date: 2026-07-02
Status: Approved-by-spec (built directly from the stakeholder brief; decisions below fill the gaps the brief left open)

## Purpose

A cinematic, scroll-driven 3D digital twin of the Smarter Living Media Event venue, used by leadership,
agencies and vendors to experience the event before it is built. Not e-commerce, not a landing page.

## Key decisions (gaps filled from the brief)

1. **Product visuals** — No 3D assets (GLB/CAD) exist for the products, so all products are
   *stylized procedural models* built from Three.js primitives with premium PBR materials
   (matte aluminium, glass, soft-touch plastic, LED emissives). Each product references a
   `model` key from a registry (`ac-vertical`, `washer-drum`, `fridge-french`, `tv`, `purifier-tower`,
   `powerbank`, …) with per-product color/scale params. Real GLB models can replace registry
   entries later without touching the experience code.
2. **Single scene, single scroll** — one WebGL canvas, fixed full-screen; a tall scroll proxy drives
   normalized progress 0→1. A Catmull-Rom camera spline runs Lobby → 8 zones → Finale rotunda.
   The Amazon transition is the final progress segment (3D products fly out + DOM overlay).
3. **Editable content** — ALL copy lives in `content/experience.json`: event title, welcome lines,
   per-zone title/tagline/description/talking points, per-product name/tagline/description/specs/
   presenter notes/video URL, `highlighted` flag, and Amazon card config (price/rating/badge).
   Text animation per block is selectable (`fade | slide | scale | stagger | dissolve`).
4. **Aesthetic** — "museum at night": dark architectural shell, warm ambient lighting, glass,
   white pedestals, Xiaomi-orange LED accents; per-zone accent lighting (cool blue for climate,
   aqua for laundry, warm for kitchen, orange→blue transition for Air Care hero, etc.).
5. **Offline-safe** — no runtime CDN fetches: LED-wall text via canvas textures (no troika font
   fetch), reflections via procedural `<Environment>` light-formers (no HDR download),
   optional ambient audio synthesized with WebAudio (no audio files).

## Architecture

- **Next.js 15 app router**, one route. `page.tsx` → dynamic import (`ssr:false`) of the client experience.
- **State**: Zustand store — raw scroll progress, smoothed progress, phase/zone activity, focused
  product, audio toggle, quality tier.
- **Timeline** (`src/lib/timeline.ts`): computes weighted progress segments (arrival 1.3, each zone 1.0,
  finale 1.5, amazon 1.0) and zone world positions (zones alternate left/right along −Z), and builds
  the camera spline + look-at targets.
- **Scene graph**: `Hall` (floor/walls/ceiling/LED strips/entry doors/lobby LED wall) + one
  `ZoneEnvironment` per zone (platforms, LED title panel, accent lights, per-zone effect component)
  + `FinaleScene`. Zones mount only when the camera is near (progress-window culling).
- **Effects**: airflow particle streams (Climate), spinning transparent drum + suds particles (Laundry),
  cold-mist + shelf glow (Kitchen), robot path + disappearing dirt dots (Cleaning), animated canvas
  screen (Entertainment), glass chambers with pollution→clean particle/light transition (Air Care hero),
  energy arcs/floating devices (Power), turntable lifestyle displays (Lifestyle).
- **Interaction**: click product → scroll locks, GSAP tweens camera to product, DOM spec panel opens
  (name/description/specs/notes/video), product turntables + drag to rotate; close → resume walk.
- **Finale**: lightweight duplicates of every product fly (staggered lerp) into concentric ecosystem
  rings around a glowing core; camera orbits. Then only `highlighted` products fly toward the camera
  as the Amazon India-style DOM overlay (header, search, listing cards) staggers in — Experience → Learn → Buy.
- **Performance**: DPR clamp [1, 1.75], no shadow maps (blob shadows), instanced/points particles,
  zone culling, `powerPreference: high-performance`. Target 60 fps on a mid laptop.

## Testing

`npm run typecheck` + `next build` must pass; manual verification via dev server + browser preview
(scroll through all segments, click a product in each zone, verify Amazon overlay population from JSON).

## Out of scope (future platform hooks already supported by content schema)

Real GLB product models, real product videos/images, CMS backend, multi-language.
