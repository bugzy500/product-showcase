"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useExperience } from "@/src/lib/store";
import { TOTAL_SCROLL_VH } from "@/src/lib/timeline";
import { Scene } from "./Scene";
import { IntroOverlay } from "./overlays/IntroOverlay";
import { ZoneCaptions } from "./overlays/ZoneCaptions";
import { ProductPanel } from "./overlays/ProductPanel";
import { TimelineOverlay } from "./overlays/TimelineOverlay";
import { TransitionCover } from "./overlays/TransitionCover";
import { AmazonOverlay } from "./overlays/AmazonOverlay";
import { HUD, AmbientAudio } from "./overlays/HUD";

export default function ExperienceApp() {
  const setProgress = useExperience((s) => s.setProgress);
  const focus = useExperience((s) => s.focus);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [setProgress]);

  // pause the walk while a product is under inspection
  useEffect(() => {
    document.documentElement.style.overflow = focus ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [focus]);

  return (
    <>
      {/* scroll runway — scrolling it drives the virtual camera */}
      <div style={{ height: `${TOTAL_SCROLL_VH}vh` }} aria-hidden />

      <div className="canvas-fixed">
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ fov: 55, near: 0.1, far: 300, position: [0, 3.4, 60] }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      <IntroOverlay />
      <ZoneCaptions />
      <ProductPanel />
      <TimelineOverlay />
      <TransitionCover />
      <AmazonOverlay />
      <HUD />
      <AmbientAudio />
    </>
  );
}
