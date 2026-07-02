"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { content } from "@/src/lib/content";
import { useExperience } from "@/src/lib/store";
import { segment, segments, zoneSegment, localT } from "@/src/lib/timeline";

function scrollToProgress(p: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: (p + 0.005) * max, behavior: "smooth" });
}

/** Chapter navigation, audio toggle, letterbox bars, vignette, scroll hint. */
export function HUD() {
  const progress = useExperience((s) => s.progress);
  const introDone = useExperience((s) => s.introDone);
  const audioOn = useExperience((s) => s.audioOn);
  const toggleAudio = useExperience((s) => s.toggleAudio);
  const focus = useExperience((s) => s.focus);

  const stops = [
    { id: "arrival", label: "Arrival", p: 0 },
    ...content.zones.map((z, i) => ({ id: z.id, label: z.name, p: zoneSegment(i).start })),
    { id: "finale", label: content.finale.chapter, p: segment("finale").start },
    { id: "amazon", label: content.amazon.chapter, p: segment("amazon").start },
  ];
  const activeIdx = stops.reduce((acc, s, i) => (progress >= s.p - 0.004 ? i : acc), 0);

  // cinematic letterbox during arrival + finale/amazon
  const arrivalT = localT(progress, segment("arrival"));
  const finaleOn = progress > segment("finale").start;
  const bars = (!introDone || arrivalT < 0.9 || finaleOn) && !focus ? "6vh" : "0vh";

  return (
    <>
      <div className="vignette" />

      <motion.div className="letterbox letterbox-top" animate={{ height: bars }} transition={{ duration: 0.9 }} />
      <motion.div className="letterbox letterbox-bottom" animate={{ height: bars }} transition={{ duration: 0.9 }} />

      <div className="hud-top">
        <div className="hud-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hud-mi" src="/brand/mi-logo.png" alt="Xiaomi" draggable={false} />
          <span className="hud-brand-text">{content.event.title}</span>
          <span className="hud-tag">Digital Twin Preview</span>
        </div>
        <button className="hud-audio" onClick={toggleAudio}>
          {audioOn ? "♪ Ambience on" : "♪ Ambience off"}
        </button>
      </div>

      {!focus && (
        <nav className="hud-nav" aria-label="Chapters">
          {stops.map((s, i) => (
            <button
              key={s.id}
              className={`hud-dot ${i === activeIdx ? "active" : ""}`}
              onClick={() => scrollToProgress(s.p)}
              title={s.label}
            >
              <span className="hud-dot-label">{s.label}</span>
              <span className="hud-dot-mark" />
            </button>
          ))}
        </nav>
      )}

      {introDone && progress < 0.01 && (
        <div className="hud-scrollhint">
          <div className="hud-scrollhint-chevron">⌄</div>
          {content.event.entryHint}
        </div>
      )}
    </>
  );
}

/** Self-contained ambient pad synthesised with WebAudio — no audio files needed. */
export function AmbientAudio() {
  const audioOn = useExperience((s) => s.audioOn);
  const ctxRef = useRef<{ ctx: AudioContext; master: GainNode } | null>(null);

  useEffect(() => {
    if (!audioOn) {
      if (ctxRef.current) {
        const { ctx, master } = ctxRef.current;
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
        setTimeout(() => {
          ctx.close();
        }, 1500);
        ctxRef.current = null;
      }
      return;
    }
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2.5);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 620;
    filter.connect(master);
    master.connect(ctx.destination);

    const oscs: OscillatorNode[] = [];
    [110, 164.81, 220, 329.63].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? "sine" : "triangle";
      osc.frequency.value = freq;
      osc.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.value = i < 2 ? 0.5 : 0.22;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      oscs.push(osc);
    });

    // slow breathing on the filter
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    ctxRef.current = { ctx, master };
    return () => {
      oscs.forEach((o) => o.stop());
      lfo.stop();
      if (ctxRef.current?.ctx === ctx) {
        ctx.close();
        ctxRef.current = null;
      }
    };
  }, [audioOn]);

  return null;
}
