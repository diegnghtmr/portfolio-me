import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../dist/${path}/index.html`, import.meta.url), "utf8");
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/\s(data-[\w-]+)="([^"]*)"/g)]
  .map(([, name, value]) => [name, value]));

for (const [home, work] of [["en", "work"], ["es", "trabajo"]]) {
  test(`${home}: home card shapes, seeds, and ripple density stay unchanged`, () => {
    const covers = [...read(home).matchAll(/<li class="card" id="([^"]+)"[^>]*>\s*<a\b[^>]*>\s*(<div class="cover field"[^>]*>)/g)];
    assert.deepEqual(covers.map(([, id, tag]) => {
      const { "data-bayer": shape, "data-seed": seed, "data-rings": rings } = attributes(tag);
      return [id, shape, seed, rings];
    }), [
      ["p2", "ripple", "2", "24"], ["p4", "orbit", "4", undefined], ["p1", "dunes", "1", undefined],
      ["p7", "triage", "6", undefined], ["p3", "wave", "3", undefined], ["p5", "capacity", "5", undefined],
    ]);
  });

  test(`${home}: every case study has a unique seeded cover other than the hero sphere`, () => {
    const workPath = new URL(`../dist/${home}/${work}/`, import.meta.url);
    const slugs = readdirSync(workPath, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    assert.equal(slugs.length, 16);
    const byShape = new Map();
    for (const slug of slugs) {
      const covers = read(`${home}/${work}/${slug}`).match(/<div class="field case-cover"[^>]*>/g);
      assert.equal(covers?.length, 1, `${slug}: expected one case cover`);
      const { "data-bayer": shape, "data-seed": seed } = attributes(covers[0]);
      assert.ok(shape, `${slug}: missing shape`);
      assert.ok(seed?.trim() && Number.isFinite(Number(seed)), `${slug}: missing or invalid seed`);
      if (!byShape.has(shape)) byShape.set(shape, []);
      byShape.get(shape).push(slug);
    }
    assert.deepEqual({
      sphere: byShape.get("sphere"),
      duplicates: [...byShape].filter(([, slugs]) => slugs.length > 1),
      bay: byShape.get("shoreline"),
    }, { sphere: undefined, duplicates: [], bay: ["the-knowledge-bay"] });
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
