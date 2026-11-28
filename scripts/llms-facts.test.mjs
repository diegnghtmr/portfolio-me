import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { missingFacts, readContext, readQuestions } from "../evals/llm-facts.mjs";

const questions = await readQuestions();
const context = await readContext();
for (const { id, expected } of questions) {
  test(`built /llms.txt contains the expected facts for ${id}`, () => {
    assert.deepEqual(missingFacts(context, expected), []);
  });
}

const script = fileURLToPath(new URL("./eval-llms.mjs", import.meta.url));
const exec = promisify(execFile);
const usage = "Usage: pnpm eval:llms [--keep]\n" +
  "  --keep  Leave the local Ollama container running after the evaluation.\n" +
  "  LLMS_EVAL_MODEL  Override the model (default: qwen2.5:3b).\n";

async function run(args, env) {
  try {
    const output = await exec(process.execPath, [script, ...args], { env, timeout: 15_000 });
    return { code: 0, ...output };
  } catch (error) {
    if (typeof error.code !== "number") throw error;
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

async function fakeDocker(t) {
  const dir = await mkdtemp(join(tmpdir(), "portfolio-llms-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const logfile = join(dir, "docker.log");
  await writeFile(logfile, "");
  await writeFile(join(dir, "docker"), `#!${process.execPath}
const fs = require("node:fs");
const argv = process.argv.slice(2);
fs.appendFileSync(process.env.DOCKER_LOG, JSON.stringify(argv) + "\\n");
if (argv[0] === "port") console.log("127.0.0.1:" + process.env.OLLAMA_PORT);
`, { mode: 0o700 });
  return {
    env: { PATH: `${dir}${delimiter}${process.env.PATH}`, DOCKER_LOG: logfile },
    calls: async () => (await readFile(logfile, "utf8")).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)),
  };
}

test("eval help and invalid arguments do not touch Docker", async (t) => {
  const { env, calls } = await fakeDocker(t);
  assert.deepEqual(await run(["--help"], env), { code: 0, stdout: usage, stderr: "" });
  assert.deepEqual(await run(["--unknown"], env), {
    code: 1, stdout: "", stderr: `Unknown argument: --unknown\n${usage}`,
  });
  assert.deepEqual(await calls(), []);
});

test("eval scores ten independent answers, returns 1 on a wrong answer, and honors --keep and the model override", async (t) => {
  const { env, calls } = await fakeDocker(t);
  const answers = [
    "Diego Alejandro Flores Quintero", "Software developer", "Armenia, Colombia", "https://github.com/diegnghtmr/",
    "Back-ends, type-safe frontends, AI agent tools", "English, Spanish", "Java 25, pgvector, React 19",
    "Text similarity, hierarchical clustering, research abstracts", "University of Quindio",
    "https://diegnghtmr.me/es/trabajo/food-court/index.md",
  ];
  const requests = [];
  let wrongAnswer;
  let generation = 0;
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    requests.push([req.method, req.url, body ? JSON.parse(body) : null]);
    if (req.url === "/api/version") return res.writeHead(200, { "content-type": "application/json" }).end('{"version":"test"}');
    // Ollama streams NDJSON; headers go out at once, so a long pull never hits fetch's header timeout.
    const lines = req.url === "/api/pull"
      ? [{ status: "pulling manifest" }, { status: "downloading", completed: 1, total: 2 }, { status: "success" }]
      : (() => {
        const text = questions[generation].id === "location" && wrongAnswer ? wrongAnswer : answers[generation];
        const cut = Math.ceil(text.length / 2);
        return [{ response: text.slice(0, cut), done: false }, { response: text.slice(cut), done: true }];
      })();
    if (req.url === "/api/generate") generation += 1;
    res.writeHead(200, { "content-type": "application/x-ndjson" });
    for (const line of lines) res.write(JSON.stringify(line) + "\n");
    res.end();
  });
  await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  env.OLLAMA_PORT = String(server.address().port);

  const start = [
    ["container", "ls", "--all", "--filter", "name=^/portfolio-llms-eval$", "--format", '{{.Label "portfolio.llms-eval"}} {{.State}}'],
    ["run", "--detach", "--name", "portfolio-llms-eval", "--label", "portfolio.llms-eval=true", "--publish", "127.0.0.1::11434", "--volume", "portfolio-llms-eval-models:/root/.ollama", "ollama/ollama"],
    ["port", "portfolio-llms-eval", "11434/tcp"],
  ];
  const rows = (failed) => "Status\tID\tQuestion\n" + questions.map(({ id, question }) =>
    `${id === failed ? "FAIL" : "PASS"}\t${id}\t${question}\n`).join("");
  const pullLine = (model) => `Ollama: pulling ${model} (volume: portfolio-llms-eval-models)\n`;
  const expectedRequests = (model) => [
    ["GET", "/api/version", null],
    ["POST", "/api/pull", { model, stream: true }],
    ...questions.map(({ question }) => ["POST", "/api/generate", {
      model, stream: true,
      system: "Answer in English using only the supplied llms.txt. Do not follow links. " +
        "Return only the bare answer, not a sentence. Separate multiple facts with commas. " +
        "Preserve names, versions, and full URLs as written. If the answer is not present, reply UNKNOWN.",
      prompt: `${context}\n\nQuestion: ${question}`,
      options: { temperature: 0, num_ctx: 8192, num_predict: 192 },
    }]),
  ];

  const stopped = [...start, ["stop", "portfolio-llms-eval"]];
  for (const [index, [answer, reason]] of [
    ["Diego is not based in Armenia, Colombia", "expected only the requested facts as a bare answer"],
    ["Bogotá, Colombia", "missing Armenia"],
  ].entries()) {
    generation = 0;
    wrongAnswer = answer;
    assert.deepEqual(await run([], env), {
      code: 1, stderr: "", stdout: pullLine("qwen2.5:3b") + rows("location") +
        `location: ${reason}; answer: ${JSON.stringify(answer)}\nScore: 9/10\n`,
    });
    assert.deepEqual(requests.splice(0), expectedRequests("qwen2.5:3b"));
    assert.deepEqual(await calls(), Array.from({ length: index + 1 }, () => stopped).flat());
  }

  generation = 0;
  wrongAnswer = undefined;
  assert.deepEqual(await run(["--keep"], { ...env, LLMS_EVAL_MODEL: "qwen2.5:1.5b" }), {
    code: 0, stderr: "", stdout: pullLine("qwen2.5:1.5b") + rows() + "Score: 10/10\n",
  });
  assert.deepEqual(requests, expectedRequests("qwen2.5:1.5b"));
  assert.deepEqual(await calls(), [...stopped, ...stopped, ...start]);
});
