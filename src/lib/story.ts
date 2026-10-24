import { formatINR } from './money';

export const STORY_W = 1080;
export const STORY_H = 1920;

export type StoryTemplate = 'minimal' | 'scoreboard' | 'cinematic';

export const STORY_TEMPLATES: { id: StoryTemplate; label: string }[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'scoreboard', label: 'Scoreboard' },
  { id: 'cinematic', label: 'Cinematic' },
];

export interface StoryData {
  challengeName: string;
  day: number;
  duration: number;
  earned: number; // paise
  target: number; // paise
  remaining: number; // paise
  progressPct: number;
  caption?: string;
  username?: string;
}

type Ctx = CanvasRenderingContext2D;

const DISPLAY = '"Bebas Neue", Inter, sans-serif';
const SANS = 'Inter, system-ui, sans-serif';
const SERIF = '"Playfair Display", Georgia, serif';

let fontsReady: Promise<void> | null = null;
function loadFonts(): Promise<void> {
  fontsReady ??= Promise.all([
    document.fonts.load(`100px ${DISPLAY}`),
    document.fonts.load(`700 100px ${SANS}`),
    document.fonts.load(`400 100px ${SANS}`),
    document.fonts.load(`italic 700 100px ${SERIF}`),
    document.fonts.load(`700 100px ${SERIF}`),
  ])
    .then(() => undefined)
    .catch(() => undefined); // offline: fall back to system fonts
  return fontsReady;
}

export async function renderStory(canvas: HTMLCanvasElement, data: StoryData, template: StoryTemplate) {
  await loadFonts();
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, STORY_W, STORY_H);
  ctx.textBaseline = 'alphabetic';
  ({ minimal: drawMinimal, scoreboard: drawScoreboard, cinematic: drawCinematic })[template](ctx, data);
}

export function formatPct(pct: number): string {
  if (pct >= 100) return `${Math.floor(pct)}%`;
  return `${pct.toFixed(1).replace(/\.0$/, '')}%`;
}

// ---------- helpers ----------

function setFont(ctx: Ctx, size: number, family: string, weight: string | number = 400, style = 'normal') {
  ctx.font = `${style} ${weight} ${size}px ${family}`;
}

function spacing(ctx: Ctx, px: number) {
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${px}px`;
}

/** Sets the largest font ≤ size at which text fits in maxWidth. */
function fitFont(ctx: Ctx, text: string, maxWidth: number, size: number, family: string, weight: string | number = 400, style = 'normal') {
  let s = size;
  setFont(ctx, s, family, weight, style);
  while (s > 12 && ctx.measureText(text).width > maxWidth) {
    s -= 4;
    setFont(ctx, s, family, weight, style);
  }
  return s;
}

function wrapLines(ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last.trimEnd()}…`;
    return kept;
  }
  return lines;
}

