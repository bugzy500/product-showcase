"use client";

import { motion, type Variants } from "framer-motion";
import type { TextAnimation } from "@/src/lib/content";

/**
 * The five text animation styles selectable per-block in experience.json:
 * fade · slide · scale · stagger · dissolve
 */
const VARIANTS: Record<TextAnimation, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.9, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.4 } },
  },
  slide: {
    hidden: { opacity: 0, y: 34 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -18, transition: { duration: 0.35 } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.85 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 0.92, transition: { duration: 0.35 } },
  },
  stagger: {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  },
  dissolve: {
    hidden: { opacity: 0, filter: "blur(14px)" },
    show: { opacity: 1, filter: "blur(0px)", transition: { duration: 1.1, ease: "easeOut" } },
    exit: { opacity: 0, filter: "blur(10px)", transition: { duration: 0.45 } },
  },
};

const CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
  exit: { transition: { staggerChildren: 0.04 } },
};

export function Reveal({
  anim = "fade",
  children,
  className,
  style,
}: {
  anim?: TextAnimation;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={CONTAINER}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

export function Line({
  anim = "fade",
  children,
  className,
  style,
}: {
  anim?: TextAnimation;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div className={className} style={style} variants={VARIANTS[anim]}>
      {children}
    </motion.div>
  );
}
