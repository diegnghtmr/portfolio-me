import type { CaseCoverShape, CoverShape } from "../data/projects";

type ArtShape = CoverShape | CaseCoverShape;
type Shape = ArtShape | "tide";
type Sample = (u: number, v: number, time: number, aspect: number, rings?: number) => number;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const stroke = (offset: number, width: number) => 1 - clamp(Math.abs(offset) / width);
// Keep compact motifs from flattening out in the wide, shallow mobile cover.
const insetX = (u: number, aspect: number) => .5 + (u - .5) * (1 + .3 * clamp((aspect - 1.4) / 1.4));
const growth = [[.15, .94, -.31], [.28, 1, .28], [.45, .83, -.25], [.53, .92, .33]] as const;
const week = [
  [[.2, .38], [.61, .8]], [[.32, .57]], [[.16, .32], [.49, .73]],
  [[.24, .47], [.68, .84]], [[.38, .66]],
] as const;
const shapes: Record<ArtShape, Sample> = {
  wave(u, v, t) {
    const y = .55 + .12 * Math.sin(u * 9 + t * .8) + .05 * Math.sin(u * 23 - t * 1.3);
    return clamp((v - y) * 4 + .5);
  },
  ripple(u, v, t, a, rings = 38) {
    const d = Math.hypot((u - .5) * a, v - .5);
    const wave = Math.sin(d * rings - t * 2), fade = Math.max(0, 1 - d * 1.6);
    // Showcase (custom rings): rings fade into the dark surface instead of a mid-tone checkerboard.
    return rings === 38 ? .5 + .5 * wave * fade : (.5 + .5 * wave) * fade;
  },
  // Mixed requests on the left converge into three priority lanes on the right.
  triage(u, v, t) {
    if (u < .08 || u > .92) return 0;
    const spread = clamp((u - .22) / .47);
    const sorted = spread * spread * (3 - 2 * spread);
    let tone = 0;
    for (let lane = 0; lane < 3; lane++) {
      const priority = .25 + lane * .25;
      const incoming = .5 + .14 * Math.sin(u * 18 + lane * 2.1);
      const distance = Math.abs(v - (incoming + (priority - incoming) * sorted));
      const phase = u * 4 - t * .23 + lane * .27;
      const rail = distance < .012 ? .15 + sorted * .2 : 0;
      const request = Math.abs(phase - Math.round(phase)) < .11 && distance < .045 ? 1 - lane * .16 : 0;
      tone = Math.max(tone, rail, request);
    }
    return tone;
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

  // doc-sentinel: a scan band picks out traces in a skewed document plane.
  scan(u, v, t, a) {
    const x = insetX(u, a) - (v - .5) * .24;
    if (x < .23 || x > .77 || v < .14 || v > .86) return 0;
    const sweep = .49 + .17 * Math.sin(t * .7) + (x - .5) * .32;
    const row = Math.floor((v - .21) / .105);
    const trace = x > .29 && x < .58 + (row * 7 % 4) * .039
      ? .31 * stroke(v - (.235 + row * .105), .018) : 0;
    const band = .79 * stroke(v - sweep, .045) + .23 * stroke(v - sweep - .068, .022);
    return clamp(.12 + trace + band);
  },
  // RosterEdge: home and away slots lock into a shared set of fixtures.
  fixtures(u, v, t) {
    const lane = Math.round((v - .25) / .25);
    if (lane < 0 || lane > 2) return 0;
    const y = .25 + lane * .25, x = Math.abs(u - .5);
    const selected = .5 + .5 * Math.cos(t * .8 - lane * 2.1);
    const slotY = y + (lane - 1) * .034;
    const tab = x > .254 && x < .396 && Math.abs(v - slotY) < .055 ? .38 + .38 * selected : 0;
    const join = x < .312 ? .53 * stroke(v - (x > .17 ? slotY : y), .022) : 0;
    const elbow = v >= Math.min(y, slotY) && v <= Math.max(y, slotY) ? .58 * stroke(x - .17, .017) : 0;
    const spine = v > .24 && v < .76 ? .58 * stroke(x, .025) : 0;
    const match = x < .045 && Math.abs(v - y) < .041 ? .49 + .44 * selected : 0;
    return Math.max(tab, join, elbow, spine, match);
  },
  // NexRide: three approaches converge on a suggested pickup, then share one route.
  pickup(u, v, t) {
    if (u > .89) return 0;
    const hub = .64, hubY = .54;
    const packet = .16 * Math.cos(u * 19 - t * 1.8);
    if (u > hub + .015) return (.54 + packet) * stroke(v - hubY, .038);
    let routes = 0;
    for (let k = 0; k < 3; k++) {
      const start = .11 + (k === 1 ? .07 : k * .013);
      if (u < start) continue;
      const progress = clamp((u - start) / (hub - start));
      const turn = clamp((progress - .17) / .78);
      const bend = turn * turn * (3 - 2 * turn);
      const y = .19 + k * .31;
      routes = Math.max(routes, (.72 - k * .075 + packet) * stroke(v - (y + (hubY - y) * bend), .039));
    }
    return Math.max(routes, .98 * stroke(Math.abs(hub - u) * 1.5 + Math.abs(v - hubY), .065));
  },
  // Savia: a rising flow divides into tapered branches.
  sapflow(u, v, t, a) {
    const height = (.89 - v) / .78;
    if (height < 0 || height > 1) return 0;
    const x = insetX(u, a);
    const stem = .46 + height * .085 + .04 * Math.sin(height * 5 - t * .32);
    const sap = .8 + .17 * Math.sin(height * 17 - t * 1.35);
    let tone = sap * stroke(x - stem, .062 - height * .028);
    for (const [root, tip, spread] of growth) {
      if (height < root || height > tip) continue;
      const rise = (height - root) / (tip - root);
      const branch = stem + spread * rise * (.76 + .24 * rise);
      tone = Math.max(tone, sap * stroke(x - branch, .058 * (1 - rise) + .014));
    }
    return tone;
  },
  // writing-harness: ragged fragments settle into measured lines of prose.
  typeset(u, v, t) {
    const line = Math.round((v - .22) / .14);
    if (line < 0 || line > 4) return 0;
    const start = .12 + (line * 7 % 4) * .028;
    const end = line === 4 ? .63 : .88 - (line * 3 % 5) * .023;
    if (u < start || u > end) return 0;
    const ragged = 1 - clamp((u - start) * 2.7);
    const center = .22 + line * .14 + .045 * ragged * Math.sin(u * 17 + line * 2.3 - t * .7);
    const texture = .78 - .54 * ragged * Math.sin(u * 73 - line * 2.4 + t * .55) ** 4;
    return texture * stroke(v - center, .046);
  },
  // Vale: offset blocks fit into a week without overlaps.
  timetable(u, v, t) {
    const column = (u - .12) / .152, day = Math.floor(column), offset = column - day;
    const meetings = week[day];
    if (!meetings || offset < .1 || offset > .9) return 0;
    const time = v - .074 * (offset - .5);
    for (const [start, end] of meetings) {
      if (time < start || time > end) continue;
      const weight = .53 + .18 * Math.cos(t * .65 + day + start * 7);
      return time < start + .033 ? .92 : weight + .11 * offset;
    }
    return 0;
  },
  // Saber Inverso: two distributions split at the same sloped target.
  distribution(u, v, t) {
    const x = (u - .5) / .39, y = v - .5 - x * .19;
    const side = y < 0 ? -1 : 1;
    const density = .3 * Math.exp(-3.9 * (x - side * .23) ** 2);
    const distance = Math.abs(y) - .024;
    if (distance < 0 || distance > density) return 0;
    const contour = .1 * Math.cos((distance / density) * 14 - t * .72);
    const taper = 1 - clamp((Math.abs(x) - .84) / .24);
    return taper * clamp(.94 - .68 * distance / density + contour);
  },
  // resume-maker: three typesetting plates stack into one export.
  folio(u, v, t, a) {
    const layer = Math.round((v - .27) / .23);
    if (layer < 0 || layer > 2) return 0;
    const y = v - (.27 + layer * .23);
    const x = insetX(u, a) - (.42 + layer * .075) - y * .6;
    if (Math.abs(y) > .077 || Math.abs(x) > .257) return 0;
    const margin = x < -.192 || y > .05 ? .22 : 0;
    return .37 + layer * .08 + margin + .16 * Math.sin(x * 6 - t * .73 + layer * .9);
  },
  // Enterprise Monitoring Stack: paired storage platters flank a telemetry pulse.
  mirrors(u, v, t, a) {
    const x = insetX(u, a) - .5;
    const diskX = (Math.abs(x) - .222) / .169;
    const face = Math.hypot(diskX, (v - .43) / .212);
    const base = Math.hypot(diskX, (v - .56) / .212);
    const pulse = .51 - .12 * stroke(x + .021, .043) + .075 * stroke(x - .022, .032);
    const signal = Math.abs(x) < .088 ? (.84 + .12 * Math.sin(t * 1.1)) * stroke(v - pulse, .048) : 0;
    if (face < 1) {
      const etched = .2 * stroke(face - .67, .085) + .25 * stroke(face - .91, .095);
      return Math.max(signal, .3 + etched + .17 * stroke(v - (.34 + .068 * Math.sin(t * .9)), .087));
    }
    if (base < 1) return Math.max(signal, .23 + .52 * stroke(base - .94, .16));
    return signal;
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
  const frequency = shape === "ripple" ? Number(host.dataset.rings) : NaN;
  const rings = Number.isFinite(frequency) && frequency > 0 ? frequency : undefined;
  const anchor = host.closest("a");
  const caseHero = host.classList.contains("case-cover") ? host.closest<HTMLElement>(".case-hero") : null;
  const pointerTarget = caseHero ? host : anchor;
  const seed = Number(host.dataset.seed ?? 0);
  let frame = 0, last = 0, t = seed, visible = true;
  let mouse = false, focus = caseHero?.contains(document.activeElement) ?? false, wakeUntil = 0, px = .5, py = .5;
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
      const color = sample(x / width, y / height, t, aspect, rings) > (bayer[(y & 7) * 8 + (x & 7)] ?? 1) ? front : back;
      data[offset++] = color[0]; data[offset++] = color[1]; data[offset++] = color[2]; data[offset++] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };
  const size = (width: number, height: number) => {
    if (!width || !height) return;
    const cols = Math.max(1, Math.floor(width / cell));
    const rows = Math.max(1, Math.floor(height / cell));
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
  // Use sizes already measured by layout; reading the host after another canvas
  // has been resized in the same delivery would force style/layout again.
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(([entry]) => {
      if (entry) size(entry.contentRect.width, entry.contentRect.height);
    }).observe(host);
  } else {
    const measure = () => size(host.clientWidth, host.clientHeight);
    measure();
    addEventListener("resize", measure);
  }
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; sync(); }).observe(host);
  }
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", () => {
    if (caseHero && reduced.matches) { t = seed; draw(); }
    sync();
  });
  addEventListener("themechange", () => {
    back = ink(style, "--surface"); front = ink(style, tide ? "--mid" : "--ink"); draw();
  });
  pointerTarget?.addEventListener("pointerenter", (event) => { mouse = event.pointerType !== "touch"; sync(); });
  pointerTarget?.addEventListener("pointerleave", () => { mouse = false; sync(); });
  anchor?.addEventListener("focus", () => { focus = true; sync(); });
  anchor?.addEventListener("blur", () => { focus = false; sync(); });
  // The decorative canvas is not a tab stop. The existing hero links provide keyboard activation.
  if (caseHero) {
    caseHero.addEventListener("focusin", () => { focus = true; sync(); });
    caseHero.addEventListener("focusout", (event) => {
      if (event.relatedTarget instanceof Node && caseHero.contains(event.relatedTarget)) return;
      focus = false;
      sync();
    });
  }
  if (tide) host.closest("#contact")?.addEventListener("pointermove", (event) => {
    if (!(event instanceof PointerEvent) || event.pointerType !== "mouse" || reduced.matches) return;
    const rect = host.getBoundingClientRect();
    px = clamp((event.clientX - rect.left) / rect.width);
    py = clamp((event.clientY - rect.top) / rect.height);
    wakeUntil = performance.now() + 850;
    sync();
  });
}

const fields = document.querySelectorAll<HTMLElement>("[data-bayer]");
const activate = (host: HTMLElement) => {
  const shape = host.dataset.bayer;
  if (shape === "tide" || (shape && Object.hasOwn(shapes, shape))) mount(host, shape as Shape);
};
if (typeof IntersectionObserver === "undefined") fields.forEach(activate);
else {
  const near = new IntersectionObserver((entries) => {
    for (const { isIntersecting, target } of entries) {
      if (!isIntersecting || !(target instanceof HTMLElement)) continue;
      near.unobserve(target);
      activate(target);
    }
  }, { rootMargin: "160px 0px" });
  fields.forEach((host) => near.observe(host));
}
