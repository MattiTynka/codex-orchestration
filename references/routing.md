# Routing and economics

These are the user's requested routes, not a benchmark ranking. Terra defaults to `xhigh` for basic coding; use `max` for more demanding settled tasks. Luna remains `max` for test supervision. Record measured outcomes without promising cost or speed gains.

| Agent | Model | Effort | Assignment |
|---|---|---|---|
| cpp-astra-medium | gpt-6-astra | medium | Substantive production implementation |
| cpp-astra-high | gpt-6-astra | high | Critical logic, concurrency, migrations, unresolved failures; bounded design assessment |
| cpp-sol-medium | gpt-5.6-sol | medium | Bounded, well-tested routine implementation |
| cpp-terra-xhigh | gpt-5.6-terra | xhigh | Basic coding and specified fixtures |
| cpp-terra-max | gpt-5.6-terra | max | More demanding settled coding and test tasks |
| cpp-luna-max | gpt-5.6-luna | max | Long test supervision and bounded log triage; no authorship |
| cpp-correctness-routine | gpt-5.6-sol | medium | Fresh routine, low-risk correctness review |
| cpp-correctness | gpt-6-astra | medium | Fresh substantive or cross-component correctness review |
| cpp-security | gpt-6-astra | high | Fresh sensitive correctness/security assessment |

The primary defaults to Astra high (`lead`); `lead-high` also selects Astra high. Definitions do not create sessions or switch a running parent. The lead may request a bounded Astra high `design` assessment when useful. Record the design decision and its participant. Anyone who later authors the candidate is a builder and cannot supply independent review. One fresh Astra high reviewer may cover both correctness and security with two coverage records.

## Bound delegation

Record `assignment -> owned paths/worktree -> work class -> route -> acceptance checks` before dispatch. Classify each assignment: Astra high decides an authorization contract; Terra authors settled denial fixtures; Astra medium integrates ordinary behavior; Luna supervises final long tests. Do not relabel specified fixtures as sensitive design to keep all work on the lead.

Use `trivial`, `tests`, `routine`, `challenging`, or `sensitive` for authors. Non-author workers may also use `design` (Astra high) or `test-supervision` (Luna max). Record anyone who edits as an author; a supervisor cannot also be a builder. The editing-lead exception requires an exact adjacent edit and concrete handoff cost. The default `lead` retains its existing authoring restriction: it may author only trivial/tests/routine work; `lead-high` may author sensitive work. Do not use this exception for an entire feature or test suite.

Usually use one builder, then one reviewer. At most two simultaneous workers, including test supervision; a second needs independent work and a useful benefit. Leaf configurations disable descendants. Separate CLI processes and plugin sessions count toward the same task budget; the launcher's child cap is per lead session, not a global OS quota.

Use short deterministic tools directly. A worker needs a coherent output, not an agent per file or checklist item. Give long runs one owner with event-driven reporting under [testing](testing.md). An edit to authorization, migration semantics, or build permissions is sensitive irrespective of size. Terra may implement an Astra-approved negative-test contract; Astra owns sensitive design and security coverage.

## Worktrees and integration

In a Git repository, use one local worktree and branch per independent feature when multiple builders will write concurrently. Inspect status and existing worktrees, pin the common base, and record each worker's absolute root, branch, owned paths, and dependencies. Preserve user changes. Explicitly pass that root to the worker's tools or CLI `--repo`; a native subagent does not automatically get a worktree.

Serialize overlapping contracts, shared schema, lockfiles, or migration sequences. Separate directories prevent concurrent file overwrites but do not prevent semantic merge conflicts. One integration owner combines branches, resolves conflicts, finalizes migration files, and prepares the task commit before final source-bound checks. Give the fresh reviewer the combined diff and integrated candidate, not only isolated branch results.

Worktrees share resources outside their directories: use distinct test databases, ports, temporary paths, and external evidence directories when needed. Keep the final candidate stable through verification and review. Clean up only task-owned worktrees after integration and preservation of their changes; never force removal of dirty worktrees. Worktrees provide no sandbox or release authority.

For non-Git exports, preserve changes using before/after file hashes and serial ownership. Do not initialize Git merely to satisfy this workflow; full Git-bound evidence or a PR handoff remains unavailable until a real target repository is supplied.

## Escalate and stop deliberately

