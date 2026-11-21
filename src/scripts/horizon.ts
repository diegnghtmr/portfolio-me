// Ambient footer horizon: the build-time horizon PNG animated at cell resolution.
// Same ridges, inks and Bayer 8x8 threshold as scripts/dither-assets.mjs, plus time:
// the sun drifts and breathes, coffee rows sway, mist crosses the middle ridge.
// Static PNG stays underneath: shown under reduced motion, without JS, or on failure.

const COLS = 360;
const ROWS = 55;
const FPS = 12;

const bayer = (() => {
  const q = [[0, 2], [3, 1]];
  let r: number[][] = [[0]];
  for (let s = 1; s < 8; s *= 2) {
    r = Array.from({ length: s * 2 }, (_, y) =>
      Array.from({ length: s * 2 }, (_, x) => 4 * r[y % s]![x % s]! + q[+(y >= s)]![+(x >= s)]!));
  }
  return r.map(row => row.map(v => (v + 0.5) / 64));
})();

const pk = (x: number) => (1 - Math.abs(Math.sin(x))) ** 1.6;
const ridge = (u: number, base: number, amp: number, f: number, ph: number) => {
  const w = u * f;
  return base - amp * (0.62 * pk(w + ph) + 0.28 * pk(w * 2.13 + ph * 1.9) + 0.1 * Math.sin(w * 6.7 + ph));
};

// Ridges do not move, so they are computed once per column.
const near = new Float32Array(COLS), middle = new Float32Array(COLS), far = new Float32Array(COLS);
for (let x = 0; x < COLS; x++) {
  const u = x / COLS;
  near[x] = ridge(u, 0.84, 0.16, 2.2, 4.1);
  middle[x] = ridge(u, 0.68, 0.26, 3.1, 2.4);
  far[x] = ridge(u, 0.5, 0.34, 4.2, 0.9);
}

function inkAt(x: number, y: number, th: number, t: number): number {
  const u = x / COLS, v = y / ROWS;
  if (v >= near[x]!) {
    const rows = Math.sin(x * 0.35 - y * 1.1 + Math.sin(t * 0.6 + x * 0.02) * 0.9) > 0.2;
    return 0.2 + 0.35 * Math.min(1, (v - near[x]!) * 5) + (rows ? 0.3 : 0) > th ? 2 : 1;
  }
  if (v >= middle[x]!) {
    const mist = 0.12 * Math.max(0, Math.sin(u * 5 - t * 0.25));
    return 0.15 + 0.55 * Math.min(1, (v - middle[x]!) * 3.5) - mist > th ? 2 : 1;
  }
  if (v >= far[x]!) return 0.18 + 0.5 * Math.min(1, (v - far[x]!) * 3) > th ? 1 : 0;
  // Sun centre stays low enough that its 0.3 glow never touches the top edge (min top = 0.06).
  const sy = 0.4 + 0.04 * Math.sin(t * 0.18);
  const sun = Math.hypot((u - 0.7) * (COLS / ROWS), v - sy);
  const core = 0.13 + 0.015 * Math.sin(t * 0.7);
  if (sun >= 0.3) return 0;
  const glow = sun < core ? 0.72 : 0.72 * (1 - (sun - core) / (0.3 - core));
  return glow > th ? 3 : 0;
}

const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

function mount(figure: HTMLElement) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas");
  canvas.width = COLS; canvas.height = ROWS;
  canvas.className = "horizon-live";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  figure.append(canvas);
  const image = ctx.createImageData(COLS, ROWS);
  let inks: number[][] = [];
  const readInks = () => {
    const s = getComputedStyle(document.documentElement);
    inks = ["--surface", "--mid", "--ink", "--gold"].map(n => rgb(s.getPropertyValue(n).trim()));
  };
  const draw = (t: number) => {
    const d = image.data;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = inks[inkAt(x, y, bayer[y % 8]![x % 8]!, t)]!, o = (y * COLS + x) * 4;
      d[o] = c[0]!; d[o + 1] = c[1]!; d[o + 2] = c[2]!; d[o + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  };
  let visible = false, raf = 0, last = 0;
  const start = performance.now();
  const loop = (now: number) => {
    raf = 0;
    if (!visible || document.hidden || motion.matches) return;
    raf = requestAnimationFrame(loop);
    if (now - last < 1000 / FPS) return;
    last = now; draw((now - start) / 1000);
  };
  const sync = () => {
    const live = !motion.matches;
    figure.toggleAttribute("data-live", live);
    if (live && visible && !document.hidden && !raf) raf = requestAnimationFrame(loop);
  };
  readInks(); draw(0);
  new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); sync(); }).observe(figure);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  new MutationObserver(() => { readInks(); draw((performance.now() - start) / 1000); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

// The horizon sits at the very bottom of the page: build the canvas only when the footer
// approaches the viewport, so page load never pays for its first 20k-cell frame.
const figure = document.querySelector<HTMLElement>("figure.dither-poster.horizon");
if (figure) {
  const near = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    near.disconnect();
    mount(figure);
  }, { rootMargin: "400px 0px" });
  near.observe(figure);
}
