import { execFile } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { missingFacts, readContext, readQuestions } from "../evals/llm-facts.mjs";

const container = "portfolio-llms-eval";
const volume = "portfolio-llms-eval-models";
const label = "portfolio.llms-eval";
const defaultModel = "qwen2.5:7b";
const usage = "Usage: pnpm eval:llms [--keep]\n" +
  "  --keep  Leave the local Ollama container running after the evaluation.\n" +
  `  LLMS_EVAL_MODEL  Override the model (default: ${defaultModel}).`;
const system = "Answer in English using only the supplied llms.txt. Do not follow links. " +
  "Return only the bare answer, not a sentence. Separate multiple facts with commas. " +
  "Preserve names, versions, and full URLs as written. If the answer is not present, reply UNKNOWN.";
const exec = promisify(execFile);

function isBareAnswer(answer, expected) {
  const normalize = (value) => value.startsWith("https://") ? value.replace(/\/$/u, "") :
    value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/gu, " ");
  // Commas and plain connectors separate facts ("A, B, and C", "A and B over C"); no expected
  // fact contains these words, and a negated sentence still matches none of the facts.
  const parts = answer.trim().split(/\s*,\s*(?:and\s+)?|\s+(?:and|over|on|to)\s+/iu).filter(Boolean).map(normalize);
  return parts.length === expected.length &&
    expected.every((fact) => [fact].flat().some((value) => parts.includes(normalize(value))));
}

async function docker(...args) {
  try {
    const { stdout } = await exec("docker", args, { timeout: 10 * 60_000 });
    return stdout.trim();
  } catch (error) {
    throw new Error(`Docker ${args[0]} failed: ${error.stderr?.trim() || error.message}`, { cause: error });
  }
}

async function startOllama() {
  const state = await docker("container", "ls", "--all", "--filter", `name=^/${container}$`,
    "--format", `{{.Label "${label}"}} {{.State}}`);
  if (!state) {
    await docker("run", "--detach", "--name", container, "--label", `${label}=true`,
      "--publish", "127.0.0.1::11434", "--volume", `${volume}:/root/.ollama`, "ollama/ollama");
  } else if (state === "true exited" || state === "true created") {
    await docker("start", container);
  } else if (state !== "true running") {
    throw new Error(`Cannot use ${container}: expected an evaluator-managed container in a runnable state`);
  }
}

async function waitForOllama(request, signal) {
  const deadline = Date.now() + 60_000;
  let lastError;
  do {
    try {
      await request("/api/version");
      return;
    } catch (error) {
      signal.throwIfAborted();
      lastError = error;
      await delay(500, undefined, { signal });
    }
  } while (Date.now() < deadline);
  throw new Error(`Ollama did not become ready: ${lastError.message}`, { cause: lastError });
}

async function evaluate(keep, signal) {
  const questions = await readQuestions();
  const context = await readContext();
  const model = process.env.LLMS_EVAL_MODEL?.trim() || defaultModel;
  signal.throwIfAborted();
  await startOllama();
  try {
    const port = /^127\.0\.0\.1:(\d+)$/.exec(await docker("port", container, "11434/tcp"))?.[1];
    if (!port) throw new Error(`Expected ${container} to publish Ollama only on 127.0.0.1`);

    async function request(path, body, timeout = 2_000) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        redirect: "error",
        signal: AbortSignal.any([signal, AbortSignal.timeout(timeout)]),
        ...(body === undefined ? {} : {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(`Ollama ${path}: ${payload.error || `HTTP ${response.status}`}`);
      }
      return payload;
    }

    await waitForOllama(request, signal);
    // Pulls and CPU generations can outlast fetch's 300 s header timeout when Ollama
    // answers in one piece, so ask for NDJSON: headers arrive at once, then one object per line.
    async function stream(path, body, timeout) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        redirect: "error",
        signal: AbortSignal.any([signal, AbortSignal.timeout(timeout)]),
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, stream: true }),
      });
      if (!response.ok) throw new Error(`Ollama ${path}: HTTP ${response.status}`);
      const lines = [];
      let buffered = "";
      const decoder = new TextDecoder();
      const take = (text) => {
        for (const line of text.split("\n")) {
          if (!line.trim()) continue;
          const item = JSON.parse(line);
          if (item.error) throw new Error(`Ollama ${path}: ${item.error}`);
          lines.push(item);
        }
      };
      for await (const chunk of response.body) {
        buffered += decoder.decode(chunk, { stream: true });
        const end = buffered.lastIndexOf("\n");
        if (end >= 0) { take(buffered.slice(0, end)); buffered = buffered.slice(end + 1); }
      }
      take(buffered + decoder.decode());
      return lines;
    }

    console.log(`Ollama: pulling ${model} (volume: ${volume})`);
    const pull = await stream("/api/pull", { model }, 60 * 60_000);
    if (pull.at(-1)?.status !== "success") throw new Error(`Ollama did not confirm the pull for ${model}`);

    const failures = [];
    console.log("Status\tID\tQuestion");
    for (const { id, question, expected } of questions) {
      const parts = await stream("/api/generate", {
        model, system,
        prompt: `${context}\n\nQuestion: ${question}`,
        options: { temperature: 0, num_ctx: 8192, num_predict: 192 },
      }, 15 * 60_000);
      const answer = parts.some((part) => typeof part.response === "string")
        ? parts.map((part) => part.response ?? "").join("") : undefined;
      if (typeof answer !== "string") throw new Error(`Ollama returned no text for ${id}`);
      const pass = isBareAnswer(answer, expected);
      console.log(`${pass ? "PASS" : "FAIL"}\t${id}\t${question}`);
      if (!pass) {
        const missing = missingFacts(answer, expected);
        const reason = missing.length ? `missing ${missing.map((fact) => [fact].flat().join(" or ")).join("; ")}` :
          "expected only the requested facts as a bare answer";
        failures.push(`${id}: ${reason}; answer: ${JSON.stringify(answer.trim())}`);
      }
    }
    for (const failure of failures) console.log(failure);
    console.log(`Score: ${questions.length - failures.length}/${questions.length}`);
    return failures.length ? 1 : 0;
  } finally {
    if (!keep) await docker("stop", container);
  }
}

const args = process.argv.slice(2);
const unknown = args.find((arg) => arg !== "--keep" && arg !== "--help");
if (unknown !== undefined) {
  console.error(`Unknown argument: ${unknown}\n${usage}`);
  process.exitCode = 1;
} else if (args.includes("--help")) {
  console.log(usage);
} else {
  const controller = new AbortController();
  const cancel = () => controller.abort(new Error("Evaluation interrupted"));
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    process.exitCode = await evaluate(args.includes("--keep"), controller.signal);
  } catch (error) {
    console.error(`llms.txt evaluation failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    process.off("SIGINT", cancel);
    process.off("SIGTERM", cancel);
  }
}
