"use client";

import { AnimatePresence, motion } from "framer-motion";
import { amazonProducts, content } from "@/src/lib/content";
import { useExperience } from "@/src/lib/store";
import { localT, segment } from "@/src/lib/timeline";

/** Minimal geometric silhouettes per product family for the listing cards. */
function CategoryGlyph({ model, accent }: { model: string; accent: string }) {
  const stroke = { stroke: "#fff", strokeWidth: 3, fill: "none", strokeLinecap: "round" as const };
  let inner: React.ReactNode;
  if (model.startsWith("ac")) {
    inner = (
      <>
        <rect x="14" y="26" width="72" height="28" rx="10" {...stroke} />
        <path d="M26 62 q6 6 0 12 M50 62 q6 6 0 12 M74 62 q6 6 0 12" {...stroke} />
      </>
    );
  } else if (model.startsWith("washer")) {
    inner = (
      <>
        <rect x="22" y="14" width="56" height="72" rx="8" {...stroke} />
        <circle cx="50" cy="54" r="18" {...stroke} />
        <circle cx="50" cy="54" r="8" {...stroke} opacity="0.6" />
      </>
    );
  } else if (model.startsWith("fridge")) {
    inner = (
      <>
        <rect x="28" y="10" width="44" height="80" rx="7" {...stroke} />
        <path d="M28 44 h44 M50 10 v34" {...stroke} />
      </>
    );
  } else if (model === "tv") {
    inner = (
      <>
        <rect x="12" y="20" width="76" height="44" rx="5" {...stroke} />
        <path d="M38 78 h24 M50 64 v14" {...stroke} />
      </>
    );
  } else if (model.startsWith("purifier")) {
    inner = (
      <>
        <rect x="32" y="16" width="36" height="66" rx="16" {...stroke} />
        <circle cx="50" cy="34" r="7" {...stroke} />
        <path d="M40 60 h20 M40 68 h20" {...stroke} opacity="0.6" />
      </>
    );
  } else if (model.startsWith("powerbank")) {
    inner = (
      <>
        <rect x="24" y="26" width="52" height="48" rx="10" {...stroke} />
        <path d="M54 34 L42 52 h10 L46 66 L60 48 h-10 z" fill="#fff" stroke="none" />
      </>
    );
  } else if (model === "pen") {
    inner = (
      <>
        <path d="M34 70 L62 22 l8 6 L42 76 z" {...stroke} />
        <path d="M34 70 l-4 12 12 -6" {...stroke} />
      </>
    );
  } else {
    inner = <rect x="26" y="26" width="48" height="48" rx="10" {...stroke} />;
  }
  return (
    <div className="az-glyph" style={{ background: `linear-gradient(140deg, ${accent}cc, #1a1d24)` }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {inner}
      </svg>
    </div>
  );
}

function Stars({ rating = 4.5 }: { rating?: number }) {
  return (
    <span className="az-stars" aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ opacity: i + 0.5 <= rating ? 1 : 0.25 }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function AmazonOverlay() {
  const progress = useExperience((s) => s.progress);
  if (!content.amazon.enabled) return null;
  const amazon = segment("amazon");
  const t = localT(progress, amazon);
  const visible = t > 0.32 && progress < segment("slreturn").start;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="amazon"
          className="az-root"
          initial={{ y: "6%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "8%", opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="az-header">
            <div className="az-logo">
              amazon<span className="az-logo-in">.in</span>
              <svg className="az-smile" viewBox="0 0 60 14" width="52" height="12">
                <path d="M2 3 Q30 16 54 5" stroke="#ff9900" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M54 5 l-5 -2 m5 2 l-4 4" stroke="#ff9900" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div className="az-search">
              <input readOnly value="xiaomi smarter living launches" aria-label="Search" />
              <button aria-label="Search button">⌕</button>
            </div>
            <div className="az-header-right">Xiaomi Brand Store</div>
          </header>

          <div className="az-journey">
            {content.amazon.journey.map((step, i) => (
              <span key={step} className="az-journey-step">
                <span className={`az-journey-chip ${i === content.amazon.journey.length - 1 ? "active" : ""}`}>
                  {step}
                </span>
                {i < content.amazon.journey.length - 1 && <span className="az-journey-arrow">→</span>}
              </span>
            ))}
          </div>

          <div className="az-titleblock">
            <h2>{content.amazon.title}</h2>
            <p>{content.amazon.subtitle}</p>
          </div>

          <motion.div
            className="az-grid"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } } }}
          >
            {amazonProducts.map((p) => (
              <motion.article
                key={p.id}
                className="az-card"
                variants={{
                  hidden: { opacity: 0, y: 36, scale: 0.94 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                {p.amazon?.badge && <div className="az-badge">{p.amazon.badge}</div>}
                {p.images && p.images.length > 0 ? (
                  <div className="az-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0]} alt={p.shortName} loading="lazy" draggable={false} />
                  </div>
                ) : (
                  <CategoryGlyph model={p.model} accent={p.accent} />
                )}
                <div className="az-card-body">
                  <div className="az-card-name">{p.shortName}</div>
                  <div className="az-card-sub">{p.tagline}</div>
                  <div className="az-card-rating">
                    <Stars rating={p.amazon?.rating} />
                    <span className="az-reviews">{p.amazon?.reviews?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="az-price">
                    <span className="az-price-main">{p.amazon?.price}</span>
                    {p.amazon?.mrp && <span className="az-price-mrp">M.R.P. {p.amazon.mrp}</span>}
                  </div>
                  <div className="az-prime">✓ Smarter Living launch offer</div>
                  <button className="az-cart">Add to Cart</button>
                </div>
              </motion.article>
            ))}
          </motion.div>

          <footer className="az-footer">{content.amazon.note}</footer>

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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
