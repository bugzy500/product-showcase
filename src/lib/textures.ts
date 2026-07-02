import * as THREE from "three";

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export interface LedTextOptions {
  width?: number;
  height?: number;
  color?: string;
  glow?: string;
  background?: string;
  font?: string;
  sub?: string;
  subColor?: string;
}

/** Glowing LED-wall style text texture (no network fonts needed). */
export function ledTextTexture(text: string, opts: LedTextOptions = {}) {
  const {
    width = 1024,
    height = 256,
    color = "#ffffff",
    glow = "#ff6900",
    background = "#0a0b10",
    font = "600 64px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    sub,
    subColor = "rgba(255,255,255,0.55)",
  } = opts;

  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const grd = ctx.createLinearGradient(0, 0, width, height);
  grd.addColorStop(0, "rgba(255,105,0,0.10)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.02)");
  grd.addColorStop(1, "rgba(94,200,242,0.10)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = glow;
  ctx.shadowBlur = 26;
  ctx.fillStyle = color;
  ctx.font = font;
  const cy = sub ? height * 0.42 : height / 2;
  ctx.fillText(text, width / 2, cy, width * 0.92);

  if (sub) {
    ctx.shadowBlur = 8;
    ctx.fillStyle = subColor;
    ctx.font = "400 34px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(sub, width / 2, height * 0.72, width * 0.9);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Small floating name-chip texture shown above products. */
export function labelTexture(text: string, accent = "#ff6900") {
  const width = 512;
  const height = 128;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;

  const r = 30;
  ctx.beginPath();
  ctx.roundRect(6, 6, width - 12, height - 12, r);
  ctx.fillStyle = "rgba(10,11,16,0.78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(44, height / 2, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = "500 40px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(text, 74, height / 2 + 2, width - 110);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial blob used as a fake contact shadow. */
export function blobShadowTexture() {
  const size = 128;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    4,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "rgba(0,0,0,0.42)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

let _particleTex: THREE.Texture | null = null;

/** Soft round sprite so particles render as glows, not squares. */
export function particleTexture() {
  if (_particleTex) return _particleTex;
  const size = 64;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  _particleTex = new THREE.CanvasTexture(canvas);
  return _particleTex;
}

/** Soft radial glow used as an additive accent wash behind each zone. */
export function glowTexture(color: string) {
  const size = 256;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.55, color + "55");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Abstract cinematic gradient for the Mini LED TV screen. */
export function screenTexture() {
  const width = 512;
  const height = 288;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, "#12041f");
  g.addColorStop(0.35, "#ff6900");
  g.addColorStop(0.62, "#f23c5e");
  g.addColorStop(1, "#0b1e3a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 26; i++) {
    const x = Math.pow(i / 26, 1.6) * width;
    ctx.fillStyle = `rgba(255,255,255,${0.02 + (i % 5) * 0.012})`;
    ctx.fillRect(x, 0, 3 + (i % 4) * 2, height);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
