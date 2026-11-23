import type { Architecture } from "./case-studies";

export function describeArchitecture({ nodes, edges }: Architecture) {
  const names = new Map(nodes.map(({ id, name }) => [id, name]));
  return [
    ...nodes.map(({ name, label, tech, does }) => `${name} (${label}${tech ? `, ${tech}` : ""}): ${does}`),
    ...edges.map(({ from, to, protocol, verb }) => `${names.get(from)} → ${names.get(to)}${protocol ? ` (${protocol})` : ""}: ${verb}`),
  ];
}
