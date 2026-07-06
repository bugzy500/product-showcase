"use client";

import { motion, AnimatePresence } from "framer-motion";
import { content } from "@/src/lib/content";
import { useExperience } from "@/src/lib/store";
import { segment, localT, clamp01 } from "@/src/lib/timeline";

const evIntro = content.event.intro;

export function TransitionCover() {
  const progress = useExperience((s) => s.progress);
  const focus = useExperience((s) => s.focus);
  if (focus) return null;

  const ms3 = segment("ms3");
  const arr = segment("arrival");
  const slr = segment("slreturn");

  // ENTRY cover: ramps to fully opaque BY the ms3→arrival boundary (the world jump),
  // then fades out across the first ~30% of arrival so the walkthrough reveals cleanly.
  const entryFadeInStart = ms3.start + (ms3.end - ms3.start) * 0.3;
  const entryRevealEnd = arr.start + (arr.end - arr.start) * 0.3;
  let entryOp = 0;
  if (progress >= entryFadeInStart && progress < entryRevealEnd) {
    entryOp =
      progress < arr.start
        ? clamp01((progress - entryFadeInStart) / (arr.start - entryFadeInStart)) // → 1 at boundary
        : 1 - clamp01((progress - arr.start) / (entryRevealEnd - arr.start));       // 1 → 0 after boundary
  }

  // RETURN veil: the camera flies continuously venue→timeline during slreturn; a soft veil smooths it.
  const returnT = localT(progress, slr);
  const returnOp =
    progress >= slr.start && progress < slr.end ? Math.min(1, Math.sin(returnT * Math.PI) * 1.4) : 0;

  return (
    <AnimatePresence>
      {entryOp > 0.001 && (
        <motion.div key="entry" className="transition-cover entry" style={{ opacity: entryOp }}>
          <div className="transition-keynote">
            <div className="transition-kicker">{evIntro.kicker}</div>
            <h2 className="transition-heading">{content.event.title}</h2>
            <p className="transition-sub">{content.event.subtitle}</p>
          </div>
        </motion.div>
      )}
      {returnOp > 0.001 && (
        <motion.div key="return" className="transition-cover return" style={{ opacity: returnOp }} />
      )}
    </AnimatePresence>
  );
}
