# App development plan — with codex-production-pipeline

## Memory isolation — before the first action

**Do not read, search, retrieve, use, create, update, append, delete or otherwise modify persistent memories for this run.** This applies from session initialization through final handoff to the lead, every worker, test supervisor, reviewer, replacement, repair continuation and any invoked plugin. No skill or security-plugin exception grants memory access.

- Do not perform a preliminary memory lookup, including in the same tool batch that reads this plan. Do not inspect memory registries, summaries, saved notes, memory skills, prior rollout summaries or other runs' session history. Relevant memories are prohibited too.
- Do not save lessons, preferences, task summaries or memory-update notes, and do not request or schedule later memory extraction from this run. The prohibition includes memory tools, filesystem access, hooks and automatic background memory writers.
- Read this plan as the first task document and process its restrictions before any other task action. Pass this entire memory-isolation section in every participant's initial request, including standalone reviewer processes and replacement sessions. Preserve it during repairs and context compaction.
- Keep ordinary working context, the five permitted application/test files, current-run evidence and the final handoff. Runtime transcripts, usage logs and source hashes needed for this run's routing/accounting are allowed; they must not be used to retrieve prior knowledge or promoted into reusable memory. Do not disable usage logging.

**Operator setup, before launch:** use the same supported, run-scoped memory isolation in both modes. Disable memory retrieval, injected memory content and automatic memory creation/update for every participating process. Exclude higher-priority instructions that mandate memory access through the supported session configuration; this document cannot override them. A fresh directory or fresh context alone does not establish that memory is disabled. Do not delete existing memories or change global user preferences to prepare this run. Record the effective isolation settings outside the application directory, without reading memory contents.

Put the following instruction directly in the initial launch message, before the plan attachment or path, so it is available before the first tool call. Include it in every participant's launch request too:

> This benchmark prohibits all persistent memory reads and writes, including preliminary lookups, injected memories and automatic memory updates. Read and process the supplied plan before other task actions; do not batch its read with a memory lookup. Apply the same prohibition to all participating sessions. Preserve ordinary current-run transcripts and usage logging.

If memory content is injected, read or written, record the affected session, action and time as **memory contamination**; retain all consumed tokens. Do not conceal the event or claim a memory-isolated result. If conflicting higher-priority instructions or unavailable controls prevent isolation, identify that limitation instead of claiming the prohibition was enforced. Merely seeing a memory-tool name or a restriction mentioning memory is not a memory read.

## Session setup

This is a self-contained plan for one fresh coding session. Do not read another plan, another run's directory, previous solutions or the conversation that produced this plan.

Use the empty application directory: `C:\Users\maxim\Downloads\codex-production-pipeline_updated_2026-09-10\app-with-codex-production-pipeline-skill`. Read this plan from its supplied location outside the application directory. Create the five application and test files below during the measured run. No prepared starter or separate contract file is required; this plan supplies the fixed requirements. Keep private acceptance tests, references, usage artifacts and other runs outside the application directory.

Read and follow **codex-production-pipeline**, with the security-plugin exception below, for application development in the lead and every participating worker, supervisor and reviewer session. Apart from that exception, do not read or invoke other skills. Other skills appearing in the catalog do not block this run. Mandatory security instructions still apply.

The **security plugin (`secure-engineering:secure-engineering`) is allowed** when a participating model determines it is required for the task's security work, or when the active mode, mandatory instructions or codex-production-pipeline requires it. This is advance authorization for applicable security work; no additional user confirmation is needed. Record who required it, the reason or triggering instruction, the skill identity/version or content hash, participating session IDs and work performed. Apply its relevant instructions within this plan's fixed application scope and time limit. This exception does not authorize unrelated development skills. Pass the exception and its reporting requirements to every child session. Authorized security-plugin use is compliant and must not be reported as contamination; distinguish a run using only the development workflow from one also using the security exception.

Use the enabled skill's normal lead model/effort, with the initial setting fixed by the operator before the run. Record actual model/effort for the lead and every worker. Follow its applicable local quality and review gates. This task ends at local handoff: no commit, push, PR, deployment or hosted changes.

Exercise all these stages within the same run:

