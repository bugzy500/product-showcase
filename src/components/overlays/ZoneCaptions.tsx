"use client";

import { AnimatePresence, motion } from "framer-motion";
import { content } from "@/src/lib/content";
import { useExperience } from "@/src/lib/store";
import { localT, segment, zoneSegment, zoneSide } from "@/src/lib/timeline";
import { Reveal, Line } from "./anim";

export function ZoneCaptions() {
  const progress = useExperience((s) => s.progress);
  const focus = useExperience((s) => s.focus);

  let caption: React.ReactNode = null;
  let key = "none";

  if (!focus) {
    for (let i = 0; i < content.zones.length; i++) {
      const t = localT(progress, zoneSegment(i));
      if (t > 0.13 && t < 0.88 && progress < zoneSegment(i).end) {
        const zone = content.zones[i];
        const side = zoneSide(i);
        const anim = zone.textAnimation ?? "fade";
        key = zone.id;
        caption = (
          <motion.aside
            key={key}
            className="caption"
            style={side > 0 ? { left: "5vw" } : { right: "5vw" }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
          >
            <Reveal anim={anim}>
              <Line anim={anim} className="caption-chapter" style={{ color: zone.accent }}>
                {zone.chapter}
              </Line>
              <Line anim={anim} className="caption-title">
                {zone.name}
              </Line>
              <Line anim={anim} className="caption-tagline">
                {zone.tagline}
              </Line>
              <Line anim={anim} className="caption-desc">
                {zone.description}
              </Line>
              <div className="caption-points">
                {zone.talkingPoints.map((pt, j) => (
                  <Line anim={anim} key={j} className="caption-point">
                    <span className="caption-dot" style={{ background: zone.accent }} />
                    {pt}
                  </Line>
                ))}
              </div>
              <Line anim={anim} className="caption-hintline">
                Click any product to explore it
              </Line>
            </Reveal>
          </motion.aside>
        );
        break;
      }
    }

    const ft = localT(progress, segment("finale"));
    if (!caption && ft > 0.12 && ft < 0.85 && progress < segment("finale").end) {
      const anim = content.finale.textAnimation ?? "scale";
      key = "finale";
      caption = (
        <motion.aside
          key={key}
          className="caption caption-center caption-finale"
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
        >
          <Reveal anim={anim}>
            <Line anim={anim} className="caption-chapter" style={{ color: "#ff8c33" }}>
              {content.finale.chapter}
            </Line>
            <Line anim={anim} className="caption-title caption-title-lg">
              {content.finale.title}
            </Line>
            <Line anim={anim} className="caption-tagline">
              {content.finale.tagline}
            </Line>
            <Line anim={anim} className="caption-desc">
              {content.finale.description}
            </Line>
            {content.finale.closing && (
              <>
                <Line anim={anim}>
                  <div className="caption-divider" />
                </Line>
                {content.finale.closingTitle && (
                  <Line anim={anim} className="caption-closing-title">
                    {content.finale.closingTitle}
                  </Line>
                )}
                <Line anim={anim} className="caption-closing">
                  {content.finale.closing}
                </Line>
              </>
            )}
          </Reveal>
        </motion.aside>
      );
    }
  }

  return <AnimatePresence mode="wait">{caption}</AnimatePresence>;
}
