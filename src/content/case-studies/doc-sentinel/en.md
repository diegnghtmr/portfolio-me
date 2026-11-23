---
project: doc-sentinel
summary: A local CLI for screening documents for prompt injection and cleaning tool traces before sharing files with an AI assistant.
role: Sole developer
timeframe: "2026"
demonstration:
  kind: terminal
  terminal:
    caption: A scan flags an invisible character in fictional field notes, cleaning writes a separate copy, and a second scan finds nothing in the copy. Output is excerpted.
    source: run
    steps:
      - command: .venv/bin/doc-sentinel detect portfolio-fixture/field-notes.txt --fail-on medium
        output: |-
          doc-sentinel detect: verdict=findings
          findings: medium=1
      - command: .venv/bin/doc-sentinel clean portfolio-fixture/field-notes.txt --output-dir portfolio-fixture/cleaned --report portfolio-fixture/clean-final.json
        output: |-
          doc-sentinel clean: verdict=cleaned
          findings: none
      - command: .venv/bin/doc-sentinel detect portfolio-fixture/cleaned/field-notes.cleaned.txt --fail-on medium
        output: |-
          doc-sentinel detect: verdict=clean
          findings: none
decisions:
  - question: What may the cleaner change?
    options:
      - label: Rewrite the visible text
        reason: Rewriting can target patterns in word choice, but it changes the author's phrasing.
      - label: Limit changes to deterministic traces
        reason: Inspect known character and metadata traces without rewriting the prose.
        chosen: true
    consequence: The cleaner re-inspects a separate copy and leaves the original intact. Statistical text and pixel watermarks are outside its scope.
    evidence:
      - label: Design principles
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/PLAN.md#1-objetivo-y-principios
      - label: Cleaning adapter
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/adapters/watermarks_remover.py
  - question: Who decides the detection verdict?
    options:
      - label: Ask the assistant to interpret each tool's output
        reason: An assistant can reason about context, but it would see untrusted excerpts and its judgment could vary between runs.
      - label: Apply fixed rules to normalized findings
        reason: The same findings and tool statuses yield the same verdict at a given threshold.
        chosen: true
    consequence: A missing required check cannot yield a clean verdict. The assistant can read the verdict and counts without seeing document excerpts.
    evidence:
      - label: Aggregation and severity rules
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/aggregate.py
      - label: Agent summary
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/agent_summary.py
  - question: How should upstream tool changes reach the harness?
    options:
      - label: Pin release tags
        reason: Releases provide named checkpoints, but several tools had fixes or changes beyond their most recent tag.
      - label: Pin exact commits and test each update
        reason: A commit fixes the revision, and the corpus checks the candidate before the lockfile changes.
        chosen: true
    consequence: An update can roll back a failed pin without undoing one that already passed. The scheduled workflow reports upstream changes without moving the pins.
    evidence:
      - label: Pinning policy
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/PLAN.md#51-qué-se-pina
      - label: Update and rollback
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/update.py
      - label: Scheduled dry run
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/.github/workflows/update-dry-run.yml
results:
  - label: Plain-text round trip
    detail: The original returned one medium-severity finding (exit 1 at the medium threshold). The copy returned no findings (exit 0), and the original SHA-256 was unchanged.
  - label: Revisions on disk
    detail: The version command confirmed that all seven checked-out submodules matched their locked commits.
limitations:
  - The built-in instruction rules cover English and Spanish. They can miss paraphrases, and visible discussion can be flagged.
  - XLSX, PPTX, EPUB and ODT scans check extracted text only, not hidden content in the file structure.
  - Sanitizing a PDF rebuilds it as a DOCX. Layout may differ, and scanned pages stay as images without an OCR text layer.
architecture:
  system: doc-sentinel
  caption: Detection runs without network access by default; only the update command fetches new tool revisions.
  nodes:
    - id: cli
      kind: container
      label: CLI
      name: doc-sentinel
      repo: doc-sentinel
      tech: Python
      does: Scans documents and verifies cleaned copies
      col: 0
      row: 1
    - id: input
      kind: store
      label: Input files
      name: Originals
      does: Hold the documents to inspect
      col: 1
      row: 0
    - id: output
      kind: store
      label: Output files
      name: Cleaned copies and reports
      does: Hold results separately from the originals
      col: 1
      row: 1
    - id: tools
      kind: external
      label: Local dependency
      name: Pinned document tools
      tech: Git submodules
      does: Check documents and remove known traces
      col: 2
      row: 2
    - id: upstream
      kind: external
      label: Code hosting
      name: GitHub
      does: Hosts the upstream tool repositories
      col: 2
      row: 3
  edges:
    - from: cli
      to: input
      protocol: Files
      verb: Reads originals
      evidence: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/extract.py#L201-L205
    - from: cli
      to: output
      protocol: Files
      verb: Writes copies and reports
      evidence: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/cli.py#L310-L315
    - from: cli
      to: tools
      protocol: Subprocess
      verb: Runs pinned tools
      evidence: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/adapters/perlecta.py#L120-L123
    - from: cli
      to: upstream
      protocol: Git over HTTPS
      verb: Fetches updates on demand
      evidence: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/update.py#L137-L144
---

## Problem

A document that looks ordinary on screen can expose other text to a model. A PDF can have a text layer that does not match the rendered page. A DOCX can carry comments or tracked changes that the person handing it over never sees. Someone deciding whether to share a file with an assistant needs to know what the assistant might read, not just what appears on the page.

Cleaning a document is a different job. The person preparing the file may want to remove tool-generated metadata or normalize invisible characters without changing the wording or replacing the original.

## How it works

The CLI selects adapters by file type. Document-level scanners look for hidden text and differences between a rendered page and its text layer. The harness extracts separate channels for filenames, metadata, comments, links and alternative text. The channel checks also receive text revealed by document-level scanners.

The detectors return findings in a shared format. The aggregator merges equivalent findings and uses the requested severity threshold to set the exit code. During detection, child tools run offline by default; if isolation cannot be established, those steps fail rather than run online. The full report can include excerpts, but the agent summary returns counts and a verdict without quoting document text.

`clean` is a separate operation. It inspects the input, cleans a copy and checks the result again before writing it. The external tools are Git submodules pinned in one lockfile. The update command handles one tool at a time and runs the test corpus before accepting a new pin.