Use codex-production-pipeline's prescribed model routing, supervision, escalation and review requirements for these stages.

1. Lead frames the requirements, assigns ownership and coordinates integration.
2. Assign the challenging runner and its tests to an appropriate coding worker using the enabled skill's routing.
3. Assign the easy reporting/CLI and its tests separately using the enabled skill's routing.
4. Integrate both assignments against the fixed interfaces and freeze the candidate for final checks.
5. Assign the final real test run to the skill's test supervisor. Supervision is explicitly requested even if tests finish quickly; do not pad duration, repeatedly poll unchanged logs or duplicate the suite.
6. Obtain fresh independent code review of the integrated candidate. The reviewer must not be a candidate author or inherit builder conversation.
7. Repair concrete findings if time permits, reverify changed code and complete the final evaluation.

Record evidence for each stage: assignment, owner/session ID, observed model/effort, changed paths, test command/exit status and reviewer verdict tied to the final candidate. Missing a required stage means the workflow is incomplete even if the application passes. The operator's later acceptance grading does not substitute for this review.

Give the challenging worker ownership of `src/run-jobs.mjs` and `test/run-jobs.test.mjs`; give the easy worker ownership of `src/report.mjs`, `src/cli.mjs` and `test/report.test.mjs`. Workers must preserve one another's files and use the fixed interfaces below. Follow the enabled skill's concurrency and escalation limits.

Keep common tools, permissions, runtime and mandatory security instructions as configured by the operator. Enforce the memory-isolation section above for all participants and exclude inherited history; do not modify global user settings or weaken security controls.

## Time and scope

Allow approximately **20 minutes for coding and testing combined**, with a hard 20-minute deadline from the start of this development run, including planning, coordination, review, repairs and final handoff. Stop unfinished work at the deadline and report it honestly. Do not skip required checks to claim completion.

Build only the tiny application below: three source files and two test files. Do not build benchmark infrastructure, a dashboard, a server, a database, a dependency framework or a custom execution environment. Creating these files is part of the measured development window. Operator acceptance grading is outside it.

## Application requirements

Build a small **job runner and report application** in JavaScript using Node.js 22+ and its built-in test runner. It has one challenging asynchronous module, one easy reporting module and a small CLI. No external dependencies, network, database or UI are needed. The runner executes supplied callback functions in tests; it never evaluates code strings or starts external commands.

### Files to create and permitted changes

```text
src/run-jobs.mjs       Exported async runJobs(jobs, options) function
src/report.mjs         Exported summarizeJobs(jobs) function
src/cli.mjs            CLI entrypoint for summarizing completed jobs
test/run-jobs.test.mjs Runner and integration tests
test/report.test.mjs   Reporting and CLI tests
```

Create the `src` and `test` directories and only these three source files and two test files. Only these five files may be edited during development. Use ES modules. The CLI reads completed-job JSON from stdin and writes a summary to stdout; it does not accept filesystem paths, URLs or executable instructions. The asynchronous runner is a module API, not a CLI code-execution feature.

### Challenging part: bounded asynchronous execution

Implement `runJobs(jobs, { concurrency, execute })` in `src/run-jobs.mjs`:

- `jobs` is an array of at most 100 records, each containing exactly `{name, durationMs}` with the same name/duration validation as the reporting module below.
- Options contain exactly `concurrency` and `execute`. Concurrency is an integer from 1 through 4; execute is a function. Validate the entire input and options before invoking any callback. Invalid input rejects with `TypeError('INVALID_INPUT')` and invokes zero callbacks.
- Invoke `execute(job, index)` exactly once per job. Start jobs in input-index order, maintain at most `concurrency` unsettled callbacks, and fill all available slots while queued jobs remain. When one settles, start the next queued job without waiting for the whole active batch.
- Fulfillment marks that job `ok`. A synchronous throw or promise rejection marks it `failed`; other jobs continue. Ignore callback return values and do not include thrown errors in output.
- Resolve only after every job settles, returning completed records `{name, durationMs, status}` in original input order, regardless of completion order. Empty input returns an empty array. Do not mutate inputs or share execution state between calls. Test callbacks eventually settle; cancellation, retries and per-job timeouts are outside scope.
- The supplied duration is report data, not a sleep duration or an elapsed-time measurement. Feed the runner's output directly into `summarizeJobs` in an integration test.

