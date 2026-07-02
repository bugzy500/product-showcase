"use client";

import dynamic from "next/dynamic";

const ExperienceApp = dynamic(() => import("@/src/components/ExperienceApp"), {
  ssr: false,
  loading: () => (
    <div className="boot-screen">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="boot-mi" src="/brand/mi-logo.png" alt="Xiaomi" />
      <div className="boot-text">Preparing the venue…</div>
      <div className="boot-bar">
        <div className="boot-bar-fill" />
      </div>
    </div>
  ),
});

export default function Page() {
  return <ExperienceApp />;
}