function drawLines(ctx: Ctx, lines: string[], x: number, y: number, lineHeight: number) {
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function handle(username?: string) {
  const u = username?.trim().replace(/^@+/, '');
  return u ? `@${u}` : '';
}

function fraction(pct: number) {
  return Math.max(0, Math.min(1, pct / 100));
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 1. Minimal black-and-white ----------

function drawMinimal(ctx: Ctx, d: StoryData) {
  const P = 96;
  const W = STORY_W - P * 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  spacing(ctx, 6);
  fitFont(ctx, d.challengeName.toUpperCase(), W, 34, SANS, 600);
  ctx.textAlign = 'left';
  ctx.fillText(d.challengeName.toUpperCase(), P, 190);
  spacing(ctx, 0);

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(P, 230, W, 2);

  // DAY X/30
  setFont(ctx, 280, DISPLAY);
  const dayText = `DAY ${d.day}`;
  const totalText = `/${d.duration}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(dayText, P - 6, 540);
  const dw = ctx.measureText(dayText).width;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(totalText, P - 6 + dw + 8, 540);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  spacing(ctx, 6);
  setFont(ctx, 32, SANS, 600);
  ctx.fillText('REVENUE EARNED', P, 780);
  spacing(ctx, 0);

  ctx.fillStyle = '#fff';
  const earned = formatINR(d.earned);
  fitFont(ctx, earned, W, 300, DISPLAY);
  ctx.fillText(earned, P - 4, 1060);

  // progress bar
  const barY = 1130;
  const barH = 32;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.strokeRect(P, barY, W, barH);
  ctx.fillStyle = '#fff';
  ctx.fillRect(P + 6, barY + 6, Math.max(0, (W - 12) * fraction(d.progressPct)), barH - 12);

  setFont(ctx, 64, SANS, 800);
  ctx.textAlign = 'right';
  ctx.fillText(formatPct(d.progressPct), P + W, barY + 130);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  setFont(ctx, 34, SANS, 500);
  ctx.fillText('of target reached', P, barY + 122);

  // Target / remaining
  const colY = 1430;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(P, colY - 90, W, 2);
  const col = (label: string, value: string, x: number) => {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    spacing(ctx, 5);
    setFont(ctx, 28, SANS, 600);
    ctx.fillText(label, x, colY);
    spacing(ctx, 0);
    ctx.fillStyle = '#fff';
    fitFont(ctx, value, W / 2 - 24, 64, SANS, 800);
    ctx.fillText(value, x, colY + 80);
  };
  col('TARGET', formatINR(d.target), P);
  col('REMAINING', formatINR(d.remaining), P + W / 2 + 24);

  if (d.caption?.trim()) {
    ctx.fillStyle = '#fff';
    setFont(ctx, 42, SANS, 400);
    drawLines(ctx, wrapLines(ctx, d.caption, W, 3), P, 1660, 58);
  }

  const user = handle(d.username);
  if (user) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    setFont(ctx, 36, SANS, 600);
    ctx.fillText(user, P, 1840);
  }
}

// ---------- 2. Bold scoreboard ----------

function drawScoreboard(ctx: Ctx, d: StoryData) {
  const Y = '#FFD400';
  const GREEN = '#3CFF7A';
  const RED = '#FF6B5A';
  const P = 72;
  const W = STORY_W - P * 2;

  ctx.fillStyle = '#0c0c0c';
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= STORY_W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, STORY_H);
    ctx.stroke();
  }
  for (let y = 0; y <= STORY_H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(STORY_W, y);
    ctx.stroke();
  }

  // Banner
  ctx.fillStyle = Y;
  ctx.fillRect(0, 110, STORY_W, 160);
  ctx.fillStyle = '#0c0c0c';
  ctx.textAlign = 'center';
  spacing(ctx, 4);
  fitFont(ctx, d.challengeName.toUpperCase(), W, 110, DISPLAY);
  ctx.fillText(d.challengeName.toUpperCase(), STORY_W / 2, 230);
  spacing(ctx, 0);

  const label = (text: string, x: number, y: number, color = Y) => {
    ctx.fillStyle = color;
    spacing(ctx, 8);
    setFont(ctx, 36, SANS, 800);
    ctx.fillText(text, x, y);
    spacing(ctx, 0);
  };

  // Day panel
  roundRect(ctx, P, 330, W, 300, 28);
  ctx.lineWidth = 6;
  ctx.strokeStyle = Y;
  ctx.stroke();
  label('DAY', STORY_W / 2, 400);
  ctx.fillStyle = '#fff';
  setFont(ctx, 220, DISPLAY);
  ctx.fillText(`${d.day} / ${d.duration}`, STORY_W / 2, 600);

  // Score panel
  roundRect(ctx, P, 680, W, 400, 28);
  ctx.fillStyle = '#191919';
  ctx.fill();
  label('REVENUE EARNED', STORY_W / 2, 770);
  ctx.fillStyle = GREEN;
  const earned = formatINR(d.earned);
  ctx.shadowColor = 'rgba(60,255,122,0.45)';
  ctx.shadowBlur = 40;
  fitFont(ctx, earned, W - 80, 270, DISPLAY);
  ctx.fillText(earned, STORY_W / 2, 1010);
  ctx.shadowBlur = 0;

  // Segmented bar
  const segs = 20;
  const gap = 10;
  const segW = (W - gap * (segs - 1)) / segs;
  const filled = Math.floor(fraction(d.progressPct) * segs + 1e-9);
  for (let i = 0; i < segs; i++) {
    roundRect(ctx, P + i * (segW + gap), 1130, segW, 80, 8);
    ctx.fillStyle = i < filled ? Y : '#2a2a2a';
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  setFont(ctx, 150, DISPLAY);
  ctx.fillText(formatPct(d.progressPct), STORY_W / 2, 1370);

  // Target / remaining panels
  const half = (W - 24) / 2;
  const panel = (title: string, value: string, x: number, color: string) => {
    roundRect(ctx, x, 1420, half, 220, 24);
    ctx.fillStyle = '#191919';
    ctx.fill();
    label(title, x + half / 2, 1490);
    ctx.fillStyle = color;
    fitFont(ctx, value, half - 48, 110, DISPLAY);
    ctx.fillText(value, x + half / 2, 1600);
  };
  panel('TARGET', formatINR(d.target), P, '#fff');
  panel('TO GO', formatINR(d.remaining), P + half + 24, d.remaining === 0 ? GREEN : RED);

  if (d.caption?.trim()) {
    ctx.fillStyle = '#fff';
    setFont(ctx, 44, SANS, 700);
    drawLines(ctx, wrapLines(ctx, d.caption, W, 2), STORY_W / 2, 1730, 58);
  }

  const user = handle(d.username);
  if (user) {
    ctx.fillStyle = Y;
    setFont(ctx, 40, SANS, 800);
    ctx.fillText(user, STORY_W / 2, 1860);
  }
}

// ---------- 3. Cinematic challenge ----------

function drawCinematic(ctx: Ctx, d: StoryData) {
  const GOLD_LIGHT = '#F6D99A';
  const CREAM = '#EFE2C8';
  const P = 100;
  const W = STORY_W - P * 2;
  const BAR = 150;

  const bg = ctx.createLinearGradient(0, 0, 0, STORY_H);
  bg.addColorStop(0, '#08161f');
  bg.addColorStop(0.55, '#14161a');
  bg.addColorStop(1, '#2a1406');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  const glow = ctx.createRadialGradient(STORY_W / 2, 900, 40, STORY_W / 2, 900, 900);
  glow.addColorStop(0, 'rgba(255,170,80,0.28)');
  glow.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Film grain
  const rand = mulberry32(d.day * 7919 + Math.round(d.earned / 100));
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rand() * 0.06})`;
    ctx.fillRect(rand() * STORY_W, rand() * STORY_H, 2, 2);
  }

  const vignette = ctx.createRadialGradient(STORY_W / 2, STORY_H / 2, 500, STORY_W / 2, STORY_H / 2, 1200);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Letterbox bars
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, STORY_W, BAR);
  ctx.fillRect(0, STORY_H - BAR, STORY_W, BAR);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(239,226,200,0.7)';
  spacing(ctx, 12);
  setFont(ctx, 26, SANS, 500);
  ctx.fillText(`A ${d.duration}-DAY CHALLENGE`, STORY_W / 2, 92);
  spacing(ctx, 0);

  // Title
  ctx.fillStyle = CREAM;
  setFont(ctx, 88, SERIF, 700, 'italic');
  const titleLines = wrapLines(ctx, d.challengeName, W, 2);
  drawLines(ctx, titleLines, STORY_W / 2, 330, 104);
  const afterTitle = 330 + (titleLines.length - 1) * 104;

  ctx.fillStyle = 'rgba(239,226,200,0.8)';
  spacing(ctx, 18);
  setFont(ctx, 40, SANS, 400);
  ctx.fillText(`DAY ${d.day} OF ${d.duration}`, STORY_W / 2 + 9, afterTitle + 130);
  spacing(ctx, 0);

  // Amount
  const earned = formatINR(d.earned);
  fitFont(ctx, earned, W, 210, SERIF, 700);
  const gold = ctx.createLinearGradient(0, 720, 0, 920);
  gold.addColorStop(0, '#FFF1C9');
  gold.addColorStop(0.5, GOLD_LIGHT);
  gold.addColorStop(1, '#C88A3A');
  ctx.fillStyle = gold;
  ctx.shadowColor = 'rgba(255,170,80,0.35)';
  ctx.shadowBlur = 50;
  ctx.fillText(earned, STORY_W / 2, 900);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(239,226,200,0.75)';
  setFont(ctx, 42, SERIF, 700, 'italic');
  ctx.fillText(`earned of ${formatINR(d.target)}`, STORY_W / 2, 990);

  // Progress line
  const lineY = 1130;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(P, lineY - 2, W, 4);
  const endX = P + W * fraction(d.progressPct);
  const lineGrad = ctx.createLinearGradient(P, 0, P + W, 0);
  lineGrad.addColorStop(0, '#C88A3A');
  lineGrad.addColorStop(1, '#FFF1C9');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(P, lineY - 3, endX - P, 6);
  ctx.beginPath();
  ctx.arc(endX, lineY, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF1C9';
  ctx.shadowColor = 'rgba(255,200,120,0.9)';
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = CREAM;
  spacing(ctx, 10);
  setFont(ctx, 34, SANS, 600);
  ctx.fillText(`${formatPct(d.progressPct)} COMPLETE`, STORY_W / 2 + 5, lineY + 100);
  spacing(ctx, 0);

  // Remaining
  ctx.fillStyle = '#fff';
  const togo = d.remaining === 0 ? 'TARGET HIT' : `${formatINR(d.remaining)} TO GO`;
  spacing(ctx, 4);
  fitFont(ctx, togo, W, 130, DISPLAY);
  ctx.fillText(togo, STORY_W / 2, 1420);
  spacing(ctx, 0);

  if (d.caption?.trim()) {
    ctx.fillStyle = CREAM;
    setFont(ctx, 46, SERIF, 700, 'italic');
    drawLines(ctx, wrapLines(ctx, `“${d.caption.trim()}”`, W, 3), STORY_W / 2, 1560, 62);
  }

  const user = handle(d.username);
  if (user) {
    ctx.fillStyle = 'rgba(239,226,200,0.8)';
    spacing(ctx, 6);
    setFont(ctx, 34, SANS, 600);
    ctx.fillText(user, STORY_W / 2, STORY_H - 62);
    spacing(ctx, 0);
  }
}
