import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../dist/${path}/index.html`, import.meta.url), "utf8");
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/\s(data-[\w-]+)="([^"]*)"/g)]
  .map(([, name, value]) => [name, value]));

for (const [home, work] of [["en", "work"], ["es", "trabajo"]]) {
  test(`${home}: only the Food Court showcase uses fewer ripple rings`, () => {
    const covers = [...read(home).matchAll(/<li class="card" id="([^"]+)"[^>]*>\s*<a\b[^>]*>\s*(<div class="cover field"[^>]*>)/g)];
    assert.deepEqual(covers.map(([, id]) => id), ["p2", "p4", "p1", "p7", "p3", "p5"]);
    assert.deepEqual(covers.map(([, , tag]) => attributes(tag)["data-rings"]),
      ["24", undefined, undefined, undefined, undefined, undefined]);
    assert.deepEqual(attributes(covers[0][2]), { "data-bayer": "ripple", "data-seed": "2", "data-rings": "24" });
  });

  test(`${home}: Academic Triage uses priority lanes on the home and case-study covers`, () => {
    const html = read(home);
    const cover = html.match(/<li class="card" id="p7"[^>]*>\s*<a\b[^>]*>\s*(<div class="cover field"[^>]*>)/)?.[1];
    const caseCover = read(`${home}/${work}/academic-triage`).match(/<div class="field case-cover"[^>]*>/)?.[0];
    assert.ok(cover, "expected the Academic Triage home cover");
    assert.ok(caseCover, "expected the Academic Triage case-study cover");
    assert.deepEqual([attributes(cover), attributes(caseCover)], Array(2).fill({ "data-bayer": "triage", "data-seed": "6" }));
    assert.doesNotMatch(html, /<div class="cover field"[^>]*\sdata-bayer="sphere"/);
  });

  test(`${home}: the Food Court case-study cover keeps the default seeded ripple`, () => {
    const cover = read(`${home}/${work}/food-court`).match(/<div class="field case-cover"[^>]*>/)?.[0];
    assert.ok(cover, "expected the case-study cover");
    assert.deepEqual(attributes(cover), { "data-bayer": "ripple", "data-seed": "2" });
  });
}
