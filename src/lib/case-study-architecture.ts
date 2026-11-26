import type { Locale } from "../i18n";
import type { Architecture } from "./case-studies";

const boundaryMembership = {
  en: { inside: "inside the system boundary", outside: "outside the system boundary" },
  es: { inside: "dentro del límite del sistema", outside: "fuera del límite del sistema" },
};

export function describeArchitecture({ nodes, edges }: Architecture, locale: Locale) {
  const { inside, outside } = boundaryMembership[locale];
  const names = new Map(nodes.map(({ id, name }) => [id, name]));
  return [
    ...nodes.map(({ kind, name, label, tech, does }) =>
      `${name} (${label}${tech ? `, ${tech}` : ""}; ${kind === "external" ? outside : inside}): ${does}`),
    ...edges.map(({ from, to, protocol, verb }) => `${names.get(from)} → ${names.get(to)}${protocol ? ` (${protocol})` : ""}: ${verb}`),
  ];
}
