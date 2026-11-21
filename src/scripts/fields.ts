import type { CoverShape } from "../data/home";

type Shape = CoverShape | "tide";
type Sample = (u: number, v: number, time: number, aspect: number) => number;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const shapes: Record<CoverShape, Sample> = {
  sphere(u, v, t, a) {
    const r = .38, x = (u - .5) * a, y = v - .5;
    const d = x * x + y * y;
    if (d > r * r) return 0;
    const z = Math.sqrt(r * r - d);
    return clamp((x * Math.cos(t * .4) * .6 - y * .55 + z * .6) * .95 / r + .08);
  },
  wave(u, v, t) {
    const y = .55 + .12 * Math.sin(u * 9 + t * .8) + .05 * Math.sin(u * 23 - t * 1.3);
    return clamp((v - y) * 4 + .5);
  },
  ripple(u, v, t, a) {
    const d = Math.hypot((u - .5) * a, v - .5);
    return .5 + .5 * Math.sin(d * 38 - t * 2) * Math.max(0, 1 - d * 1.6);
  },
  dunes(u, v, t) {
    const tone = Math.sin(u * 6 + Math.sin(v * 5 + t * .3) * 1.5) * .5 + .5;
    return clamp(tone * v * 1.2);
  },
  // Profundiza UQ: enrollment groups as columns filling toward a hard capacity line,
  // each at its own pace (arrival order); a column that reaches its cap stops there.
  capacity(u, v, t) {
    const n = 6, slot = u * n, k = Math.floor(slot), local = slot - k;
    if (local < .18 || local > .82 || v < .12 || v > .9) return 0;
    const cap = .3 + .1 * ((k * 37) % 5) / 4;
    // fill 0 = empty (bottom at .9), 1 = at capacity; it saturates at 1, so full groups hold at the cap line.
    const fill = Math.min(1, .45 + .75 * (.5 + .5 * Math.sin(t * .5 + k * 1.7)));
    const top = .9 - (.9 - cap) * fill;
    if (Math.abs(v - cap) < .018) return 1;
    if (v < top) return 0;
    return clamp(.35 + .6 * (v - top) / (.9 - top));
  },
  orbit(u, v, t, a) {
    let sum = 0;
    for (let k = 0; k < 3; k++) {
      const angle = t * .3 + k * 2.1;
      const dx = (u - .5 - .28 * Math.cos(angle)) * a;
      const dy = v - .5 - .28 * Math.sin(angle) / a;
      sum += Math.exp(-(dx * dx + dy * dy) / .012);
    }
    return Math.min(1, sum);
  },
};

// Expand the 2×2 threshold seed recursively without storing four different matrices.
const bayer = new Float32Array(64);
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
  let value = 0;
  for (let shift = 0; shift < 3; shift++) {
    const column = (x >> shift) & 1, row = (y >> shift) & 1;
    value = value * 4 + ((row ^ column) * 2 + row);
  }
  bayer[y * 8 + x] = (value + .5) / 64;
}

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const ink = (css: CSSStyleDeclaration, name: string) => {
  const hex = Number.parseInt(css.getPropertyValue(name).trim().slice(1), 16);
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255] as const;
};

function mount(host: HTMLElement, shape: Shape) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  host.prepend(canvas);
  const tide = shape === "tide";
  const cell = tide ? 4 : 3;
  const fps = tide ? 24 : 20;
  const anchor = host.closest("a");
  let frame = 0, last = 0, t = Number(host.dataset.seed ?? 0), visible = true;
  let mouse = false, focus = false, wakeUntil = 0, px = .5, py = .5;
  let img: ImageData | undefined;
  const style = getComputedStyle(document.documentElement);
  let back = ink(style, "--surface"), front = ink(style, tide ? "--mid" : "--ink");
  const sample: Sample = shape === "tide" ? (u, v, time, aspect) => {
    const wave = .52 + .14 * Math.sin(u * 7 + time * .9) + .06 * Math.sin(u * 17 - time * 1.4);
    const d = Math.hypot((u - px) * aspect, v - py);
    const bump = .22 * Math.exp(-d * d / .02) * Math.sin(d * 40 - time * 4);
    return clamp((v - wave + bump) * 3.2 + .5);
  } : shapes[shape];
  const draw = () => {
    if (!img) return;
    const { width, height, data } = img;
    const aspect = width / height;
    let offset = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const color = sample(x / width, y / height, t, aspect) > (bayer[(y & 7) * 8 + (x & 7)] ?? 1) ? front : back;
      data[offset++] = color[0]; data[offset++] = color[1]; data[offset++] = color[2]; data[offset++] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };
  const size = () => {
    const cols = Math.max(1, Math.floor(host.clientWidth / cell));
    const rows = Math.max(1, Math.floor(host.clientHeight / cell));
    if (img?.width === cols && img.height === rows) return;
    canvas.width = cols; canvas.height = rows;
    canvas.style.width = `${cols * cell}px`; canvas.style.height = `${rows * cell}px`;
    img = ctx.createImageData(cols, rows);
    draw();
  };
  const active = () => !reduced.matches && visible && !document.hidden && (tide ? performance.now() < wakeUntil : mouse || focus);
  const tick = (now: number) => {
    frame = 0;
    if (!active()) return;
    if (now - last >= 1000 / fps) { last = now; t += 1 / fps; draw(); }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    if (active() && !frame) frame = requestAnimationFrame(tick);
    else if (!active() && frame) { cancelAnimationFrame(frame); frame = 0; }
  };
  // ResizeObserver's first callback sizes the canvas after layout, without forcing it at load.
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(size).observe(host);
  else { size(); addEventListener("resize", size); }
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; sync(); }).observe(host);
  }
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  addEventListener("themechange", () => {
    back = ink(style, "--surface"); front = ink(style, tide ? "--mid" : "--ink"); draw();
  });
  anchor?.addEventListener("pointerenter", (event) => { mouse = event.pointerType !== "touch"; sync(); });
  anchor?.addEventListener("pointerleave", () => { mouse = false; sync(); });
  anchor?.addEventListener("focus", () => { focus = true; sync(); });
  anchor?.addEventListener("blur", () => { focus = false; sync(); });
  if (tide) host.closest("#contact")?.addEventListener("pointermove", (event) => {
    if (!(event instanceof PointerEvent) || event.pointerType !== "mouse" || reduced.matches) return;
    const rect = host.getBoundingClientRect();
    px = clamp((event.clientX - rect.left) / rect.width);
    py = clamp((event.clientY - rect.top) / rect.height);
    wakeUntil = performance.now() + 850;
    sync();
  });
}

document.querySelectorAll<HTMLElement>("[data-bayer]").forEach((host) => {
  const shape = host.dataset.bayer;
  if (shape === "tide" || (shape && Object.hasOwn(shapes, shape))) mount(host, shape as Shape);
});
