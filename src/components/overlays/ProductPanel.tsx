"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { content } from "@/src/lib/content";
import { liveState, useExperience } from "@/src/lib/store";

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [images]);
  return (
    <div className="panel-gallery">
      <motion.div
        key={images[active]}
        className="panel-gallery-hero"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={name} draggable={false} />
      </motion.div>
      {images.length > 1 && (
        <div className="panel-gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              className={`panel-thumb ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductPanel() {
  const focus = useExperience((s) => s.focus);
  const setFocus = useExperience((s) => s.setFocus);
  const dragRef = useRef({ down: false, lastX: 0 });

  const zone = focus ? content.zones[focus.zone] : null;
  const product = zone ? zone.products[focus!.product] : null;

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, setFocus]);

  return (
    <AnimatePresence>
      {product && zone && (
        <motion.div
          key={product.id}
          className="panel-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* drag stage: rotate the product */}
          <div
            className="panel-stage"
            onPointerDown={(e) => {
              dragRef.current = { down: true, lastX: e.clientX };
              liveState.dragging = true;
            }}
            onPointerMove={(e) => {
              if (!dragRef.current.down) return;
              const dx = e.clientX - dragRef.current.lastX;
              dragRef.current.lastX = e.clientX;
              liveState.spin += dx * 0.008;
              liveState.spinVelocity = dx * 0.35;
            }}
            onPointerUp={() => {
              dragRef.current.down = false;
              liveState.dragging = false;
            }}
            onPointerLeave={() => {
              dragRef.current.down = false;
              liveState.dragging = false;
            }}
          >
            <div className="panel-drag-hint">⟲ Drag to rotate · Esc to close</div>
          </div>

          <motion.aside
            className="panel"
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <button className="panel-close" onClick={() => setFocus(null)} aria-label="Close">
              ✕
            </button>
            <div className="panel-chapter" style={{ color: zone.accent }}>
              {zone.chapter} · {zone.name}
            </div>
            <h2 className="panel-name">{product.name}</h2>
            <div className="panel-tagline" style={{ color: zone.accent }}>
              {product.tagline}
            </div>
            <p className="panel-desc">{product.description}</p>

            {product.images && product.images.length > 0 && (
              <Gallery images={product.images} name={product.shortName} />
            )}

            <div className="panel-section">Key specifications</div>
            <ul className="panel-specs">
              {product.specs.map((s, i) => (
                <li key={i}>
                  <span className="caption-dot" style={{ background: zone.accent }} />
                  {s}
                </li>
              ))}
            </ul>

            {product.video && (
              <video className="panel-video" src={product.video} controls playsInline />
            )}

            {product.notes && (
              <div className="panel-notes">
                <div className="panel-notes-label">Presenter notes</div>
                {product.notes}
              </div>
            )}

            {product.highlighted && (
              <div className="panel-highlight">⭐ Featured launch — appears in the Amazon India showcase</div>
            )}

            {product.link && (
              <a
                className="panel-link"
                href={product.link}
                target="_blank"
                rel="noreferrer"
              >
                View on mi.com ↗
              </a>
            )}

            <button className="panel-continue" onClick={() => setFocus(null)}>
              Continue the walkthrough →
            </button>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
