# Local evidence recorder

`scripts/evidence.mjs` requires Node 22+ and Git, with no dependencies or model calls. It records deterministic commands and checks consistency across source, requirements, reviews, and routing. It is not a scanner, sandbox, authenticated attestation service, or merge gate.

## Freeze a task

Adapt `examples/brief.example.json` before use. Replace example commands with the repository's real reviewed checks, including existing required CI/scanners and applicable security tests. The lead classifies risk and coverage; Astra high assesses consequential architecture, security design, and migration/data-integrity requirements. Do not treat passing example npm scripts as a production security assessment.

The brief has `schemaVersion: 1`, task, workMode (`implementation`, the default, or `review`), risk (`routine`, `substantial`, `sensitive`), rationale, acceptance criteria, security invariants, required checks, additional snapshot paths, required review kinds, and environment identity. Each criterion/invariant has a unique ID and meaningful description. Each required check has an ID, literal argv array, purpose, timeoutSeconds (1–7200), and nonempty `covers` IDs. Every requirement must have an executable check; manual review may additionally assess it. A coverage mapping is an assertion to review, not proof that a command tests the requirement.

For inspection-only requests freeze `workMode: "review"` before initialization. The candidate must remain identical to the initial snapshot through assessment. This mode permits an empty task-author roster but preserves all required checks, routing, review independence, and security coverage. Carry forward known author session IDs from any preceding implementation; do not erase authors to make self-review appear independent. If edits become authorized, create an implementation-mode run and record its authors. The review brief example illustrates this distinction.

Every brief, including routine and inspection-only work, requires independent correctness review. Routine low-risk review may use Sol medium; substantive review requires Astra medium or high. Sensitive changes additionally require security invariants and Astra high security review. An empty correctness requirement is rejected at initialization. `additionalPaths` can include relevant ignored configuration/build inputs; do not include credentials. Record runtime version, dependency/lockfile identity, installation state, and external test services without secrets. Environment changes can invalidate results even when source is identical.

Use a **new directory outside the repository** for each task run:

```text
node scripts/evidence.mjs init --repo /absolute/repository --run /absolute/evidence/run-1 --brief /absolute/task-brief.json
node scripts/evidence.mjs run --run /absolute/evidence/run-1 --check tests
node scripts/evidence.mjs run --run /absolute/evidence/run-1 --check typecheck
node scripts/evidence.mjs run --run /absolute/evidence/run-1 --check build
node scripts/evidence.mjs snapshot --repo /absolute/repository --run /absolute/evidence/run-1
```

Use the actual check IDs in your brief; run every required check. The recorder uses argv directly with `shell:false`; a command needing shell syntax must be a reviewed script invoked explicitly. Tests still execute repository code and need an appropriate restricted runtime. Logs may contain sensitive output: prevent unnecessary capture and restrict artifact access.

## Source and execution identity

The snapshot covers Git HEAD, staged entries, tracked working files/deletions, nonignored untracked files, and explicit additionalPaths. It refuses symlinks, nonregular files, submodules, unmerged indexes, and sparse checkouts. Use an appropriately expanded external verifier when those are necessary; do not silently omit them. It does not identify every dependency, remote service, environment variable, or concurrent transient edit. Quiesce writers and use a stable candidate/environment.

Required checks record before/after source digests, frozen brief hash, argv, exit status, timestamps, and hashed stdout/stderr. Source mutation, timeout, output above 16 MiB, spawn/log failures, and stale or missing evidence prevent a passing result. An exclusive run lock prevents overlapping checks. Successful reruns replace the current pointer while preserving attempt artifacts; a failed persistence step cannot reuse an older pass.

Prepare the task commit/index and integrate branches before recording required checks: HEAD and the index are part of source identity. Run required checks after the candidate is stable. A source change invalidates prior records under this helper, even if a human considers it unrelated. Use useful quick targeted checks during development and defer expensive suites until the integrated candidate is ready, following [testing](testing.md). Give long runs a single Luna supervisor. Once stable, record the final required suite once; any subsequent source/HEAD/index change requires fresh records for all required checks. If a reviewed brief changes, initialize a new run and review against it. Never relax criteria to hide defects.

