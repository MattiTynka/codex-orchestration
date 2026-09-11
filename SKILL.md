---
name: codex-production-pipeline
description: Use when Codex CLI or the local Codex desktop workspace is asked to implement, fix, refactor, or review production software with explicit quality, security, and model-cost requirements.
---

# Codex production pipeline

Optimize total cost to a verified change ready for external PR review, with unchanged product and security requirements. This workflow ends at the PR handoff: do not merge, enable auto-merge, deploy, or apply hosted migrations. Local acceptance is not release authorization.

Inside a dispatched worker, execute only the assigned role and report to the primary. Workers do not spawn descendants. Reading or maintaining this skill does not itself launch the pipeline.

## Start

Read [compatibility](references/compatibility.md) once per client setup. The default lead is **gpt-6-astra / high**. Verify runtime metadata and record requested and observed routes separately. A skill cannot switch its running parent. Missing required access or unobserved routing remains `INCOMPLETE`; do not silently substitute a model.

Inspect applicable instructions, source state, existing CI, and the request. Preserve user changes. A review-only request authorizes inspection, not edits, migrations, or PR creation; initialize evidence with `workMode: "review"`. Continue authorized local work before asking for genuinely new authority.

## Route

| Assignment | Default | Escalation |
|---|---|---|
| Orchestration and final evaluation | Astra high | Same route for consequential architecture, security design, and complex migration planning |
| Substantive production code | Astra medium | Astra high for security-critical logic, difficult concurrency, migrations, unresolved failures |
| Bounded, well-tested routine code | Sol medium | Astra medium or high according to risk |
| Basic coding and specified fixtures | Terra xhigh | Terra max for more demanding settled work; return unresolved semantic decisions |
| Long test supervision and bounded log triage | Luna max | Return substantive failures to the responsible builder |
| Routine, low-risk review | Fresh Sol medium | Fresh Astra medium |
| Substantive or cross-component review | Fresh Astra medium | Fresh Astra high for authentication, authorization, tenant isolation, cryptography, data integrity, and other sensitive changes |

Use exact model IDs, named roles, and dispatch arguments in [routing](references/routing.md). Classify each assignment separately and record its scope, owner, route, and checks before editing. Usually use one builder, then one reviewer; at most two simultaneous workers, including a test supervisor. Separate worktrees suit independent features; integrate them before final verification.

The Astra high lead must assess consequential design before implementation and obtain fresh independent Astra high review for sensitive changes. Record the design assessment and its participant. Start a new Astra high session if the current parent uses another model or effort; the skill cannot switch its running parent.

Run short deterministic commands directly. Use Luna for long-running test supervision, not a second duplicate test run. An editing lead must record the exact small adjacent edit and concrete handoff cost in advance; the route validator also limits which work that lead may author.

## Execute

1. **Frame.** Freeze acceptance criteria, risk, security invariants, meaningful required checks, permitted changes, and review requirements. Assess sensitive designs with Astra high using [security](references/security.md). Reject incompatible assumptions with `RETHINK`.
2. **Build and integrate.** Dispatch bounded assignments using [contracts](references/contracts.md). Use fresh context when selecting another model, and verify observed routing before reuse. Author needed migrations with the implementation, so they are included in the tested candidate. Integrate parallel branches, resolve conflicts, and prepare the task commit/index before freezing that candidate.
3. **Verify once stable.** Follow [testing](references/testing.md). Defer expensive suites until implementation, fixtures, migrations, and integration are complete. Retain useful quick targeted checks during development. Give a long run one Luna owner; the lead waits for meaningful events without repeatedly checking status. Record required commands, exit codes, logs, environment, and source/brief identity.
4. **Review independently.** Follow [review](references/review.md). Give the fresh, read-only reviewer original requirements and security constraints, the final diff, surrounding code, and verification evidence. Exclude the builder's conversation and correctness argument. A new session using the same model as the builder is valid; a new label or inherited-history fork is not.
5. **Repair.** Validate findings, then reuse the builder and original reviewer for bounded repairs. Escalate after one substantive failed repair; after two unsuccessful cycles reassess the design. Changed source invalidates recorded checks and reviews: rebind them through actual verification, never by rewriting hashes. Security-relevant repairs require a fresh final Astra high assessment.
6. **Evaluate and hand off.** Report `ACCEPT`, `FIX`, `RETHINK`, or `INCOMPLETE`, including actual routing and unfinished gates. [Evidence tools](references/evidence.md) check bookkeeping; the lead and independent reviewers assess semantic adequacy. After local acceptance, follow [PR handoff](references/handoff.md): create or update the PR for external review, include required migration files and verification evidence, and leave it unmerged. External CI may run on that PR; its result is separate from local acceptance.

Load only references needed for the current stage. Budget pressure never permits weaker checks, hidden findings, permission bypasses, or acceptance with unfinished required work.
