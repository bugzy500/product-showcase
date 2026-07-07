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

/** Floating milestone marker: big date label + title, glowing accent. */
export function milestoneLabelTexture(
  dateLabel: string,
  title: string,
  accent: string
) {
  const width = 640;
  const height = 256;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, width, height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = accent;
  ctx.shadowBlur = 30;
  ctx.fillStyle = accent;
  ctx.font = "700 96px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(dateLabel, width / 2, 92, width * 0.94);

  ctx.shadowBlur = 10;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "500 40px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(title, width / 2, 186, width * 0.96);

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

/** Dark demo screen: heading, sub-line and a simple accent sparkline. */
export function infoScreenTexture(
  title: string,
  subtitle: string,
  accent = "#5ec8f2",
  opts: { stat?: string; harsh?: boolean } = {}
) {
  const width = 512;
  const height = 384;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0c0f16";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = "700 40px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(title, 34, 74, width - 60);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "400 24px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(subtitle, 34, 116, width - 60);

  if (opts.stat) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 72px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(opts.stat, 34, 210);
  }

  // sparkline
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  const baseY = 320;
  for (let i = 0; i <= 20; i++) {
    const x = 34 + (i / 20) * (width - 80);
    const wobble = opts.harsh
      ? (i % 2 === 0 ? -1 : 1) * 42 // jagged = conventional
      : Math.sin(i * 0.6) * 26; // smooth = natural
    const y = baseY + wobble - (opts.stat ? 0 : 0);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Frosted disc with a two-digit pod number and accent ring. */
export function podNumberTexture(n: number, accent = "#ff6900") {
  const size = 256;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10,12,18,0.72)";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 120px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(String(n).padStart(2, "0"), size / 2, size / 2 + 6);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ */
/* IFA Berlin experience textures (CR-01)                              */
/* ------------------------------------------------------------------ */

/** Rooftop "MESSE BERLIN" lettering — light stone letters on transparent. */
export function messeSignTexture(text = "MESSE BERLIN") {
  const width = 1024;
  const height = 200;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "14px";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#e9ecf1";
  ctx.font = "800 108px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(text, width / 2, height / 2, width * 0.94);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Large facade hero banner: bold IFA mark, tagline and dates. */
export function ifaBannerTexture(tagline: string, dates: string) {
  const width = 1024;
  const height = 512;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, "#101319");
  g.addColorStop(1, "#1c2230");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 220px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("IFA", width / 2, 200);

  ctx.shadowColor = "#ff6900";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#ff8a3c";
  ctx.font = "700 58px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(dates, width / 2, 360, width * 0.9);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "400 38px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(tagline, width / 2, 430, width * 0.9);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Vertical digital advertising tower panel. */
export function adPanelTexture(title: string, sub: string, accent = "#ff6900") {
  const width = 256;
  const height = 640;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, accent);
  g.addColorStop(0.5, "#0c0f16");
  g.addColorStop(1, "#0c0f16");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 66px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(title, 0, -26, height * 0.86);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "400 34px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(sub, 0, 40, height * 0.86);
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Hall identifier LED wall: bold hall name + sub-line over a colour wash. */
export function hallSignTexture(name: string, sub: string, color: string) {
  const width = 1024;
  const height = 384;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#07090e";
  ctx.fillRect(0, 0, width, height);
  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, color + "55");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 16, height);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 96px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(name, 60, 150, width - 120);
  ctx.shadowBlur = 6;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "400 44px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(sub, 60, 260, width - 120);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Floating floor-map zone label chip (rounded, colour dot + name). */
export function zoneChipTexture(name: string, color: string) {
  const width = 512;
  const height = 128;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.roundRect(6, 30, width - 12, 68, 34);
  ctx.fillStyle = "rgba(8,10,15,0.82)";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(44, 64, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "600 40px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(name, 74, 66, width - 96);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Illuminated IFA floor-map: colour-coded, labelled zone cells + pathways. */
export function ifaFloorMapTexture(zones: { name: string; color: string }[]) {
  const width = 1280;
  const height = 720;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#06080d";
  ctx.fillRect(0, 0, width, height);

  const cols = 5;
  const rows = Math.ceil(zones.length / cols);
  const padX = 40;
  const padTop = 96;
  const padBot = 40;
  const gap = 18;
  const cellW = (width - padX * 2 - gap * (cols - 1)) / cols;
  const cellH = (height - padTop - padBot - gap * (rows - 1)) / rows;

  // heading
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "800 44px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("IFA BERLIN · EXHIBITION FLOOR", padX, 52);

  const centers: Array<[number, number]> = [];
  zones.forEach((z, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = padX + c * (cellW + gap);
    const y = padTop + r * (cellH + gap);
    centers.push([x + cellW / 2, y + cellH / 2]);
    // cell
    ctx.beginPath();
    ctx.roundRect(x, y, cellW, cellH, 12);
    ctx.fillStyle = z.color + "cc";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // label (wrap to 2 lines)
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 22px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    const words = z.name.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > cellW - 20 && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    lines.push(line);
    const ly = y + cellH / 2 - ((lines.length - 1) * 24) / 2;
    lines.forEach((l, k) => ctx.fillText(l, x + cellW / 2, ly + k * 24, cellW - 12));
    ctx.textAlign = "left";
  });

  // faint connecting pathways (a wandering route between cells)
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  centers.forEach(([cx, cy], i) => (i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)));
  ctx.stroke();
  ctx.setLineDash([]);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
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