## Record participants and reports

Write `participants.json`, `reviews.json`, and `evaluation.json` into the run directory using the examples as shapes. The examples deliberately cannot pass. Keep routing evidence for every session, including workers that only inspect or run checks.

Each participant/review uses:

```json
{
  "route": "sol-medium",
  "requestedModel": "gpt-5.6-sol",
  "observedModel": "gpt-5.6-sol",
  "effort": "medium",
  "observedEffort": "medium",
  "observation": "Pointer to actual runtime/session metadata; this snippet is an example"
}
```

`builders` lists every author with session `id` and `workClass`: trivial, tests, routine, challenging, or sensitive. `workers` records non-authors; it additionally permits `test-supervision` with Luna max and `design` with Astra high. These two classes cannot be authors or share an ID with a builder. If a designer authors the candidate, record its authorship using the applicable coding class instead, and retain its design assessment as evidence.

An editing lead records `directImplementationRationale` and belongs in builders. The default `lead` retains its existing restriction to trivial/tests/routine authorship; `lead-high` may author other coding classes. Both evaluator routes use Astra high. The evaluator coordinates required design/security assessments; it cannot substitute its own review for independent review.

Correctness review uses `correctness` (Astra medium) or `security` (Astra high); `correctness-routine` (Sol medium) is permitted only when the frozen brief's risk is `routine`. Security review always uses `security`. Unknown risk or retired route names are rejected; requested and observed routing must still match exactly.

Observed fields stay null when unavailable. The local gate then returns incomplete routing; do not copy requested settings into observed fields. This requires the same exact model ID; if a provider returns a different snapshot identifier, verify and explicitly update the trusted route policy rather than accepting arbitrary aliases. A known fallback must be recorded and reassessed under an allowed route, not relabeled.

Reviews need `kind`, `reviewerId`, `initialContext: "fresh"`, routing, final `snapshotDigest` and `briefSha256`, `filesRead`, complete relevant `covers`, verdict, findings, and gaps. IDs identify real distinct sessions, not invented role names. Findings have id, severity, location, scenario, evidence, status (`open`, `resolved`, `dismissed`), and resolution evidence when closed. Put uncertainty in evidence or gaps. Reuse the initial fresh reviewer's ID for immediate repairs, but reinspect and reissue reports for the final source.

Evaluation needs the same hashes, verdict, rationale, findings/gaps, session/repair counts, measured cost or null with source/reason, and separate external release-gate status/evidence. Keep the [PR handoff](handoff.md) outcome and URL beside this assessment; an open PR is not evidence that external CI or review passed. More detailed usage can be recorded beside it. `pending`, `failed`, or `not-configured` external gates never authorize release, even if local evidence accepts.

The reported session count must cover every distinct session ID already recorded. The helper cannot discover omitted sessions or plugin activity; include those in the task ledger and final evaluation.

## Assess

```text
node scripts/evidence.mjs assess --run /absolute/evidence/run-1
```

Use `--expected-brief-sha256 HASH` when a protected external system provides the expected hash. `ACCEPT` exits 0; other outcomes exit 2. `RETHINK` takes priority over `FIX`, then `INCOMPLETE`; all issue arrays are retained, so a defect outcome never hides unfinished security work. Parse all issues and `releaseAuthorized`, which is always false. After local acceptance, publish the already-verified task commit as a PR for external review when authorized. The workflow must not merge, enable auto-merge, deploy, or apply hosted migrations; passing external CI does not remove this stopping point.

Hashes detect inconsistent records; an actor able to rewrite all local evidence can forge a consistent story. Authorship and routing observations are not authenticated. Protect artifacts and expected hashes externally when they matter. A human/strong evaluator must validate classification, command quality, actual review independence, and semantic coverage. No local JSON validator can prove those properties.
