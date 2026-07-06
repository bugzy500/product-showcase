"use client";

import { AnimatePresence, motion } from "framer-motion";
import { timeline } from "@/src/lib/content";
import { useExperience } from "@/src/lib/store";
import {
  MILESTONE_COUNT,
  localT,
  milestoneActivity,
  milestoneSegment,
  milestoneState,
  segment,
} from "@/src/lib/timeline";

function scrollToProgress(p: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: (p + 0.005) * max, behavior: "smooth" });
}

/** Jump to the dwell point (mid) of milestone i. */
function jumpToMilestone(i: number) {
  const s = milestoneSegment(i);
  scrollToProgress(s.start + (s.end - s.start) * 0.55);
}

export function TimelineOverlay() {
  const progress = useExperience((s) => s.progress);
  const focus = useExperience((s) => s.focus);

  if (!timeline?.enabled || focus) return null;

  const tl = segment("timeline");
  const closing = segment("closing");

  // The act spans the whole runway except the preserved walkthrough band.
  const inTimelineAct = progress >= tl.start - 0.01 && progress <= closing.end;
  if (!inTimelineAct) return null;

  // Hide while inside the relocated walkthrough (it has its own overlays).
  const arrival = segment("arrival");
  const slreturn = segment("slreturn");
  const inWalkthrough = progress >= arrival.start && progress < slreturn.end;
  if (inWalkthrough) return null;

  // Which milestone (if any) are we dwelling in?
  let activeMs = -1;
  let activeAct = 0;
  for (let i = 0; i < MILESTONE_COUNT; i++) {
    const a = milestoneActivity(progress, i);
    if (a > activeAct) {
      activeAct = a;
      activeMs = i;
    }
  }
  const panelMs = activeAct > 0.25 ? activeMs : -1;
  const m = panelMs >= 0 ? timeline.milestones[panelMs] : null;

  const closingT = localT(progress, closing);
  const showClosing = closingT > 0.35;

  return (
    <>
      {/* intro caption while on the overview, before diving into a milestone */}
      <AnimatePresence>
        {!m && !showClosing && (
          <motion.aside
            key="tl-intro"
            className="tl-intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
          >
            <div className="tl-intro-kicker">{timeline.intro.kicker}</div>
            <h2 className="tl-intro-heading">{timeline.intro.heading}</h2>
            <p className="tl-intro-sub">{timeline.intro.subheading}</p>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* per-milestone content panel */}
      <AnimatePresence mode="wait">
        {m && !showClosing && (
          <motion.aside
            key={m.id}
            className="tl-panel"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="tl-panel-date" style={{ color: m.accent }}>
              {m.month}
            </div>
            <h2 className="tl-panel-title">{m.title}</h2>
            <div className="tl-panel-env" style={{ color: m.accent }}>
              {m.environment}
            </div>
            <div className="tl-panel-focus">{m.focus}</div>
            <p className="tl-panel-body">{m.body}</p>
            <ul className="tl-panel-bullets">
              {m.bullets.map((b, j) => (
                <li key={j}>
                  <span className="caption-dot" style={{ background: m.accent }} />
                  {b}
                </li>
              ))}
            </ul>
            {m.experienceB && (
              <button
                className="tl-experience-b"
                onClick={() => scrollToProgress(segment("arrival").start)}
              >
                {m.experienceB.label} →
              </button>
            )}
            <button className="tl-return" onClick={() => scrollToProgress(tl.start)}>
              ↑ Return to timeline
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* closing message */}
      <AnimatePresence>
        {showClosing && (
          <motion.div
            key="tl-closing"
            className="tl-closing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="tl-closing-title">{timeline.closing.title}</div>
            <p className="tl-closing-msg">{timeline.closing.message}</p>
            <button className="tl-replay" onClick={() => scrollToProgress(0)}>
              Replay the experience ↻
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* floating glass timeline strip — always present during the act */}
      {!showClosing && (
        <div className="tl-strip">
          {timeline.milestones.map((mm, i) => {
            const state = milestoneState(progress, i);
            return (
              <button
                key={mm.id}
                className={`tl-chip tl-chip-${state} ${i === panelMs ? "current" : ""}`}
                style={{ ["--chip" as string]: mm.accent }}
                onClick={() => jumpToMilestone(i)}
                title={mm.title}
              >
                <span className="tl-chip-date">{mm.dateLabel}</span>
                <span className="tl-chip-title">{mm.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
