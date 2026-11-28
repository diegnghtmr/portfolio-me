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

test("S38: smoke waits until production serves the pushed commit, then probes production", () => {
  assert.match(smoke, /^on:\n  push:\n    branches: \[main\]\n  schedule:\n    - cron: '17 \*\/6 \* \* \*'\n  workflow_dispatch:\n/m);
  assert.match(smoke, /EXPECTED_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(smoke, /tolower\(\$1\) == "x-build-sha"/);
  assert.match(smoke, /id: deployment\n/);
  assert.match(smoke, /if \[ "\$live" = "\$EXPECTED_SHA" \]; then\n\s+echo "Production serves \$EXPECTED_SHA"\n\s+echo "ready=true" >> "\$GITHUB_OUTPUT"\n\s+exit 0\n\s+fi/);
  assert.match(smoke, /- if: steps\.deployment\.outputs\.ready == 'true'\n\s+run: node scripts\/mcp-smoke\.mjs "\$SITE"$/m);
  assert.match(smoke, /SITE: https:\/\/diegnghtmr\.me$/m);
});

test("S38: independent smoke runs skip only when production serves a descendant", () => {
  assert.doesNotMatch(smoke, /cancel-in-progress:\s*true/);
  assert.match(smoke, /fetch-depth: 0/);
  assert.match(smoke, /git fetch --no-tags origin main/);
  assert.match(smoke, /git merge-base --is-ancestor "\$EXPECTED_SHA" "\$live"; then\n\s+echo "[^"\n]*superseded[^"\n]*"\n\s+exit 0\n\s+fi/);
  assert.match(smoke, /echo "Production never served \$EXPECTED_SHA" >&2\n\s+exit 1/);
});

for (const [name, text] of [["CI", ci], ["smoke", smoke]]) {
  test(`S38: ${name} uses a read-only token, no secrets and SHA-pinned actions`, () => {
    assert.match(text, /^permissions:\n  contents: read\n/m);
    assert.match(text, /uses: actions\/checkout@[0-9a-f]{40}[^\n]*\n\s+with:\n(?:\s+ref:[^\n]*\n)?\s+persist-credentials: false\n/);
    assert.doesNotMatch(text, /\bsecrets\s*[.[]/);
    for (const [, action] of text.matchAll(/^\s+- uses: (\S+)/gm)) assert.match(action, /^[\w./-]+@[0-9a-f]{40}$/);
  });
}
