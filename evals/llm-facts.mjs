import { readFile } from "node:fs/promises";

const nonempty = (value) => typeof value === "string" && value.trim() !== "";
const alternatives = (fact) => Array.isArray(fact) ? fact : [fact];

export async function readQuestions() {
  const questions = JSON.parse(await readFile(new URL("./llm-questions.json", import.meta.url), "utf8"));
  if (!Array.isArray(questions) || questions.length !== 10 ||
      !questions.every((entry) => entry && nonempty(entry.id) && nonempty(entry.question) &&
        Array.isArray(entry.expected) && entry.expected.length > 0 &&
        entry.expected.every((fact) => alternatives(fact).length > 0 && alternatives(fact).every(nonempty))) ||
      new Set(questions.map(({ id }) => id)).size !== 10 ||
      new Set(questions.map(({ question }) => question)).size !== 10) {
    throw new Error("evals/llm-questions.json must contain 10 unique questions with nonempty expected facts");
  }
  return questions;
}

export async function readContext() {
  try {
    return await readFile(new URL("../dist/llms.txt", import.meta.url), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    throw new Error("dist/llms.txt is missing; run pnpm build first", { cause: error });
  }
}

const normalize = (value) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/gu, " ");
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function missingFacts(text, expected) {
  const normalized = normalize(text);
  const urls = new Set([...text.matchAll(/https:\/\/[^\s<>()\[\]\x60"'*]+/gu)]
    .map(([url]) => url.replace(/[.,!?;:]+$/u, "").replace(/\/$/u, "")));
  return expected.filter((fact) => !alternatives(fact).some((value) => {
    if (value.startsWith("https://")) return urls.has(value.replace(/\/$/u, ""));
    const literal = escape(normalize(value));
    return new RegExp("(?<![\\p{L}\\p{N}])" + literal + "(?![\\p{L}\\p{N}])", "u").test(normalized);
  }));
}
