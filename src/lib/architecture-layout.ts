import type { Architecture } from "./case-studies";

type Node = Architecture["nodes"][number];
type Edge = Architecture["edges"][number];
type Point = { x: number; y: number };
type Rect = Point & { w: number; h: number };
type Segment = [Point, Point];
type Line = { text: string; style: "kind" | "name" | "tech" | "does" | "system" | "protocol" | "verb"; x: number; y: number };
type Box = Rect & { node: Node; lines: Line[]; markerY: number };
type Route = { edge: Edge; points: Point[]; label?: Line[]; badge?: Point; reference: number };

const padding = 16;
const lineHeight = 24;
const edgeLineHeight = 19;
const byPosition = (a: Node, b: Node) => a.col - b.col || a.row - b.row || a.id.localeCompare(b.id);
const right = (rect: Rect) => rect.x + rect.w;
const bottom = (rect: Rect) => rect.y + rect.h;
const expand = ({ x, y, w, h }: Rect, n: number) => ({ x: x - n, y: y - n, w: w + 2 * n, h: h + 2 * n });
const overlaps = (a: Rect, b: Rect) => a.x < right(b) && right(a) > b.x && a.y < bottom(b) && bottom(a) > b.y;
const segments = (points: Point[]): Segment[] => points.slice(1).map((point, i) => [points[i]!, point]);
const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const at = (a: Point, b: Point, t: number) => ({ x: Math.round(a.x + (b.x - a.x) * t), y: Math.round(a.y + (b.y - a.y) * t) });

