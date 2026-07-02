"use client";

import { create } from "zustand";

export interface Focus {
  zone: number;
  product: number;
}

interface ExperienceState {
  /** Raw scroll progress 0..1 across the whole walkthrough. */
  progress: number;
  introDone: boolean;
  focus: Focus | null;
  audioOn: boolean;
  setProgress: (p: number) => void;
  setIntroDone: () => void;
  setFocus: (f: Focus | null) => void;
  toggleAudio: () => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  progress: 0,
  introDone: false,
  focus: null,
  audioOn: false,
  setProgress: (progress) => set({ progress }),
  setIntroDone: () => set({ introDone: true }),
  setFocus: (focus) => set({ focus }),
  toggleAudio: () => set((s) => ({ audioOn: !s.audioOn })),
}));

/**
 * Mutable, non-reactive channels shared between the DOM overlays and the
 * render loop — updating these never triggers React re-renders.
 */
export const liveState = {
  /** Smoothed progress maintained by the camera rig each frame. */
  smoothProgress: 0,
  /** User-driven turntable rotation while a product is focused. */
  spin: 0,
  spinVelocity: 0,
  dragging: false,
};
