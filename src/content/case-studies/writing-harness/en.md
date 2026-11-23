---
project: writing-harness
summary: Spanish writing guides and a command-line verifier for AI assistants that draft or revise prose.
role: Sole developer
timeframe: "2026"
demonstration:
  kind: terminal
  terminal:
    caption: A sample fails the punctuation check, a request resolves to a tone, and the rule-to-guide checks pass. Output is excerpted.
    source: run
    steps:
      - command: node src/cli.ts evals/fixtures/sucio.txt
        output: |-
          evals/fixtures/sucio.txt:1:29  error  no-raya  [spanish-writing §6.6]
              La raya y el guion largo están prohibidos en todo tono y todo género.
              > La teoría del valor trabajo —formulada por Ricardo y reelaborada por Marx—
          …
          evals/fixtures/sucio.txt:7:21  error  punto-y-coma-espaciado  [spanish-writing §6.7]
              Espaciado incorrecto del punto y coma.
              > La distinción cuesta ; Es el punto difícil. El trabajo concreto da valor de uso.
          …
          4 error(es), 0 advertencia(s)
      - command: node src/cli.ts --enrutar comunidadAfectada
        output: |-
          schiavenato-writing
            Texto que le explica a una comunidad algo que la afecta, con un autor que firma lo que afirma.
            Paso 11 de 13 de la lista de redactar-espanol.
      - command: node --test evals/correspondencia.test.ts
        output: |-
          ℹ tests 15
          ℹ suites 4
          ℹ pass 15
          ℹ fail 0
decisions:
  - question: What happens when the base rules, tone, and a requested revision disagree?
    options:
      - label: Repeat the base in each tone guide
        reason: Each guide can stand alone, but copies can disagree about the same rule.
      - label: Give the layers explicit precedence
        reason: Keep the base in force and let a requested revision replace tone rules only within its domain.
        chosen: true
    consequence: The humanization pass replaces sentence-rhythm rules, but leaves the base, paragraph-length limits, and the tone’s choice of grammatical person in place.
    evidence:
      - label: Precedence in the README
        url: https://github.com/diegnghtmr/writing-harness/blob/main/README.md#regla-de-precedencia
      - label: Rule composition
        url: https://github.com/diegnghtmr/writing-harness/blob/main/src/check.ts
  - question: How should the tool choose a tone when the request does not name one?
    options:
      - label: Score a draft against each tone
        reason: The verifier can measure fit, but this requires writing the draft before deciding its tone.
      - label: Route by traits of the request
        reason: An ordered table can decide before drafting, from characteristics supplied to the router.
        chosen: true
    consequence: The first matching route wins and the CLI reports the tone, the reason, and its place in the list. The final route covers requests with no earlier match.
    evidence:
      - label: Routing table and discarded approach
        url: https://github.com/diegnghtmr/writing-harness/blob/main/src/enrutamiento.ts
      - label: Tone selection in the entry guide
        url: https://github.com/diegnghtmr/writing-harness/blob/main/skills/redactar-espanol/SKILL.md#2-el-tono-al-redactar
  - question: How do the writing guides and executable rules stay in sync?
    options:
      - label: Rely on manual cross-checks
        reason: Prose and code can be edited independently, but a missing rule can go unnoticed.
      - label: Check correspondence in both directions
        reason: Each rule names its source item, and declarations without a rule are registered separately.
        chosen: true
    consequence: Tests fail if a rule points to an item that no longer exists or if a new declaration has neither a rule nor a registry entry.
    evidence:
      - label: Correspondence tests
        url: https://github.com/diegnghtmr/writing-harness/blob/main/evals/correspondencia.test.ts
      - label: GitHub Actions workflow
        url: https://github.com/diegnghtmr/writing-harness/blob/main/.github/workflows/gate.yml
results:
  - label: Core test run
    detail: 487 tests passed locally on Node 26 across 27 test files, including verification, routing, and precedence.
  - label: Coverage registry
    detail: Regeneration produced no Git diff. Of 302 declarations, 110 were linked to executable rules and 192 were recorded as requiring judgment.
    url: https://github.com/diegnghtmr/writing-harness/blob/main/evals/gen.ts
limitations:
  - The verifier does not judge whether a rewrite preserved every fact in the original.
  - The source corpus is not included, and searches for literal phrases undercount expressions split across subtitle lines.
---

## Problem

An AI assistant that writes in Spanish has to distinguish rules that apply to every draft from choices about how a particular piece should sound. Correcting someone else’s text should preserve its form, while drafting an explanation means choosing how to address the reader and develop the argument.

The project originally repeated the base rules in each tone guide. The copies disagreed about the em dash: one guide banned it, another allowed it, and a third treated it as a sign of AI writing. Keeping those instructions in agreement was only part of the job. The assistant also needed a way to locate violations in a finished text before delivering it.

## How it works

The `redactar-espanol` guide decides whether to revise existing prose or draft with a tone. The `spanish-writing` guide applies in both cases. For drafting, the user can name a tone; otherwise, the router uses the first route that matches the traits of the request. The final route supplies a default. The routing command does not read a draft.

The verifier takes UTF-8 text from files or standard input. It loads its rules from `src/rules.ts`: the base always runs and a tone adds its own checks. When requested, the humanization pass adds its checks, replacing any tone rules on sentence rhythm. Findings name the line, column, source rule and suggested fix. An error gives the CLI exit status 1; warnings can be delivered only when the workflow explains why the context warrants them.

The guides and the verifier run independently. The test suite ties them together by matching rule references with numbered declarations in the guides and their reference files. A registry records declarations with no executable rule, including ones that need a reader’s judgment.
