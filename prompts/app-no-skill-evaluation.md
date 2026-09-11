# NO-mode evaluation — 2026-09-10

Target: `../app-no-skill`. Candidate files were not changed. This external evaluation is excluded from development usage.

## Result

Application acceptance: A1–A12 supported by source/assertion inspection, an independent rerun of all 40 submitted tests, and additional validation/concurrency/completion probes. No remaining application defect demonstrated. This is a post-development pilot evaluation, not a preregistered private-grader result. No pre-run reference/mutant validation was established.

Workflow: all requested roles participated, but strict review isolation is incomplete. All four child creations used `fork_turns: none`; the reviewer was a non-author and reassessed repairs. However, its filesystem was writable and its hypothesis probes ran as direct host Node commands, without the plan-required isolated runtime. Unchanged hashes support non-modification, not enforced read-only access. Native test execution also appears in the supervisor log.

Full lead turn: 2026-09-10 16:41:47.561–16:56:49.805 UTC, 15m02.244s. This includes initial task reading and final handoff. It passes the 20-minute deadline; the reported 13m21s understates the full interval.

No prohibited skill or persistent-memory access was observed in inspected tool calls. All five session metadata records report `memory_mode: disabled`. These observations do not independently certify infrastructure isolation; some inter-agent message payloads in the raw logs are encrypted.

## Runtime usage

All five sessions report `gpt-5.6-sol`, effort `medium` in their turn contexts. This is local runtime evidence, not authenticated provider or billing attestation.

| Role | Session ID | Input | Cached input (included) | Output | Total | Standard API estimate USD |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Lead | 01a08c32-524b-7503-8a2b-a8ecbb375a9e | 1,600,755 | 1,532,544 | 10,047 | 1,610,802 | 1.086802 |
| Runner builder | 01a08c32-fda7-7ee2-9ae5-c969a9463d57 | 582,919 | 551,808 | 9,416 | 592,335 | 0.533487 |
| Report/CLI builder | 01a08c33-37f3-7052-b740-dccd9bbbc04c | 471,698 | 458,496 | 7,003 | 478,701 | 0.376266 |
| Test supervisor | 01a08c39-355f-7163-9a0c-d1689eef2b22 | 279,629 | 268,416 | 2,043 | 281,672 | 0.193078 |
| Independent reviewer | 01a08c3a-d855-78c3-b638-5eeedfae866d | 503,388 | 468,864 | 5,936 | 509,324 | 0.444362 |
| Total | 5 sessions | 3,438,389 | 3,280,128 | 34,445 | 3,472,834 | 2.633995 |

Uncached input: 158,261. Reasoning output: 10,627, already included in output. Cache-write tokens: zero. Each distinct session's final cumulative balance is counted once, including reviewer/supervisor continuations and repairs. Earlier separate failed NO-mode sessions and this evaluator session are excluded from this completed run.

Logs: `C:/Users/maxim/.codex/sessions/2026/09/10/rollout-*-SESSION-ID.jsonl`, using the exact IDs above. Parent links identify exactly four children and no further descendants in that day's session metadata. The five sessions contain 35, 15, 13, 8 and 10 distinct usage updates. Every cumulative increment reconciles exactly to its last-request usage, from zero; no reset or extra child-usage increments were found. Total: 81 recorded inference updates. Maximum per-request input: 62,814 tokens. Terminal task-complete records exist for all participants. This provides reconciled local accounting; it does not establish provider-side billing completeness.

Pricing fetched from https://developers.openai.com/api/docs/pricing on 2026-09-10. Standard short-context Sol rates per million: input $4, cached input $0.40, output $20. Formula: `(158261*4 + 3280128*0.40 + 34445*20)/1000000 = $2.6339952`. Fast-mode equivalent: $5.2679904. Service tier and actual billed amount were not present in the inspected turn metadata. These are API-equivalent estimates, not an invoice or measured subscription charge; regional uplifts and account-specific terms are not included.

## Verification evidence

Original executed brief: `C:/Users/maxim/.codex/attachments/4f994f36-a2df-464b-9daf-1064ed6c37c7/pasted-text.txt`, SHA256 `D3E5B99E1062DB13A23DC5DF7EA5976D238F9145CA850052D9B382A0DCC2DBB9`. The current docs plan has different bytes; evaluation used the executed attachment for contractual requirements.

External submitted-test rerun: Node 24.11.1, exit 0, 40 passed, zero failed/cancelled/skipped/todo, 845.548097ms. Command inside container: `node --test test/run-jobs.test.mjs test/report.test.mjs`. Podman used existing `docker.io/library/node:24.11.1-bookworm-slim`, candidate mounted read-only at `/app`, network none, read-only root filesystem, all capabilities dropped, no-new-privileges, 256MiB memory, one CPU, 64 PID limit and 30-second timeout.

Additional external probes passed for invalid numeric values, concurrency 1–4, initial slot filling, out-of-order eager refill, exactly ordered results, completion waiting, mixed throw/reject/fulfill and invalid options with zero callbacks. An initial evaluator harness had an undefined-default fixture error and was corrected; that failure was not an application defect. These supplemental probes were created after implementation inspection and are not a frozen private grader.

Source/test inspection supports A1–A8; actual deterministic interleavings, validation checks, frozen-input and simultaneous-call assertions support A9–A12. Scope contains only the permitted five application/test files and the excluded operator config. No application changes were made by the evaluator.

Final SHA256 values, unchanged before/after evaluation:

| File | SHA256 |
| --- | --- |
| src/cli.mjs | 3119E76B3FE96FDA38962EB6F7273154DACB5053CD7ECCE8F5391FDD284546CB |
| src/report.mjs | 94A2341DEE2E7A033DCE0892C43D7381A026423E7D3FA00222830C60EEC01E49 |
| src/run-jobs.mjs | 44B44F39ED9060C46B3A3CCDCE3DAC7AF0A69AE0726B41484121644017F34831 |
| test/report.test.mjs | EE9C2F75FCEDB138A0B40B5C2E035A6CC48981419F885F80EB25FD79A947A8FC |
| test/run-jobs.test.mjs | C85970722A5BDB07110249AC47247D197CD1AA335C73D856C363B20AC3AE6032 |