This is the challenging assignment: concurrency limits, eager scheduling, ordering, validation before side effects and failure isolation must hold together. Use controllable promises to test interleavings; tests should finish quickly and must not depend on long real-time delays.

### Easy part: reporting and CLI

Export `summarizeJobs(jobs)` from `src/report.mjs`.

Input is an array of at most 100 records. Each record contains exactly:

```json
{"name":"download","durationMs":1500,"status":"ok"}
```

- `name`: nonempty string of at most 40 JavaScript string code units; preserve it exactly.
- `durationMs`: integer from 0 through 86,400,000 inclusive, or null.
- `status`: exactly `ok` or `failed`.
- Reject missing fields, unexpected fields, wrong types and invalid values. Do not coerce strings to numbers. Null is an unknown duration and contributes zero to total time.

Return an object with keys in this order:

```json
{
  "total":2,
  "failed":1,
  "totalDurationMs":1500,
  "jobs":[
    {"name":"download","status":"ok","duration":"1s"},
    {"name":"sync","status":"failed","duration":"unknown"}
  ]
}
```

Preserve input order and duplicate names. Sum the original known milliseconds without rounding; format each duration using whole seconds truncated from milliseconds. Below one minute use `Ns`; below one hour use `Nm Ns`; otherwise use `Nh Nm Ns`. Do not mutate input records or the input array.

The CLI reads one JSON value from stdin, limited to 65,536 UTF-8 bytes. On valid input, print the summarized JSON followed by one newline, leave stderr empty and exit 0. On invalid JSON, oversized input or validation failure, leave stdout empty, print exactly `INVALID_INPUT\n` to stderr and exit 2. The module throws `TypeError('INVALID_INPUT')` for invalid input. Do not print input contents or stack traces for expected invalid input.

### Strict acceptance criteria

| ID | Required result |
| --- | --- |
| A1 | Empty input returns `{total:0,failed:0,totalDurationMs:0,jobs:[]}`. |
| A2 | Counts, failed counts, row order, duplicate names and original-millisecond totals are correct. |
| A3 | Null → `unknown`; 0 → `0s`; 999 → `0s`; 1000 → `1s`; 59999 → `59s`; 60000 → `1m 0s`. |
| A4 | 3599999 → `59m 59s`; 3600000 → `1h 0m 0s`; 3661000 → `1h 1m 1s`; 86400000 → `24h 0m 0s`. |
| A5 | Reject non-array input, 101 records, missing/extra fields, empty or overlong names, invalid status, negative/fractional/above-limit durations and numeric strings. Direct module calls also reject undefined, NaN and infinities. |
| A6 | Valid frozen arrays/records work; input remains unchanged; repeated calls are independent. |
| A7 | CLI success and failure obey the exact output, newline, stderr, byte limit and exit-code contract. |
| A8 | Submitted tests pass and exercise reporting, runner interleavings, invalid input, immutability, actual CLI and runner-to-summary integration. No dependencies or changes outside the five permitted files. |
| A9 | Runner executes every valid job exactly once, never exceeds concurrency, starts queued jobs in index order and fills available slots. A sequential-only implementation fails when concurrency is greater than one. |
| A10 | With concurrency 2 and jobs 0, 1, 2: start 0 and 1; resolve 1 while 0 remains pending; job 2 must start before 0 resolves. Final output still follows 0, 1, 2. |
| A11 | Mixed fulfillment, synchronous throw and promise rejection produce correct per-job status without losing remaining jobs or returning before the last job settles. |
| A12 | Invalid runner jobs/options invoke zero callbacks, including when only the last job is invalid. Test concurrency 0, 1.5 and 5, missing execute, empty input, frozen input and two concurrent independent runner calls. |

Run tests with `node --test test/run-jobs.test.mjs test/report.test.mjs`. Finish within the supplied deadline and return changed files, checks actually executed and any remaining failures. Complete local work only; do not publish anything.

Suggested work sizing: approximately 8 minutes for the runner and its tests, 4 minutes for reporting/CLI and their tests, and 8 minutes for integration, final testing, review and repairs. These are planning estimates, not extra deadlines or measured results. The independent modules can be implemented in parallel against the fixed interface; the overall 20-minute ceiling remains unchanged.

