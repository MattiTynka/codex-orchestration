# Test scheduling and supervision

Classify checks using known durations or repository guidance. Record expensive suites and their expected runtime/timeout in the task packet. If duration is unknown, use the first necessary run as evidence; do not launch a separate timing benchmark.

## Run expensive suites on the integrated candidate

Finish implementation, test authoring, migration files, and branch integration before starting the expensive final battery. Quick targeted checks during development are useful when they establish a reported failure, resolve uncertainty, or validate a risky local change. Do not run the entire suite after every edit or ask each worker to run the same integration battery.

Freeze the candidate and environment before final checks. Keep writers away from that candidate while checks run. Run every required check, including relevant security denial tests and migration validation. A slow required check may be deferred until this stage; it cannot be omitted for cost or elapsed time.

One successful battery on an unchanged candidate is sufficient. Reuse its recorded evidence for independent review; reviewers do not rerun it ceremonially. Failures, new findings, changed source/environment, or required external CI can justify more execution. Under `evidence.mjs`, any source change invalidates all check records for the old snapshot: run the full required recorded set again on the stable replacement. During repair, use targeted checks first, then pay the final suite cost once repairs are integrated. Never copy a passing record onto a new digest.

## One owner for a long run

Assign Luna max a bounded `test-supervision` packet containing the exact candidate, approved commands or existing run identifier, expected duration, timeout, logs, and reporting conditions. Luna may start the approved run or attach to it; it must not start a second copy because output is quiet. Short deterministic checks need no supervisor.

Use process completion notifications or tool-supported event waits where available. If polling is necessary, start at about 60 seconds and back off toward the known duration, subject to actual tool limits and responsiveness requirements. Do not repeatedly fetch unchanged full logs. Lack of output alone is not a hang; inspect once when an expected milestone or deadline is missed. Preserve configured timeout and cancellation controls rather than extending them silently.

The orchestrator should do independent work and consume the supervisor's completion event. It must not repeatedly poll the supervisor while the supervisor polls the test process. Required user updates can summarize already-known progress without triggering a test-status query.

Luna reports only completion, failure, timeout, evidence-capture failure, or a decision needed from the lead. The report contains command/run identity, source and brief identity, exit code, duration, a short result summary, and log pointers. On failure, include the smallest useful error excerpt. Do not claim a pass from process existence, partial output, or a still-running command.

The supervisor does not edit production code, tests, expected results, or scanner settings, and does not silently retry failed tests until green. Return substantive failures to the builder; escalate uncertain interpretation. Tests may write approved temporary outputs, but source must remain unchanged. A role's read-only setting and a worktree are not process isolation: use the task's permitted test environment and report blocked execution.
