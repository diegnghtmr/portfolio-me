import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = (name) => readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), "utf8");
const ci = workflow("ci");
const smoke = workflow("production-smoke");

test("S38: CI runs for pushes and pull requests and discovers all script tests", () => {
  assert.match(ci, /^on:\n  push:\n  pull_request:\n/m);
  assert.match(ci, /- run: pnpm install --frozen-lockfile\s+- run: pnpm build\s+- run: node --test scripts\/\*\.test\.mjs/);
});

test("S38: smoke runs only for the green Vercel status of main's head, on that SHA, against production", () => {
  assert.match(smoke, /^on:\n  status:\n  workflow_dispatch:\n/m);
  assert.match(smoke, /github\.event\.context == 'Vercel' &&\s+github\.event\.state == 'success' &&\s+github\.event\.sha == github\.sha/);
  assert.match(smoke, /ref: \$\{\{ github\.event\.sha \|\| github\.sha \}\}/);
  assert.match(smoke, /- run: node scripts\/mcp-smoke\.mjs https:\/\/diegnghtmr\.me$/m);
});

for (const [name, text] of [["CI", ci], ["smoke", smoke]]) {
  test(`S38: ${name} uses a read-only token, no secrets and SHA-pinned actions`, () => {
    assert.match(text, /^permissions:\n  contents: read\n/m);
    assert.match(text, /uses: actions\/checkout@[0-9a-f]{40}[^\n]*\n\s+with:\n(?:\s+ref:[^\n]*\n)?\s+persist-credentials: false\n/);
    assert.doesNotMatch(text, /\bsecrets\s*[.[]/);
    for (const [, action] of text.matchAll(/^\s+- uses: (\S+)/gm)) assert.match(action, /^[\w./-]+@[0-9a-f]{40}$/);
  });
}