// Conservative font advances for the system sans and mono stacks. Wrap instead of
// shrinking type or asking the browser to resize the diagram after first paint.
const monoAdvance = (size: number) => size * .61;
const sansAdvance = (ch: string) => /[ilI1.,:!| ']/.test(ch) ? 5 : /[MW@%&]/.test(ch) ? 13 : /[A-ZÁÉÍÓÚÑ]/.test(ch) ? 10 : 8;
const measure = (text: string, advance: (ch: string) => number) => Array.from(text).reduce((sum, ch) => sum + advance(ch), 0);
function wrap(text: string, width: number, advance: (ch: string) => number): string[] {
  const parts = text.trim().match(/\s+|[^\s/_-]*[/_-]|[^\s/_-]+/gu) ?? [];
  const lines: string[] = [];
  let line = "";
  let space = "";
  for (const part of parts) {
    if (/^\s/u.test(part)) { space = " "; continue; }
    if (line && measure(line + space + part, advance) > width) {
      lines.push(line);
      line = "";
    }
    if (line) line += space;
    space = "";
    for (const ch of part) {
      if (line && measure(line + ch, advance) > width) {
        lines.push(line);
        line = "";
      }
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function makeBox(node: Node, w: number): Box {
  const lines: Line[] = [];
  const markerY = (node.kind === "store" ? 34 : 24) - 9;
  let y = markerY + 9;
  function add(text: string, style: Line["style"], advance: (ch: string) => number, x = padding) {
    for (const line of wrap(text, w - x - padding, advance)) {
      lines.push({ text: line, style, x, y });
      y += lineHeight;
    }
  }
  add(node.label, "kind", () => monoAdvance(13), padding + 12);
  y += 5;
  add(node.name, "name", () => monoAdvance(15));
  if (node.tech) add(node.tech, "tech", sansAdvance);
  add(node.does, "does", sansAdvance);
  return { node, x: 0, y: 0, w, h: Math.max(96, y + (node.kind === "store" ? 10 : 0)), lines, markerY };
}

function grid(boxes: Box[], columns: number[], xFor: (col: number) => number, top: number, rowGap: number) {
  let y = top;
  for (const row of [...new Set(boxes.map(({ node }) => node.row))].sort((a, b) => a - b)) {
    const heights = columns.map((col) => {
      let cursor = y;
      for (const box of boxes.filter(({ node }) => node.row === row && node.col === col)) {
        box.x = xFor(col);
        box.y = cursor;
        cursor += box.h + rowGap;
      }
      return cursor;
    });
    y = Math.max(...heights);
  }
  return boxes.length ? y - rowGap : top;
}

const sides = ["right", "left", "bottom", "top"] as const;
type Side = (typeof sides)[number];
function stub(box: Box, side: Side, offset: number, clearance: number): Segment {
  const x = box.x + Math.round(box.w / 2) + (side === "bottom" || side === "top" ? offset : 0);
  const y = box.y + 60 + (side === "right" || side === "left" ? offset : 0);
  if (side === "right") return [{ x: right(box), y }, { x: right(box) + clearance, y }];
  if (side === "left") return [{ x: box.x, y }, { x: box.x - clearance, y }];
  if (side === "bottom") return [{ x, y: bottom(box) }, { x, y: bottom(box) + clearance }];
  return [{ x, y: box.y }, { x, y: box.y - clearance }];
}

const span = (a: Point, b: Point, gap = 0): Rect => ({
  x: Math.min(a.x, b.x) - gap, y: Math.min(a.y, b.y) - gap,
  w: Math.abs(a.x - b.x) + 2 * gap, h: Math.abs(a.y - b.y) + 2 * gap,
});
const simplify = (points: Point[]) => points.filter((point, i) => i === 0 || distance(point, points[i - 1]!) > 0)
  .filter((point, i, all) => {
    const before = all[i - 1];
    const after = all[i + 1];
    return !before || !after || (before.x !== point.x || point.x !== after.x) && (before.y !== point.y || point.y !== after.y);
  });

// Build a visibility grid using the channels around padded boxes. Route to real
// box ports; penalize turns and reuse of a channel, but allow crossings in dense graphs.
function router(obstacles: Rect[], width: number, height: number, used: Segment[]) {
  const rails = (values: number[], size: number) => [...new Set([14, size - 14, ...values])].sort((a, b) => a - b);
  const baseX = rails(obstacles.flatMap((rect) => [rect.x, right(rect)]), width);
  const baseY = rails(obstacles.flatMap((rect) => [rect.y, bottom(rect)]), height);
  const clear = (a: Point, b: Point) => !obstacles.some((rect) => overlaps(span(a, b), rect));
  return (from: Box, to: Box, offset: [number, number]): Point[] => {
    const sources = sides.map((side) => stub(from, side, offset[0], 10));
    const targets = sides.map((side) => stub(to, side, offset[1], 10));
    const ports = [...sources, ...targets].map(([, outer]) => outer);
    const xs = rails([...baseX, ...ports.map(({ x }) => x)], width);
    const ys = rails([...baseY, ...ports.map(({ y }) => y)], height);
    const index = ({ x, y }: Point) => ys.indexOf(y) * xs.length + xs.indexOf(x);
    const points = ys.flatMap((y) => xs.map((x) => ({ x, y })));
    const goal = new Map(targets.map(([inner, outer], i) => [2 * index(outer) + Number(i >= 2), inner]));
    const source = new Map(sources.map(([inner, outer], i) => [2 * index(outer) + Number(i >= 2), inner]));
    const costs = points.flatMap(() => [Infinity, Infinity]);
    const previous = points.flatMap(() => [-1, -1]);
    const queue = new Set<number>();
    const fromCenter = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
    const toCenter = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
    const directionCost = (port: Point, center: Point, other: Point) => distance(port, other) > distance(center, other) ? 24 : 0;
    for (const [state, inner] of source) {
      costs[state] = directionCost(inner, fromCenter, toCenter);
      queue.add(state);
    }
    let last = -1;
    let best = Infinity;
    while (queue.size) {
      let state = -1;
      for (const candidate of queue) if (state < 0 || costs[candidate]! < costs[state]!) state = candidate;
      queue.delete(state);
      const currentCost = costs[state]!;
      if (currentCost >= best) break;
      const id = Math.floor(state / 2);
      const point = points[id]!;
      const target = goal.get(state);
      if (target && (from !== to || !source.has(state))) {
        const total = currentCost + directionCost(target, toCenter, fromCenter);
        if (total < best) { last = state; best = total; }
      }
      const xi = id % xs.length;
      const yi = Math.floor(id / xs.length);
      for (const [x, y] of [[xi - 1, yi], [xi + 1, yi], [xi, yi - 1], [xi, yi + 1]] as const) {
        if (x < 0 || y < 0 || x >= xs.length || y >= ys.length) continue;
        const next = y * xs.length + x;
        const q = points[next]!;
        if (!clear(point, q)) continue;
        const axis = Number(x === xi);
        const dest = next * 2 + axis;
        const congestion = used.reduce((sum, [a, b]) => {
          if (!overlaps(span(point, q, 1), span(a, b, 1))) return sum;
          return sum + ((a.x === b.x) === Boolean(axis) ? 16 : 4);
        }, 0);
        const cost = currentCost + distance(point, q) + (axis === state % 2 ? 0 : 26) + congestion;
        if (cost >= costs[dest]!) continue;
        costs[dest] = cost;
        previous[dest] = state;
        queue.add(dest);
      }
    }
    if (last < 0) throw new Error(`Could not route architecture edge ${from.node.id} → ${to.node.id}`);
    const path = [goal.get(last)!];
    for (let state = last; state >= 0; state = previous[state]!) {
      path.push(points[Math.floor(state / 2)]!);
      if (previous[state]! < 0) path.push(source.get(state)!);
    }
    return simplify(path.reverse());
  };
}

function placeLabel(route: Route, width: number, height: number, blocked: Rect[], otherLines: Segment[]) {
  const fits = (rect: Rect) => rect.x >= 4 && rect.y >= 4 && right(rect) <= width - 4 && bottom(rect) <= height - 4 &&
    !blocked.some((other) => overlaps(rect, other));
  const stretches = segments(route.points).sort(([a, b], [c, d]) => distance(c, d) - distance(a, b));
  const lines = [...otherLines, ...stretches].map(([a, b]) => span(a, b, 1));
  const mono = () => monoAdvance(13);
  const protocol = route.edge.protocol ? [route.edge.protocol.trim().replace(/\s+/g, " ")] : [];
  const blocks = (limit: number) => {
    const verb = wrap(route.edge.verb, limit, sansAdvance);
    // If a label would break a word, use its reference instead of stacking fragments.
    if (verb.join(" ").replace(/\s+/g, " ") !== route.edge.verb.trim().replace(/\s+/g, " ")) return;
    return [
      { style: "protocol" as const, text: protocol, w: Math.max(0, ...protocol.map((s) => measure(s, mono))) + 8 },
      { style: "verb" as const, text: verb, w: Math.max(...verb.map((s) => measure(s, sansAdvance))) + 8 },
    ].filter(({ text }) => text.length);
  };
  for (const [a, b] of stretches) {
    if (distance(a, b) < 28) continue;
    for (const limit of [128, 96, 72]) {
      const parts = blocks(limit);
      if (!parts) continue;
      const w = Math.max(...parts.map(({ w }) => w));
      const h = parts.reduce((sum, part) => sum + part.text.length * edgeLineHeight, 0) + 2;
      for (const t of [.5, .35, .65, .2, .8]) {
        const p = at(a, b, t);
        const positions = a.y === b.y
          ? [{ x: p.x - w / 2, y: p.y - h - 4 }, { x: p.x - w / 2, y: p.y + 4 }]
          : [{ x: p.x + 4, y: p.y - h / 2 }, { x: p.x - w - 4, y: p.y - h / 2 }];
        const canPlace = (rect: Rect) => fits(rect) && !lines.some((line) => overlaps(rect, line));
        const pair = a.y === b.y && parts[0]?.style === "protocol" && parts[1];
        if (pair) {
          const above = { x: p.x - parts[0]!.w / 2, y: p.y - edgeLineHeight - 7, w: parts[0]!.w, h: edgeLineHeight + 2 };
          const below = { x: p.x - pair.w / 2, y: p.y + 4, w: pair.w, h: edgeLineHeight * pair.text.length + 2 };
          if (canPlace(above) && canPlace(below)) {
            route.label = [
              { text: protocol[0]!, style: "protocol", x: p.x, y: above.y + 15 },
              ...pair.text.map((text, i): Line => ({ text, style: "verb", x: p.x, y: below.y + 15 + i * edgeLineHeight })),
            ];
            blocked.push(expand(above, 2), expand(below, 2));
            return;
          }
        }
        for (const position of positions) {
          const rect = { ...position, w, h };
          if (!canPlace(rect)) continue;
          const labelLines = parts.flatMap(({ text, style }) => text.map((text) => ({ text, style })));
          route.label = labelLines.map(({ text, style }, i) => ({ text, style, x: rect.x + w / 2, y: rect.y + 15 + i * edgeLineHeight }));
          blocked.push(expand(rect, 2));
          return;
        }
      }
    }
  }
  // Congested junctions use keyed flow labels below the plot rather than text on a box.
  for (const [a, b] of stretches) {
    for (const t of [.5, .25, .75, .125, .875]) {
      const p = at(a, b, t);
      const rect = { x: p.x - 10, y: p.y - 10, w: 20, h: 20 };
      if (!fits(rect)) continue;
      route.badge = p;
      blocked.push(expand(rect, 2));
      return;
    }
  }
}

export function layoutArchitecture({ nodes, edges, system }: Architecture, narrow: boolean) {
  const inner = nodes.filter(({ kind }) => kind !== "external").sort(byPosition);
  const outer = nodes.filter(({ kind }) => kind === "external").sort(byPosition);
  const columns = [...new Set(inner.map(({ col }) => col))];
  const allColumns = [...new Set([...columns, ...outer.map(({ col }) => col)])].sort((a, b) => a - b);
  const rightSide = !narrow && outer.length > 0 && outer.every(({ col }) => col > columns.at(-1)!);
  const placedColumns = rightSide ? allColumns : columns;
  const count = placedColumns.length;
  const cell = count >= 4 ? 168 : count === 3 ? 204 : 224;
  const gap = count >= 4 ? 54 : count === 3 ? 108 : 136;
  const margin = narrow ? 40 : 24;
  const width = narrow ? 312 : cell * count + gap * (count - 1) + 2 * margin;
  const nodeWidth = narrow ? 232 : cell;
  const xFor = (col: number) => margin + placedColumns.indexOf(col) * (cell + gap);
  const systemText = wrap(system, (narrow ? width : xFor(columns.at(-1)!) + cell + margin) - 2 * margin, () => monoAdvance(16));
  const systemLines = systemText.map((text, i): Line => ({ text, style: "system", x: margin, y: 30 + lineHeight * i }));
  const top = 52 + (systemLines.length - 1) * lineHeight;
  const innerBoxes = inner.map((node) => makeBox(node, nodeWidth));
  const outerBoxes = outer.map((node) => makeBox(node, nodeWidth));
  const rowGap = narrow ? 68 : 72;
  function vertical(boxes: Box[], y: number) {
    for (const box of boxes) {
      box.x = margin;
      box.y = y;
      y += box.h + rowGap;
    }
    return y - rowGap;
  }
  const insideBottom = narrow ? vertical(innerBoxes, top) : grid(innerBoxes, columns, xFor, top, rowGap);
  const boundary = { x: .5, y: .5, w: (narrow ? width : xFor(columns.at(-1)!) + cell + margin) - 1, h: insideBottom + margin - .5 };
  const outerTop = bottom(boundary) + (narrow ? 64 : 60);
  let outerBottom = 0;
  if (outer.length) {
    if (narrow) outerBottom = vertical(outerBoxes, outerTop);
    else if (rightSide) outerBottom = grid(outerBoxes, placedColumns, xFor, top, rowGap);
    else {
      // Externals that do not have a dedicated column occupy a separate band.
      const ordered = outerBoxes.map((box, i) => ({ ...box, node: { ...box.node, col: columns[i % columns.length]!, row: Math.floor(i / columns.length) } }));
      outerBottom = grid(ordered, columns, xFor, outerTop, rowGap);
      ordered.forEach(({ x, y }, i) => Object.assign(outerBoxes[i]!, { x, y }));
    }
  }
  const height = Math.max(bottom(boundary), outerBottom ? outerBottom + margin : 0) + 1;
  const boxes = [...innerBoxes, ...outerBoxes];
  const byId = new Map(boxes.map((box) => [box.node.id, box]));
  const heading = { x: margin - 4, y: 12, w: Math.max(...systemText.map((text) => measure(text, () => monoAdvance(16)))) + 8, h: top - 24 };
  const usage = new Map<string, number[]>();
  edges.forEach(({ from, to }, i) => {
    for (const id of [from, to]) {
      const connected = usage.get(id) ?? [];
      connected.push(i);
      usage.set(id, connected);
    }
  });
  const used: Segment[] = [];
  const route = router([...boxes.map((box) => expand(box, 10)), heading], width, height, used);
  const routes = edges.map((edge, i): Route => {
    const offset = (id: string, last = false) => {
      const connected = usage.get(id)!;
      const index = last ? connected.lastIndexOf(i) : connected.indexOf(i);
      return Math.round((index - (connected.length - 1) / 2) * Math.min(10, 56 / connected.length));
    };
    const points = route(byId.get(edge.from)!, byId.get(edge.to)!, [offset(edge.from), offset(edge.to, true)]);
    used.push(...segments(points));
    return { edge, points, reference: i + 1 };
  });
  const { x, y } = boundary;
  const r = right(boundary);
  const b = bottom(boundary);
  const border = segments([{ x, y }, { x: r, y }, { x: r, y: b }, { x, y: b }, { x, y }]).map(([a, b]) => span(a, b, 3));
  const blocked = [...boxes.map((box) => expand(box, 4)), expand(heading, 4), ...border];
  for (const edge of routes) placeLabel(edge, width, height, blocked, routes.filter((route) => route !== edge).flatMap(({ points }) => segments(points)));
  return { width, height, boundary, systemLines, boxes, routes };
}
