# Production security and quality gates

Astra high owns consequential security design and independent sensitive review. Sol medium may coordinate the work and evaluate its evidence, but cannot replace a required Astra high assessment. Terra xhigh/max implements basic changes and specified fixtures; Luna max supervises long tests and triages bounded logs without authorship. None can declare unexamined attack surfaces safe. Model diversity and freshness do not establish correctness.

## Classify consequences

Routine work has limited reversible impact and no changed security boundary. Substantial work changes meaningful application behavior or spans interfaces. Sensitive work affects authentication, authorization, tenant isolation, secrets, payments, personal data, migrations, executable inputs, CI permissions, deployment configuration, or costly external operations. Small diffs can be sensitive. Unknown impact needs investigation.

Before sensitive implementation identify assets, actors, entrypoints, trust boundaries, attacker capabilities, and invariants. Trace relevant misuse paths through real callers and deployed configuration. Invariants require executable checks in the brief and independent reasoning assessment; manual review supplements tests.

## Required coverage, adapted to the repository

| Area | Evidence when applicable |
|---|---|
| Product behavior | Acceptance/failure cases, real integrations, essential browser journeys, accessibility and usability |
| Build integrity | Existing types, lint, production build, migration compatibility |
| Identity/access | Denial tests, ownership, tenant separation, expiry, privilege transitions, replay, revocation |
| Inputs/data | Injection, deserialization, traversal, SSRF/egress, uploads, privacy and log redaction |
| Workflow | Ordering, idempotency, retry, concurrency, transaction failure, rollback/recovery |
| Abuse/cost | Rate and usage limits, paid-call authorization, spend bounds, bounded retries, timeouts, resource exhaustion |
| Supply chain | Secret scan, dependency vulnerability scan, relevant static analysis, provenance and pinning |
| Runtime | Authenticated local/staging assessment, relevant configuration, safe synthetic adversarial probes |
| Operations | Useful non-sensitive errors/observability, rollout/rollback, performance and compatibility budgets |

Run the expensive security battery on the integrated final candidate under [testing](testing.md), including migration files before freezing that candidate. Deferral never removes a required security check. Use pinned, reviewed repository tools/configuration. Scanner success can still contain blocking findings. Inspect thresholds, exclusions, suppressions, baselines, and analyzed files. Never replace a required scanner with model-generated “scan results.”

For critical behavior, deliberately remove or invert protection in a disposable copy and confirm the targeted test fails. Scope mutation/adversarial checks to meaningful risks; do not mutate the release candidate or attack production systems without authority.

## Optional plugins

The [official Codex Security documentation](https://learn.chatgpt.com/docs/security) describes plugin, CLI, SDK, and cloud surfaces. Availability and permissions differ. This is an optional evidence source; the bundle does not install it.

Inspect plugin provenance/version, hooks/connectors, data destinations, permissions, scope, suppressions, budgets, and actual routing. Delegate one concrete unanswered question. Count plugin-created sessions/scans in task cost. Avoid overlapping security swarms.

Opaque plugin routing cannot replace Astra high independent review. A scan excluding abuse/rate limits cannot satisfy those requirements. An unavailable mandatory scan leaves `INCOMPLETE`; optional unused scans are recorded as not run, never claimed as coverage. Refusal/access restrictions do not authorize circumvention. Continue permitted work and state the gap.

## External enforcement

Require CI and merge/release rules outside the coding agent's authority, on the final revision or merge candidate. Preserve required checks, scanner configurations, test expectations, and security baselines. Policy changes receive independent review; agents cannot make failing gates optional. Untrusted pull-request jobs must not receive release credentials.

Local `ACCEPT` means the recorded candidate met its reviewed local contract. It requires the authorized [PR handoff](handoff.md) for external review, and never authorizes merging, auto-merge, deployment, or hosted migration execution. Keep necessary migration files in the reviewed and tested PR. Required external checks and external review remain separate gates. The bundle does not provision branch protection, credentials, or scanners, and cannot guarantee vulnerability-free software.
