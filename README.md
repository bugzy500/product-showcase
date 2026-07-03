# Xiaomi Smarter Living — Media Event Virtual Experience

A cinematic, scroll-driven 3D walkthrough of the Smarter Living Media Event venue — a digital twin
stakeholders can explore before the physical event is built.

Scrolling walks a virtual camera through one continuous exhibition hall:

**Arrival → Climate → Laundry → Kitchen → Cleaning → Entertainment → Air Care → Portable Power → Lifestyle → Grand Finale → Amazon India**

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

Built with Next.js 15, React 19, Three.js, React Three Fiber, drei, GSAP, Framer Motion, Zustand.

## Editing content (no code required)

**Everything you read on screen lives in [`content/experience.json`](content/experience.json).**
Edit text, save, and the dev server hot-reloads — the design never changes.

Per zone you can edit: `chapter`, `name`, `tagline`, `description`, `talkingPoints`,
`accent` (zone LED colour), and `textAnimation`.

Per product: `name`, `shortName`, `tagline`, `description`, `specs`, `notes`
(presenter notes shown in the info panel), `video` (URL — a player appears automatically),
`highlighted` (⭐ launches), `amazon` (price / mrp / rating / reviews / badge),
`images` (real product photos — an interactive gallery appears in the info panel and the
first image becomes the Amazon card photo) and `link` (official mi.com product page,
shown as "View on mi.com").

Real product photos live in `public/products/<product-id>/` (sourced from the official
mi.com product pages) and the official Xiaomi logo in `public/brand/mi-logo.png`.
Drop new files there and reference them from `images` to update the galleries.

Text animation styles (`textAnimation` on any block): `fade` · `slide` · `scale` · `stagger` · `dissolve`.

### Entrance keynote panel

The arrival screen is driven by `event.intro`: `heading`, `subheading`, `body` (array of
paragraphs), and `snapshot` (`title` + `items[]` of `icon` / `label` / `value`). Edit these to
change the event objective and the Event Snapshot card — the layout and load animations stay put.

### Climate zone pods

The Climate zone uses `"layout": "pods"` to render four experience pods along a walkway instead of
one platform. Each product carries `pod` (station name), `podTheme` (theme line), `podFeatures[]`,
and `mount` (`"wall"` mounts the AC on the pod's feature wall, `"floor"` stands it on the floor).
Product order is the visitor journey order. Remove `layout` to fall back to the standard platform.

### Grand Finale closing message

`finale.closingTitle` and `finale.closing` add the divider + "Why This Showcase Matters" takeaway
that fades in after the main copy. Delete them to revert to the shorter card.

### Configuring the Amazon India transition

A product flies into the Amazon page when it has **both** `"highlighted": true` **and** an
`"amazon": { ... }` block. Remove either to pull it from the showcase; add them to any product
to include it. Card price, strike-through MRP, star rating, review count and badge all come
from that block.

### Adding a product

Add an object to a zone's `products` array and give it a `model` key from the registry
(`src/components/models.tsx`): `ac-vertical`, `ac-split`, `washer`, `washer-tower`, `washer-mini`,
`fridge-french`, `fridge-cross`, `fridge-threedoor`, `vacuum-stick`, `vacuum-car`, `vacuum-robot`,
`tv`, `purifier-tower`, `purifier-compact`, `powerbank`, `powerbank-qi`, `powerbank-thin`,
`pen`, `hairdryer`, `toothbrush`, `glasses`.

Pedestals, spacing, camera choreography, the finale formation and the Amazon grid all
recompute automatically.

### Adding a zone

Add a zone object to the `zones` array. The hall extends itself: a new segment of the camera
path, a display platform, LED title wall, lighting and chapter navigation are generated from
the data. Choose an `effect` (`airflow`, `laundry`, `kitchen`, `cleaning`, `cinema`, `purifier`,
`power`, `lifestyle`) and an `environment` (`livingroom`, `laundry`, `kitchen`, `home`, `lounge`,
`gallery`, `lab`, `studio`) — or add new ones in `src/components/effects.tsx` / `props.tsx`.

## Architecture

| Layer | Files |
| --- | --- |
| Editable content | `content/experience.json` (+ types in `src/lib/content.ts`) |
| Timeline & camera | `src/lib/timeline.ts` — progress segments, world layout, camera spline, finale formation |
| State | `src/lib/store.ts` — scroll progress, focused product, audio |
| 3D scene | `src/components/` — `Scene`, `Hall`, `ZoneEnvironment`, `ProductDisplay`, `models` (procedural product registry), `effects`, `props`, `FinaleScene`, `CameraRig` |
| UI overlays | `src/components/overlays/` — intro, zone captions, product panel, Amazon page, HUD, ambient audio |

Products are stylised procedural 3D models (no assets to license or load). To use real 3D
assets later, swap a registry entry in `models.tsx` for a GLB-loading component — nothing else changes.

## Performance notes

DPR is clamped, zones cull outside a progress window, particles early-exit when inactive,
shadows are faked with blob textures, and reflections come from a procedural environment —
no network fetches at runtime, targeting 60 fps on a mid-range laptop.
