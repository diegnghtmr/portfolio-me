---
project: resume-maker
summary: A LaTeX pipeline for a job seeker to publish English and Spanish résumés at stable URLs.
role: Sole developer
timeframe: "2026"
demo:
  url: https://diegnghtmr.github.io/resume-maker/
demonstration:
  kind: terminal
  terminal:
    caption: The local build compiles the main résumé and the work history with fictional content. The second command checks the links embedded in the main PDF. Build output is excerpted.
    source: run
    steps:
      - command: latexmk -outdir=build/cv -auxdir=build/cv cv/main-en.tex cv/work-en.tex
        output: |-
          Output written on build/cv/main-en.pdf (1 page, 65713 bytes).
          Latexmk: All targets (build/cv/main-en.pdf) are up-to-date
          Output written on build/cv/work-en.pdf (1 page, 59422 bytes).
          Latexmk: All targets (build/cv/work-en.pdf) are up-to-date
      - command: pdfinfo -url build/cv/main-en.pdf
        output: |-
          Page  Type          URL
             1  Annotation    https://diegnghtmr.github.io/resume-maker/cv/education-en.pdf
             1  Annotation    https://diegnghtmr.github.io/resume-maker/cv/work-en.pdf
             1  Annotation    https://diegnghtmr.github.io/resume-maker/cv/certifications-en.pdf
decisions:
  - question: How can a detail PDF change without breaking links from copies already sent?
    options:
      - label: Upload each export to Google Drive
        reason: Works without a deployment workflow, but a fresh upload creates a new file ID and requires changing the links in the main résumé.
      - label: Publish to fixed paths on GitHub Pages
        reason: A build can replace a PDF at the same path, and the main résumé gets each address from the shared link file.
        chosen: true
    consequence: Readers can follow the same links from an older main résumé to the latest detail PDFs. The GitHub account, repository name and filenames are part of each link.
    evidence:
      - label: Before and after the move from Drive
        url: https://github.com/diegnghtmr/resume-maker/blob/main/docs/system-design.md#6-the-stable-link-model-the-heart-of-the-fix
      - label: Published URL definitions
        url: https://github.com/diegnghtmr/resume-maker/blob/main/shared/links.tex
  - question: How much work history belongs in the main résumé?
    options:
      - label: Include the full work history in both PDFs
        reason: One section would be easier to update, but the main résumé would carry the same detail as the dedicated work document.
      - label: Use a short section and link to the full one
        reason: The main résumé can select entries for a quick read, while the separate document carries additional entries.
        chosen: true
    consequence: Readers can go from a short work section to the full history. A fact that appears in both forms may need to be updated in both source files.
    evidence:
      - label: Main résumé assembly
        url: https://github.com/diegnghtmr/resume-maker/blob/main/cv/main-en.tex
      - label: Detailed work history assembly
        url: https://github.com/diegnghtmr/resume-maker/blob/main/cv/work-en.tex
  - question: Should a résumé tailored to one job use the same publish path as the canonical set?
    options:
      - label: Publish from the whole build tree
        reason: Every built PDF would be available, including job-specific versions not intended for the public index.
      - label: Build application variants separately and publish from an explicit list
        reason: Application variants have their own output directories. The deployment lists its targets and packages only the canonical output directory.
        chosen: true
    consequence: A tailored résumé can keep the same local filename without overwriting the canonical build. Publishing it deliberately requires a distinct output name and a workflow change.
    evidence:
      - label: Local output routing
        url: https://github.com/diegnghtmr/resume-maker/blob/main/scripts/build.sh
      - label: CI targets and Pages artifact
        url: https://github.com/diegnghtmr/resume-maker/blob/main/.github/workflows/publish.yml
      - label: Application publishing rules
        url: https://github.com/diegnghtmr/resume-maker/blob/main/applications/README.md#publishing-optional-off-by-default--read-the-hazard
results:
  - label: Local TeX Live build
    detail: Both English targets compiled from the repository’s assembly files with fictional content. The main PDF contained three link annotations pointing to the published detail PDFs.
  - label: Published PDF endpoints
    detail: The Pages index returned HTTP 200 and listed eight PDFs. Every linked path returned HTTP 200 with application/pdf on a HEAD request.
    url: https://diegnghtmr.github.io/resume-maker/
limitations:
  - The Pages site is public. Keeping application PDFs out of the deployment does not hide their source files if they are committed to the public repository.
---

## Problem

A job seeker who shares a résumé in two languages has several documents to maintain. The main PDF should be short enough to scan, but a recruiter may want more detail on education, work history or certifications. Those extra PDFs can change after someone has received the main résumé. Their links need to work without sending everyone a replacement copy.

In the previous setup, a fresh upload of a detail PDF to Google Drive created a new file ID. The author then had to update its link in the main résumé and export that PDF again. Tailored applications posed a separate problem: a copy prepared for one opening should preserve what was sent without replacing the general résumé.

## How it works

The files in `cv/` assemble documents from language-specific LaTeX partials. Every target uses the same class in `shared/`, and the main PDFs pair short sections with links to the longer versions. The detailed documents pull in the full partials for a single section. A shared file defines the published URLs, so the main assemblies only need to reference the corresponding link macros.

For local builds, the shell wrapper runs `latexmk` in a TeX Live container, with pdfLaTeX selected in `latexmkrc`. The output directory mirrors each input’s directory: public targets go to `build/cv/`, and tailored applications go under `build/applications/`. The application convention is to inline the tailored text so later changes to the shared sections do not rewrite an archived application.

On `main` and version tags, GitHub Actions compiles an explicit list of eight targets. It stages those PDFs at `site/cv/`, adds the landing page and deploys the artifact to GitHub Pages. Filenames become part of the published URLs. A new build can replace what an existing link serves without changing the link itself.
