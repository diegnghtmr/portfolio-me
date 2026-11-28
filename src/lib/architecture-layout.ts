import ELK, { type ElkExtendedEdge, type ElkLabel, type ElkNode, type ElkPort, type LayoutOptions } from "elkjs";
import type { Architecture } from "./case-studies";

type Node = Architecture["nodes"][number];
type Edge = Architecture["edges"][number];
type Point = { x: number; y: number };
type Rect = Point & { w: number; h: number };
type Style = "kind" | "name" | "tech" | "does" | "system" | "protocol" | "verb";
type Line = Point & { text: string; style: Style };

// Astro calls this module when generating pages, not in a client script.
const elk = new ELK({ algorithms: ["layered"] });
const padding = 14;
const boundaryInset = 18;
const titlePitch = 20;
const labelInset = 5;
const labelPitch = 16;
const mono = (size: number) => () => size * .61;
const sans = (ch: string) => /[ ilI1.,:!|'’]/u.test(ch) ? 4.5 : /[MW@%&]/u.test(ch) ? 12 : /\p{Lu}/u.test(ch) ? 9.5 : 7.7;
const measure = (text: string, advance: (ch: string) => number) => Array.from(text).reduce((sum, ch) => sum + advance(ch), 0);
const byPosition = (a: Node, b: Node) => a.col - b.col || a.row - b.row;

// Keep words intact when possible; repository names can also break at a separator.
function wrap(text: string, width: number, advance: (ch: string) => number) {
  const lines: string[] = [];
  let line = "";
  for (const part of text.trim().match(/\s*[^\s/_-]*[/_-]|\s*[^\s/_-]+/gu) ?? []) {
    if (line && measure(line + part, advance) > width) {
      lines.push(line);
      line = "";
    }
    for (const ch of line ? part : part.trimStart()) {
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

function makeBox(node: Node, w: number) {
  const lines: Line[] = [];
  const markerY = node.kind === "store" ? 26 : 16;
  let y = markerY + 8;
  const add = (text: string, style: Style, advance: (ch: string) => number, x = padding) => {
    for (const fragment of wrap(text, w - x - padding, advance)) {
      lines.push({ text: fragment, style, x, y });
      y += 18;
    }
  };
  add(node.label, "kind", mono(13), padding + 12);
  y += 4;
  add(node.name, "name", mono(15));
  if (node.tech) add(node.tech, "tech", sans);
  add(node.does, "does", sans);
  return { node, w, h: y + (node.kind === "store" ? 8 : 0), lines, markerY };
}

function makeLabel(edge: Edge, limit: number) {
  const blocks = [
    { style: "protocol" as const, text: edge.protocol, advance: mono(13) },
    { style: "verb" as const, text: edge.verb, advance: sans },
  ];
  const lines = blocks.flatMap(({ style, text, advance }) => text ?
    wrap(text, limit, advance).map((fragment) => ({ style, text: fragment, w: measure(fragment, advance) })) : []);
  return { lines, w: Math.ceil(Math.max(...lines.map(({ w }) => w))) + 2 * labelInset, h: 2 * labelInset + lines.length * labelPitch };
}

const nodeId = (id: string) => `node:${id}`;
const offset = (origin: Point, p: Point) => ({ x: origin.x + p.x, y: origin.y + p.y });

function countBends(points: Point[]) {
  let bends = 0;
  let previousAxis: "x" | "y" | undefined;
  let previousPoint: Point | undefined;
  for (const point of points) {
    const start = previousPoint;
    previousPoint = point;
    if (!start) continue;
    const sameX = Math.abs(point.x - start.x) < 1e-6;
    const sameY = Math.abs(point.y - start.y) < 1e-6;
    if (sameX && sameY) continue; // Compound sections can repeat a join point.
    const axis = sameX ? "y" : "x";
    if (previousAxis && previousAxis !== axis) bends++;
    previousAxis = axis;
  }
  return bends;
}

function shape(item: ElkNode | ElkLabel): Rect {
  const { x, y, width: w, height: h } = item;
  if (x === undefined || y === undefined || w === undefined || h === undefined) {
    throw new Error(`ELK did not place architecture shape ${item.id}`);
  }
  return { x, y, w, h };
}

export async function layoutArchitecture({ nodes, edges, system }: Architecture, variant: "narrow" | "wide" | "wide-compact" | "wide-scroll") {
  const narrow = variant === "narrow";
  const compactWide = variant === "wide-compact";
  const options: LayoutOptions = {
    "elk.algorithm": "layered",
    "elk.direction": narrow ? "DOWN" : "RIGHT",
    "elk.edgeRouting": "ORTHOGONAL",
    "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    "elk.layered.cycleBreaking.strategy": "GREEDY_MODEL_ORDER",
    ...(narrow ? {
      "elk.layered.layering.strategy": "COFFMAN_GRAHAM",
      "elk.layered.layering.coffmanGraham.layerBound": "1",
      "elk.layered.nodePlacement.strategy": "SIMPLE",
    } : {
      // Layer wrapping folds a rightward path back around the preceding row.
      // Keep the direction strict instead of trading route length for width.
      "elk.layered.wrapping.strategy": "OFF",
      "elk.layered.layering.strategy": "LONGEST_PATH_SOURCE",
      // ELK 0.12.1's model-order sorter crashes on Food Court's long-edge
      // dummy nodes. Use the ordered input and GREEDY_MODEL_ORDER instead.
      "elk.layered.considerModelOrder.strategy": "NONE",
    }),
    "elk.separateConnectedComponents": "false",
    "elk.spacing.nodeNode": narrow ? "12" : "20",
    "elk.spacing.edgeNode": narrow ? "5" : "7",
    "elk.spacing.edgeEdge": narrow ? "5" : "6",
    "elk.spacing.edgeLabel": "4",
    "elk.layered.spacing.nodeNodeBetweenLayers": narrow ? "19" : "14",
    "elk.layered.spacing.edgeNodeBetweenLayers": narrow ? "8" : "6",
    "elk.layered.spacing.edgeEdgeBetweenLayers": narrow ? "8" : "6",
    "elk.randomSeed": "1",
  };
  const external = new Set(nodes.filter(({ kind }) => kind === "external").map(({ id }) => id));
  const finalColumn = Math.max(...nodes.filter(({ kind }) => kind !== "external").map(({ col }) => col));
  // Keep dependencies beside scroll-only graphs so a horizontally offscreen
  // dependency doesn't reserve a blank band. Compact wide graphs trade that
  // extra column for a row below the boundary without reducing text size.
  const right = !narrow && !compactWide && external.size > 0 && (variant === "wide-scroll" ||
    nodes.some(({ id, kind, col }) => kind === "external" && col > finalColumn &&
      edges.some(({ from, to }) => (to === id && !external.has(from)) || (from === id && !external.has(to)))));
  const below = !narrow && external.size > 0 && !right;
  const compact = !narrow && (compactWide || finalColumn >= 3 || right);
  const nodeWidth = compact ? 176 : 232;
  const boxes = nodes.map((node) => makeBox(node, nodeWidth));
  const flow = edges.map((edge, i) => {
    // Place external dependencies downstream of the compound node, even for
    // inbound flows. Restore the semantic direction before drawing the arrow.
    const reverse = external.has(edge.from) && !external.has(edge.to);
    const from = reverse ? edge.to : edge.from;
    const to = reverse ? edge.from : edge.to;
    const label = makeLabel(edge, narrow ? 176 : compact ? 80 : 91);
    const id = `label:${i}`;
    const link: ElkExtendedEdge = { id: `flow:${i}`, sources: [nodeId(from)], targets: [nodeId(to)] };
    // A narrow label occupies a layer of its own, otherwise ELK can stack
    // several labels across a single layer and make the diagram too wide.
    const inlineNode: ElkNode = {
      id, width: label.w, height: label.h,
      layoutOptions: { "elk.portConstraints": "FIXED_SIDE" },
      ports: [
        { id: `${id}:in`, width: 0, height: 0, layoutOptions: { "elk.port.side": "NORTH" } },
        { id: `${id}:out`, width: 0, height: 0, layoutOptions: { "elk.port.side": "SOUTH" } },
      ],
    };
    const withLabel: ElkExtendedEdge = { ...link, labels: [{
      id, text: label.lines.map(({ text }) => text).join("\n"), width: label.w, height: label.h,
      layoutOptions: { "elk.edgeLabels.placement": "CENTER", "elk.edgeLabels.inline": "true" },
    }] };
    const internal = !external.has(from) && !external.has(to);
    const links: ElkExtendedEdge[] = narrow ? [
      { ...link, targets: [`${id}:in`] },
      { id: `continuation:${i}`, sources: [`${id}:out`], targets: link.targets },
    ] : [withLabel];
    // The wide boundary stays RIGHT; dependencies are layered below it in
    // the outer graph. A shared south port joins their two routed sections.
    const port: ElkPort | undefined = below && !external.has(from) && external.has(to)
      ? { id: `exit:${i}`, width: 0, height: 0, layoutOptions: { "elk.port.side": "SOUTH" } } : undefined;
    const sourcePort: ElkPort | undefined = port
      ? { id: `exit-source:${i}`, width: 0, height: 0, layoutOptions: { "elk.port.side": "SOUTH" } } : undefined;
    const inner = port && sourcePort ? [{ ...link, id: `boundary:${i}`, sources: [sourcePort.id], targets: [port.id] }] : internal ? links : [];
    const outer = port ? [{ ...withLabel, sources: [port.id] }] : internal ? [] : links;
    return { inner, outer, inlineNode, label, reverse, internal, port, from, sourcePort };
  });

  const children = (outside: boolean): ElkNode[] => boxes
    .filter(({ node }) => external.has(node.id) === outside)
    .sort((a, b) => byPosition(a.node, b.node))
    .map(({ node, w, h }, i) => {
      const ports = flow.flatMap(({ from, sourcePort }) => from === node.id && sourcePort ? [sourcePort] : []);
      // In wide mode keep modeled entry points and terminal stores in the
      // first and last columns. The sweep still places other nodes.
      const layoutOptions: LayoutOptions = {};
      if (ports.length) layoutOptions["elk.portConstraints"] = "FIXED_SIDE";
      if ((i === 0 || !narrow) && node.col === 0 && !outside && !edges.some(({ from, to }) => to === node.id && !external.has(from))) {
        layoutOptions["elk.layered.layering.layerConstraint"] = "FIRST";
      } else if (!narrow && node.kind === "store" && node.col === finalColumn && !edges.some(({ from }) => from === node.id)) {
        layoutOptions["elk.layered.layering.layerConstraint"] = "LAST";
      }
      return { id: nodeId(node.id), width: w, height: h, ports, layoutOptions };
    });
  const titleAdvance = mono(16);
  let title = wrap(system, narrow ? 200 : 232, titleAdvance);
  const graph = (titleHeight: number): ElkNode => ({
    id: "diagram",
    layoutOptions: {
      ...options,
      ...(below ? { "elk.direction": "DOWN", "elk.layered.spacing.nodeNodeBetweenLayers": "26" } : {}),
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.padding": "[top=2,left=2,bottom=2,right=2]",
    },
    children: [{
      id: "system",
      children: [...children(false), ...(narrow ? flow.filter(({ internal }) => internal).map(({ inlineNode }) => inlineNode) : [])],
      edges: flow.flatMap(({ inner }) => inner),
      ports: flow.flatMap(({ port }) => port ? [port] : []),
      layoutOptions: {
        ...options,
        "elk.hierarchyHandling": below ? "SEPARATE_CHILDREN" : "INCLUDE_CHILDREN",
        ...(below ? { "elk.portConstraints": "FIXED_SIDE" } : {}),
        "elk.padding": `[top=${28 + titleHeight},left=${boundaryInset},bottom=${boundaryInset},right=${boundaryInset}]`,
      },
    }, ...children(true), ...(narrow ? flow.filter(({ internal }) => !internal).map(({ inlineNode }) => inlineNode) : [])],
    edges: flow.flatMap(({ outer }) => outer),
  });
  const place = async (lineCount: number) => {
    const result = await elk.layout(structuredClone(graph(lineCount * titlePitch)));
    const compound = result.children?.find(({ id }) => id === "system");
    if (!compound) throw new Error("ELK did not place the architecture boundary");
    return { result, compound, boundary: shape(compound) };
  };
  let { result, compound, boundary } = await place(title.length);
  if (title.some((line) => measure(line, titleAdvance) > boundary.w - 2 * boundaryInset)) {
    // At least one internal node fits between the boundary insets. Use its
    // width as a lower bound that still holds after ELK reserves more height.
    const fitted = wrap(system, nodeWidth, titleAdvance);
    if (fitted.length !== title.length) ({ result, compound, boundary } = await place(fitted.length));
    title = fitted;
  }
  const systemLines = title.map((text, i): Line => ({ text, style: "system", x: boundary.x + boundaryInset, y: boundary.y + 27 + i * titlePitch }));
  const zero = { x: 0, y: 0 };
  const located = new Map<string, Rect>();
  for (const [items, origin] of [[compound.children, boundary], [result.children, zero]] as const) {
    for (const item of items ?? []) {
      const rect = shape(item);
      located.set(item.id, { ...rect, ...offset(origin, rect) });
    }
  }
  const placedEdges = new Map([...(compound.edges ?? []), ...(result.edges ?? [])].map((link) => [link.id, link]));
  const routePoints = ({ id }: ElkExtendedEdge, origin: Point) => {
    const sections = placedEdges.get(id)?.sections;
    if (!sections?.length) throw new Error(`ELK did not route architecture edge ${id}`);
    // Follow compound sections in order so the arrow points to the real target.
    const byId = new Map(sections.map((section) => [section.id, section]));
    const points: Point[] = [];
    for (let section = sections.find(({ incomingSections }) => !incomingSections?.length); section;
      section = byId.get(section.outgoingSections?.[0] ?? "")) {
      points.push(...[section.startPoint, ...section.bendPoints ?? [], section.endPoint].map((p) => offset(origin, p)));
    }
    return points;
  };
  const routes = flow.map(({ inner, outer, inlineNode, label, reverse }) => {
    const points = [...inner.flatMap((link) => routePoints(link, boundary)), ...outer.flatMap((link) => routePoints(link, zero))];
    const placed = placedEdges.get((outer[0] ?? inner[0])!.id)?.labels?.[0];
    const origin = outer.length ? zero : boundary;
    const rect = placed && shape(placed);
    const labelBox = rect ? { ...rect, ...offset(origin, rect) } : located.get(inlineNode.id);
    if (!labelBox) throw new Error(`ELK did not place architecture label ${inlineNode.id}`);
    const lines = label.lines.map(({ text, style }, i): Line => ({
      text, style, x: labelBox.x + labelBox.w / 2, y: labelBox.y + labelInset + 12 + i * labelPitch,
    }));
    return { points: reverse ? points.reverse() : points, labelBox, lines };
  });
  if (right) {
    const adjacent = (result.children ?? []).filter((item) => item !== compound).map(shape);
    // Align the drawn bottom edges without moving routes or enclosing any
    // external node. A low port can otherwise leave a band under the system.
    if (adjacent.every(({ x }) => x >= boundary.x + boundary.w)) {
      const rowBottom = Math.max(...adjacent.map(({ y, h }) => y + h), ...routes.map(({ labelBox }) => labelBox.y + labelBox.h));
      boundary.h = Math.max(boundary.h, rowBottom - boundary.y);
    }
  }
  return {
    width: Math.ceil(result.width ?? 0), height: Math.ceil(result.height ?? 0), boundary, systemLines, routes,
    bends: routes.reduce((total, { points }) => total + countBends(points), 0),
    boxes: boxes.map((box) => {
      const position = located.get(nodeId(box.node.id));
      if (!position) throw new Error(`ELK did not place architecture node ${box.node.id}`);
      return { ...box, ...position };
    }),
  };
}
