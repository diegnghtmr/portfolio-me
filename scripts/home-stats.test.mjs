import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dist = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), "utf8");
const feed = JSON.parse(dist("projects.json"));
const projects = feed.projects ?? feed;
const sizes = projects.map(({ repositories }) => repositories.length);
const [total, min, max] = [projects.length, Math.min(...sizes), Math.max(...sizes)];
const labels = {
  en: `projects, from ${min} to ${max} repositories each`,
  es: `proyectos, de ${min} a ${max} repositorios cada uno`,
};

for (const locale of ["en", "es"]) {
  test(`${locale}: the home counter matches the published project feed`, () => {
    const html = dist(`${locale}/index.html`);
    const stat = html.match(/<li class="stat"[\s\S]*?<\/li>/)?.[0] ?? "";
    assert.match(stat, new RegExp(`<span class="sr-only"[^>]*>${total}</span><span class="number" data-count="${total}"[^>]*>${total}</span>`));
    assert.match(stat, new RegExp(`<span class="stat-label"[^>]*>${labels[locale]}</span>`));
  });
}
