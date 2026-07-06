"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { content, timeline } from "@/src/lib/content";
import { useExperience } from "@/src/lib/store";

const intro = timeline!.intro;

/* Staggered keynote reveal — mirrors the event brief's load sequence:
   heading fades → sub-heading slides up → body line-by-line →
   snapshot card slides in from the right → accent lines animate. */
const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.25 } },
  exit: { transition: { staggerChildren: 0.03 } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 1, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.4 } },
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
  exit: { opacity: 0, y: -14, transition: { duration: 0.35 } },
};

const lineIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const accentGrow: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  show: { scaleX: 1, opacity: 1, transition: { duration: 0.9, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export function IntroOverlay() {
  const progress = useExperience((s) => s.progress);
  const introDone = useExperience((s) => s.introDone);
  const setIntroDone = useExperience((s) => s.setIntroDone);

  // fade the whole panel out as the visitor begins scrolling toward the doors
  const scrollFade = Math.max(0, 1 - progress / 0.05);
  const visible = !introDone && progress < 0.05;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          className="keynote"
          style={{ opacity: scrollFade }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.1, ease: "easeInOut" } }}
        >
          <motion.div
            className="keynote-panel"
            variants={container}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* Left column (70%) — event objective */}
            <div className="keynote-left">
              <motion.div className="keynote-brand" variants={fadeIn}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/mi-logo.png" alt="Xiaomi" draggable={false} />
                <span>{intro.kicker}</span>
              </motion.div>

              <motion.h1 className="keynote-heading" variants={fadeIn}>
                {intro.heading}
              </motion.h1>

              <motion.div className="keynote-accents" variants={accentGrow}>
                <span />
                <span />
              </motion.div>

              <motion.h2 className="keynote-subheading" variants={slideUp}>
                {intro.subheading}
              </motion.h2>

              <motion.div className="keynote-cta" variants={lineIn}>
                <button className="intro-button" onClick={setIntroDone}>
                  Begin the Journey
                </button>
                <span className="keynote-hint">{content.event.entryHint}</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
