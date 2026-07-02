"use client";

import { AnimatePresence, motion } from "framer-motion";
import { content } from "@/src/lib/content";
import { useExperience } from "@/src/lib/store";
import { Reveal, Line } from "./anim";

export function IntroOverlay() {
  const progress = useExperience((s) => s.progress);
  const introDone = useExperience((s) => s.introDone);
  const setIntroDone = useExperience((s) => s.setIntroDone);
  const anim = content.event.textAnimation ?? "fade";

  const visible = !introDone && progress < 0.015;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          className="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.4, ease: "easeInOut" } }}
        >
          <Reveal anim={anim} className="intro-inner">
            <div className="intro-top">
              <Line anim={anim}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="intro-logo" src="/brand/mi-logo.png" alt="Xiaomi" draggable={false} />
              </Line>
              <Line anim={anim} className="intro-kicker">
                {content.event.subtitle}
              </Line>
              <Line anim={anim} className="intro-title">
                {content.event.title}
              </Line>
              {content.event.welcome.map((line, i) => (
                <Line anim={anim} key={i} className="intro-welcome">
                  {line}
                </Line>
              ))}
            </div>
            <div className="intro-bottom">
              <Line anim={anim}>
                <button className="intro-button" onClick={setIntroDone}>
                  Enter the Experience
                </button>
              </Line>
              <Line anim={anim} className="intro-hint">
                {content.event.entryHint}
              </Line>
            </div>
          </Reveal>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