## Operator preparation and final acceptance

After completing the operator preparation below, start the measured session in the empty application directory specified above. Use the operator's fixed runtime, initial model/effort and acceptance-test version. The coding session creates the five files from this plan; missing source files, test files or a separate contract are expected and must not block development. The remaining instructions in this section are for external operator grading, not additional deliverables or prepared-file prerequisites for the coding session.

**Operator prerequisite before either measured run starts:** complete and freeze the acceptance grader before launching either development session or inspecting either candidate implementation. This preparation belongs to the operator, outside the application's five files and 20-minute development window. Do not ask a coding session to create, find, inspect or validate the private grader.

1. Derive one small deterministic grader and fixtures solely from the fixed A1–A12 requirements. Freeze the manual A8 scope/test-adequacy checklist and workflow-compliance rubric too. A criterion passes only when all its required assertions pass; overall application acceptance requires all 12. Report workflow, skill-use compliance, deadline and accounting completeness separately.
2. Validate the grader against a separate correct reference implementation and deliberately broken variants. Record that the reference passes and that each variant fails the intended assertion: rounding instead of truncation, invalid numeric coercion, wrong CLI exit status, unbounded execution, purely sequential execution, whole-batch waiting and completion-order output. Use controllable promises and bounded microtask checkpoints instead of timing guesses.
3. Before launching either run, create a timestamped operator manifest recording the hashes of both execution plans, grader, fixtures, reference and broken variants; validation commands/results; scoring rules; runtime/container version; development deadline; initial model/effort and configured service tier where available; and the allowed security-plugin identity/version or hash. Keep the same security-plugin availability and exception policy in both modes. Record actual invocation separately; differences in invocation are part of the observed workflows.
4. Keep the grader, reference, variants and detailed manifest outside both development directories and inaccessible through the development sessions' permitted tools, mounts and inherited context. A sibling directory alone is not an access boundary. Supply only a non-sensitive benchmark version/readiness identifier with each execution request; the developer must not inspect private assets or another plan to check readiness.
5. Use the same frozen grader bytes, fixtures, scoring and runtime for both final candidates. Candidate selection may change only the mounted application directory. Do not tailor tests, expected values or scoring to either implementation, and do not send private failures back for development after final submission.
6. If a grader defect requires correction, preserve the original version and results, record the correction and its reason, revalidate the reference and broken variants, and regrade both unchanged candidates with the corrected version. Label these results as an amended evaluation; do not present the corrected grader as the version frozen before development.

The operator must complete this preparation before starting a preregistered pair. If development has already begun without it, continue the authorized development under the supplied plan and label the comparison a pilot with acceptance tests prepared after the start; do not shift missing operator preparation onto the coding session or claim retroactive preregistration. Plan revisions apply to future runs and do not change the rules of runs already started.

For external acceptance grading, the operator executes generated code in an existing permitted isolated runtime with no network or credentials and bounded CPU, memory and time. Do not import it into the trusted operator process or build a new containment platform for this task. If that grading environment is unavailable, report external grading as unavailable; this does not block the coding session from developing and testing under its configured permissions and mandatory security instructions.

At final submission or the deadline, stop all participating model sessions and freeze the candidate. Run the private acceptance test and submitted tests in the isolated runtime. Inspect the actual assertions for A8 and record evidence for each criterion. Do not send private grader failures back for extra development after final submission. Repairs during the original 20-minute window remain allowed and counted.

Deterministic grading uses no model tokens; record its elapsed time separately. Use manual inspection for the small scope/test-adequacy check. If the operator uses a model for external grading, account for that separately. Reviews conducted during development are part of this run's measured cost.

## Token counting — operator after the run

Use recorded runtime usage, not the size of the code, final reply, saved transcript or displayed context window.

Maintain a short list of every session used by each run: lead, workers, supervisors, reviewers, replacements and repair continuations. Record session ID, parent or dispatch identity, actual model/effort and the corresponding usage-log path. Register standalone worker processes too; they may not appear as native children.

For each fresh session, collect its final complete cumulative usage after it stops and its log flushes:

```text
input_tokens
cached_input_tokens
output_tokens
reasoning_output_tokens, when available
total_tokens
```

Use each session's cumulative total **once**. Never add every cumulative notification together. If a session is continued for a repair, its final cumulative balance already includes earlier work. Do not count the same session a second time. Keep benchmark sessions fresh; do not reuse an unrelated conversation with a nonzero balance.

Before relying on the totals, verify for the installed client that parent usage excludes child usage and that counters did not reset or import prior history. Compare CLI completion usage with rollout records where available, treating them as alternative observations of the same requests rather than additional consumption. If those semantics cannot be verified, label accounting incomplete rather than guessing.

```text
Run input = sum(input_tokens for all distinct participating sessions)
Run cached input = sum(cached_input_tokens for those sessions)
Run output = sum(output_tokens for those sessions)
Run total = Run input + Run output
Run uncached input = Run input - Run cached input
```

Cached input is already included in input. Reasoning tokens, where reported as part of output, are already included in output; do not add them twice. Preserve unfamiliar usage fields and investigate their meaning before including them in an aggregate.

Example accounting check: a lead ends at 1,000 input / 200 output, and a worker at 400 input / 100 output. Total is **1,700**, regardless of how often earlier cumulative records were emitted.

Count all measured development activity: task reading, file creation, skill loading and reading referenced instructions, planning, delegation, testing-related model calls, supervision, internal review, failed attempts, repairs and final response. Include all authorized security-plugin loading, referenced material, security work and additional participating sessions in the same development time and token totals. If prohibited skill use occurs, include its tokens and report the run as contaminated. Ordinary test-process execution itself uses no model tokens. Operator preparation of private acceptance tests is outside the measured development run.

Include usage consumed by failed and timed-out sessions. Missing terminal usage, untracked children or unsupported counter resets mean incomplete accounting, not zero consumption. Keep raw logs private; the result table needs only IDs, model/effort and usage numbers. A small offline extraction script is sufficient if manual collection is inconvenient; it must not make model calls.

The coding session must list every participating session and its role at handoff. The operator finalizes totals after the final response and all child sessions have stopped and their logs have flushed. Do not make an extra model call merely to collect totals or claim a complete total while the measured final response is still being generated.

## Required handoff

Return:

- Changed application files and implementation summary.
- Exact checks run, results and any unverified acceptance criteria.
- Any deadline, runtime or permission limitation.
- Memory-isolation status for all participants: no memory reads/writes or injection observed, contamination with session/action/time, or enforcement unverified. Identify any automatic memory writer or conflicting instruction; do not inspect memory contents to produce this report.
- Evidence that orchestration, challenging coding, easy coding, test supervision and independent review occurred; include unresolved review findings.
- Whether any skill was actually read, invoked or followed, distinguished from catalog visibility. Identify authorized security-plugin use, its trigger, version/hash, sessions and work; distinguish required development-workflow use, the authorized security exception and prohibited use. For skill-use classification, only prohibited skill use counts as contamination; memory contamination is reported separately.
- Every participating session ID, role and observed model/effort, with available usage-evidence pointers. Unknown values remain unknown.

The operator then records:

| Result | Value |
| --- | --- |
| Acceptance criteria passed / 12 | |
| All criteria satisfied | |
| All required workflow stages completed | |
| Memory isolation: verified / contaminated / unverified; settings and affected sessions | |
| Benchmark version, pre-run manifest timestamp and grader/plan hashes | |
| Grader reference/variant validation completed before development | |
| Evaluation status: preregistered / pilot / amended | |
| Skill-use compliance: codex-production-pipeline / with authorized security exception / contaminated | |
| Security plugin used, trigger, version/hash and participating sessions | |
| Finished within 20 minutes | |
| Input tokens | |
| Cached input tokens | |
| Output tokens | |
| Total tokens | |
| Participating sessions | |
| Accounting complete | |

Also record tokens by model and role if multiple sessions participated. Keep failed and timed-out consumption. Incomplete accounting is not zero usage, and a failing application with fewer tokens is not a successful efficiency result. Tokens are not dollars or subscription allowance.

This document is the execution plan; authoring it does not itself start an application run.