Use Astra medium for substantive coding and Sol medium for bounded, well-tested routine coding. Use Astra high immediately for critical security logic, difficult concurrency, migrations, or unresolved failures. After one substantive failed repair, escalate with evidence. After two unsuccessful repair cycles, reassess the design and budget; this never permits skipping unfinished gates.

Use `FIX` for concrete defects, `RETHINK` for incompatible architectural assumptions, and `INCOMPLETE` for missing coverage, blocked tools, unavailable required routes, or exhausted budget. Continue useful authorized work and name the unfinished gate. No finding quota or compulsory debate loop.

## Native dispatch

Inspect the actual tool schema. Prefer a discovered role with fresh context. If explicit model/effort overrides are available instead, supply both:

```json
{
  "task_name": "specified_tests",
  "model": "gpt-5.6-terra",
  "reasoning_effort": "xhigh",
  "fork_turns": "none",
  "message": "Implement the specified tests in the assigned paths. Read the production entrypoint and expected cases in the packet. Preserve other edits. No descendants. Return executed checks, source identity, and remaining gaps."
}
```

This is a tool argument example, not a shell command. Follow the client schema; do not combine a conflicting fixed role with overrides. Full-history forks inherit parent configuration on some surfaces and cannot change models. Custom-agent model/effort settings may override spawn defaults: inspect installed files and duplicates when observed routing differs. A prompt naming a model does not configure it.

Follow-up assignments keep the existing worker's route. Verify it before reuse; a route escalation needs a new correctly configured worker. Native review must exclude inherited builder history and use effective read-only permissions. Use the fresh CLI path when native selection or isolation is unavailable; never bypass access restrictions.

## Fresh CLI paths

From the skill directory, inspect the invocation before launching:

```text
node scripts/codex-launch.mjs worker --repo /absolute/repo --prompt /absolute/task.txt --output /absolute/new-artifact-directory --route terra-xhigh --sandbox workspace-write --dry-run
```

Remove `--dry-run` to execute. Worker routes are `terra-xhigh`, `terra-max`, `luna-max`, `astra-medium`, `astra-high`, and `sol-medium`. Omit `--sandbox` for read-only work. Use an unused output directory outside the target and an actual native executable via `--codex` on Windows if PATH resolves to a shim. All noninteractive children use both model and effort, `approval_policy=never`, and disabled descendant agents. Fresh `codex exec` does not resume parent history.

`lead` defaults to Astra high; `lead --route lead-high` also starts a new Astra high lead. `review --kind correctness` defaults to Astra medium; add `--route correctness-routine` for a routine Sol medium review or `--route security` to escalate to Astra high. `review --kind security` always requires the `security` route. Reviews reject writable sandbox overrides. The frozen brief's risk restricts review routes during evidence assessment; the launcher alone cannot determine task risk.

The old `astra-low` and `sol-high` routes are retired. Update packets and locally installed role files deliberately; do not relabel historical executions. This export does not install or remove roles in other repositories.

## Observe after inference

Capture the native child ID or CLI `thread.started.thread_id`, locate that rollout under the configured Codex home `sessions/`, and inspect only that file. Runtime `turn_context` identifies model/effort; subsequent positive `token_count` records establish observed inference. A catalog entry, dry-run, self-description, or zero launcher exit is insufficient.

```text
node scripts/observe-routing.mjs --rollout /absolute/rollout.jsonl --session CHILD_ID --route terra-xhigh --parent PARENT_ID
```

Omit `--parent` for an independent CLI process. The observer requires exact identity, matching model/effort in every context, and positive usage after context. Use fresh single-route workers, not old mixed-model parents. Retry partially flushed evidence after completion. Unknown fields remain null; never infer observation from requested settings. Launcher completion intentionally leaves observation null.

Record every participant's session ID, assignment, requested/observed route, evidence source, and fallback/error. An allowed alternative may be recorded explicitly, such as Terra max instead of Terra xhigh. Required Astra high design/security has no weaker substitute. Local records are inspectable evidence, not authenticated provider or billing attestations.

## Measure accepted outcomes

Record input/cached-input/output tokens, reasoning tokens only when separately exposed, wall time, sessions, repairs, measured billed cost or null with a reason, human review time, coverage, and escaped defects. Do not double-count reasoning already included in output. Subscription quotas and API dollars differ.

Compare the same tasks and gates, including repair, integration, final review, test supervision, and human effort. Reuse builder/reviewer context for repairs; fresh initial review protects independence without guaranteeing savings. Keep logs in artifacts and return concise pointers.
