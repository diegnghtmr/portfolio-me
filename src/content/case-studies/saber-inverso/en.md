---
project: saber-inverso
summary: >-
  Saber Inverso helps Universidad del Quindío applicants estimate Saber 11 subject scores from a program’s weighted admission score.
role: Sole developer
timeframe: "2026"
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/estimator-input.png
      alt: Saber Inverso form showing Medicine selected, Quindío as the reference population and an entered weighted target of 72.50.
      caption: A fictional Medicine applicant enters a weighted target of 72.50 and uses Quindío as the reference population.
    - src: ./shots/weighted-result.png
      alt: Medicine result with an estimated global score of 362 out of 500, a recalculated weighted score of 72.30 and a chart of the program’s subject weights.
      caption: The same set of subject scores produces 362 on the national exam scale and 72.30 under the Medicine program’s weights.
    - src: ./shots/area-uncertainty.png
      alt: Five colored range bars with central scores, including 68–76 for Natural Sciences and 65–79 for English, with the range explanation expanded.
      caption: The English estimate has a wider range than Natural Sciences, even though both are centered at 72.
    - src: ./shots/ranked-alternatives.png
      alt: Five ranked combinations near the target, with the first three expanded to show their five subject scores.
      caption: Different subject scores can bring the weighted total close to 72.50. The percentages are likelihoods relative to the top estimate, not chances of admission.

decisions:
  - question: How should the estimator distinguish among score combinations that fit the same target?
    options:
      - label: List combinations that match the target by weight alone
        reason: Checks the admission formula without a population model, but does not distinguish a common combination from an unusual one.
      - label: Condition a joint score model on the weighted target
        reason: A multivariate normal model uses historical correlations between subjects and gives both a central estimate and a measure of spread.
        chosen: true
    consequence: The app ranks plausible combinations and shows uncertainty by subject instead of implying it has recovered the applicant’s actual scores.
    evidence:
      - label: Conditional solver and candidate ranking
        url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/app/domain/solver.py
      - label: API response and uncertainty fields
        url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/tests/test_api.py
  - question: When should the application prepare population statistics and program weights?
    options:
      - label: Compute them in the live API
        reason: The API could read the source data directly, but would depend on exam data downloads and spreadsheet parsing to serve estimates.
      - label: Ship precomputed statistics and weights
        reason: A separate batch job produces JSON artifacts, which the API loads into memory at startup.
        chosen: true
    consequence: Serving an estimate requires neither a live ICFES connection nor the source spreadsheet. Updating the data requires regenerating the artifacts.
    evidence:
      - label: Statistics and weights batch job
        url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/etl/etl.py?plain=1
      - label: API artifact loader
        url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/app/domain/repositories.py
results:
  - label: Solver unit tests
    detail: All 12 passed locally, covering the weighted constraint, uncertainty, integer candidate ranking, and determinism.
    url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/tests/test_solver.py?plain=1
  - label: HTTP integration tests
    detail: All six passed locally with the bundled data, including the Medicine round trip and validation of unknown programs and out-of-range targets.
    url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/tests/test_api.py
  - label: Browser walkthrough
    detail: The local Medicine example displayed 362 out of 500, a recalculated weighted score of 72.30, five subject ranges and five alternatives.
limitations:
  - The model approximates the joint score distribution. Rounding estimates to whole subject scores can move the recalculated weighted score off the target.
  - The bundled statistics cover six exam periods from 2014 to 2022.
  - Programs absent from the weights table and applicants exempt from the English test are outside the estimator’s scope.
architecture:
  system: Saber Inverso
  caption: Only the batch job reads ICFES exam data and the program weights spreadsheet; live estimates use the resulting files.
  nodes:
    - id: web
      kind: container
      label: Web app
      name: saber-inverso
      repo: saber-inverso
      tech: Astro / Preact / nginx
      does: Shows estimates and subject score ranges
      col: 0
      row: 0
    - id: api
      kind: container
      label: API service
      name: saber-inverso
      repo: saber-inverso
      tech: FastAPI / NumPy
      does: Estimates scores from a weighted target
      col: 1
      row: 0
    - id: etl
      kind: container
      label: Batch job
      name: saber-inverso
      repo: saber-inverso
      tech: Python / pandas / openpyxl
      does: Precomputes statistics and program weights
      col: 1
      row: 2
    - id: model-files
      kind: store
      label: Data files
      name: JSON
      does: Keep population statistics and weights
      col: 2
      row: 0
    - id: open-data
      kind: external
      label: Open data portal
      name: Datos.gov.co
      tech: Socrata
      does: Serves public ICFES exam records
      col: 3
      row: 2
  edges:
    - from: web
      to: api
      protocol: HTTP/JSON
      verb: Requests score estimates
      evidence: https://github.com/diegnghtmr/saber-inverso/blob/main/web/nginx.conf
    - from: api
      to: model-files
      protocol: JSON
      verb: Loads model at startup
      evidence: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/app/domain/repositories.py
    - from: etl
      to: model-files
      protocol: JSON
      verb: Writes model files
      evidence: https://github.com/diegnghtmr/saber-inverso/blob/main/services/etl/etl.py
    - from: etl
      to: open-data
      protocol: HTTPS/JSON
      verb: Fetches exam records
      evidence: https://github.com/diegnghtmr/saber-inverso/blob/main/services/etl/etl.py
---

## Problem

An applicant to Universidad del Quindío may know the weighted admission score they want to explore but not what it means for their Saber 11 exam. The university’s simulator turns five subject scores into one weighted total, and the weights depend on the program. That total is not the ICFES global score, which uses a different scale and formula.

Going in the other direction does not recover a unique result. Several sets of subject scores can produce the same total, so showing only one would hide how much the scores could vary. Saber Inverso ranks plausible combinations and shows a range for each subject. It is for exploring a target, not checking an official admission cutoff or recovering an individual exam result.

## How it works

The Astro page loads a Preact estimator. In the Docker setup, nginx serves the static page and proxies `/api` to FastAPI, so the browser sends requests to the same origin. The form loads the programs and reference populations, then submits the program, weighted target and selected population.

A separate batch job processes open ICFES exam data into national and Quindío statistics and reads the university’s program weights from its spreadsheet. FastAPI loads the two JSON files at startup. It does not download exam records when someone requests an estimate.

The solver uses NumPy to condition a multivariate normal model on the program’s weighted total. It samples score combinations, rounds them to integers, clamps them to 0–100 and ranks candidates near the target by Mahalanobis distance from the conditional mean. It returns the top combination, alternatives and the conditional standard deviation for each subject. The page uses that spread to draw ranges and shows the recalculated weighted score separately from the estimated ICFES global score.
