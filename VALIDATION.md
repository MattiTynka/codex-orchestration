# Validation record

Public distribution note: personal filesystem paths and actual session identifiers have been removed or replaced with generic labels. Historical observations below are retained as dated claims; the private evidence is not included. The current 1.2.1 orchestrator is Astra high; historical Sol leadership descriptions apply only to earlier revisions.

## Local 1.2.0 policy update — 2026-09-10

This extracted bundle now uses Sol medium leadership with Astra high escalation, risk-aware fresh review, Terra xhigh/max basic coding, and Luna max non-author test supervision. Expensive suites are deferred to an integrated stable candidate. The implementation workflow authors needed migration files before final tests and prepares a PR for external review without merge, auto-merge, deployment, or hosted migration execution.

The route regression baseline failed as expected before helper edits: 14 tests, 5 passed and 9 failed. An additional focused regression demonstrated that a lead route could be mislabeled as a non-author worker; it failed before the purpose guard was added and passed afterward.

On Windows with Node v24.11.1, the final integrated command was:

```text
node --test tests/dispatch.test.mjs tests/observe-routing.test.mjs tests/routes.test.mjs tests/evidence-routing.test.mjs
```

Final result after review repair: **26 passed, 0 failed, 0 skipped**, about 15.5 seconds. The earlier 24-test battery passed before independent review found the remaining routine-review exemption. A focused regression reproduced that exemption before a one-line fix made correctness review mandatory for every brief. Added cases reject an empty review requirement at initialization and missing review evidence at assessment. The complete battery was then rerun on the repaired helpers.

The suite also covers launcher defaults/escalation and strict flags, all worker routes, child completion/failure/timeout, observed identity/model/effort, risk-aware review acceptance, non-author restrictions, self-review and stale-brief rejection, and continued `releaseAuthorized: false` even with a passing external-gate fixture. It is targeted helper coverage, not the full historical evidence suite.

All eight script/test JavaScript syntax checks passed. Parsing and consistency checks passed for six JSON examples, nine TOML roles, one YAML metadata file, and 34 local Markdown links. The external skill validator passed with `python -X utf8 <CODEX_HOME>/skills/.system/skill-creator/scripts/quick_validate.py .`.

Useful native worker execution was independently observed from exact rollout metadata and subsequent positive usage: Terra/max session `REDACTED-SESSION-1` authored regressions; Astra/medium session `REDACTED-SESSION-2` implemented helpers and roles. Both have parent `REDACTED-SESSION-3`. These observations do not establish every route's availability, authenticated billing, or cost savings.

Task backup, before hashes, RED logs, review reports, and `final-tests-repaired.log` are under `<PRIVATE_VALIDATION_ARTIFACTS>/`. This export has no Git metadata or remote: no application acceptance run, live PR creation, deployment, or migration execution is claimed. No global configuration was changed. Installation needs its own file/discovery verification and is not established by the helper tests. Scheduling/worktree/PR behavior is workflow guidance, not an OS-enforced scheduler or remote merge control.

The sections below retain dated historical evidence for earlier revisions. Their route defaults, environments, hashes, and checks do not establish the current bundle's behavior.

## Local 1.1.0 routing repair — 2026-09-09

The preceding application task's actual dispatches selected `cpp-astra-high` for implementation and `cpp-security` for review. Their session records show Astra/high; no failed lower-model dispatch or automatic fallback was recorded. The original skill allowed broad direct-lead work and a combined Astra review. Its helper exposed only lead/review commands, so listed worker routes had no concrete CLI fallback. These were workflow and tooling gaps, not evidence of a universal same-model limit.

The update requires per-assignment allocation, explicit native role/model selection with fresh context, and observed routing before worker reuse. It adds `worker --route` and a separate runtime observer. Deterministic test commands stay direct; specified test authorship and bounded diagnosis go to Luna/Terra. The original downloaded ZIP is unchanged. This installed skill is ignored by this repository's Git configuration.

### Actual inference, Windows

Both installed CLI version output and the observed child rollouts report `0.153.4`. Node is `v24.11.1`. The version is evidence of this setup, not a minimum supported version or a Desktop UI version.

| Surface / useful work | Actual model / effort | Session ID |
|---|---|---|
| Desktop native role: inspect launcher gaps, then author bounded regression tests | gpt-5.6-luna / max | `REDACTED-SESSION-4` |
| Desktop native role: implement approved worker-launch contract | gpt-5.6-terra / max | `REDACTED-SESSION-5` |
| Fresh CLI worker: evaluate five routing scenarios against updated instructions | gpt-5.6-luna / max | `REDACTED-SESSION-6` |

The two Desktop children have parent `REDACTED-SESSION-7`; both were dispatched with named roles and `fork_turns: "none"`. The CLI worker used explicit `--model`, `model_reasoning_effort`, `read-only`, and disabled descendant agent tools. All three have matching `turn_context` records followed by positive `token_count` usage. `observe-routing.mjs` verified identity, parent where applicable, model, effort, and usage with exit 0. The CLI process also exited 0 with a final answer; it correctly selected Luna fixture authorship, direct deterministic checks, fresh native dispatch, CLI fallback, and incomplete status for unobserved/mismatched routing.

Raw rollouts are under the configured Codex home `sessions/2026/09/09/`, with the actual identifiers omitted from this public record. Task artifacts are under `<PRIVATE_ROUTING_ARTIFACTS>/`; they contain the CLI packet, invocation, final answer, completion, observations, and review evidence. Metadata/usage records prove locally observed execution; they are not authenticated billing or provider attestations. No cost savings were measured.

### Verification for this update

Run from the installed skill directory:

```text
node --test tests/dispatch.test.mjs tests/observe-routing.test.mjs
python -X utf8 <CODEX_HOME>/skills/.system/skill-creator/scripts/quick_validate.py .
```

The focused suite passed **14/14 tests, zero failures**, independently rerun by the parent and reviewer after the final test correction. Four JavaScript syntax checks and 14 local Markdown link checks passed. Python's `-X utf8` is necessary with this Windows default encoding; the initial unqualified validator invocation failed while decoding the existing Unicode skill text, before validating it. The UTF-8 invocation passed.

A test initially imposed an extra rule rejecting any pre-context usage event. The settled contract ignores those events and requires positive usage afterward. Correcting that overconstrained assertion made the suite green without changing production behavior.

The fresh reviewer additionally passed **16/16 adversarial probes** covering literal argv/stdin, route and sandbox restrictions, timeout bounds, output reuse/junctions, prompt/log limits, and rejected or malformed observation evidence. It returned **ACCEPT for both correctness and security**, with no demonstrated finding. Its actual session `REDACTED-SESSION-8` was independently verified as Astra/high with positive usage and the same Desktop parent. The separate report records both coverage sections; dispatch requirements served as the review brief, with no separately frozen brief artifact/hash. These local checks do not constitute the evidence helper's full application acceptance process or release authorization.

Reviewed executable SHA-256 values:

```text
2953a83a64d45b9f64cd29b7bc8256d77869ac192f0c91ba0ac60f45c93cc54b  scripts/codex-launch.mjs
d7e18e30fd06745ed974c2a37cfe7c3ca1a69c10b587067cd20488f4fec87666  scripts/observe-routing.mjs
```

These tests exercise all worker route argv, worker/review option separation, real fixture-child completion/failure, and missing/mismatched runtime evidence. They do not run an LLM for every model/effort pair. Live Desktop Luna/Terra and fresh CLI Luna are verified; native CLI custom-role spawning, every other route, other operating systems, changed accounts, and managed-policy variants are not established by this run. No global config or permission policy was relaxed.

## Historical original 1.0.0 package record

The remainder is the original validation record, retained for provenance. Its environment, test counts, hashes, and limitations apply to the original package, not the updated local executables above.

Validation date: 2026-09-09. Version: 1.0.0.

## Evidence collected

The skill was checked against official OpenAI model, prompting, subagent, skill-discovery, and non-interactive execution documentation. Source links and the application of each source are in `references/openai-basis.md`.

The available native CLI reports `codex-cli 0.154.0-alpha.3`. Its bundled catalog advertises all requested model/effort pairs. A local app-server protocol probe with no inference requests discovered the installed project skill, accepted `gpt-5.6-luna` with `model_reasoning_effort=max`, and returned `agents.max_concurrent_threads_per_session=2` without protocol errors. This verifies parsing/discovery, not account entitlement or server execution of the requested models.

Python TOML parsing verified all nine custom agent definitions and disabled leaf agent tools. JSON examples, local documentation links, JavaScript syntax, and skill frontmatter validation passed. Final test and review results are recorded below.

## Test scope

Helpers are exercised with real temporary Git repositories, real child processes, and fake Codex executables. These are meaningful behavior checks of local tooling, not paid inference or end-to-end product security tests. They cover source/brief binding, stale evidence, recorded self-review, missing security review, requested-versus-observed routing, log tampering, timeouts, installer conflict handling, and review process boundaries.

Four new routing regressions failed against the inherited model-neutral evidence validator before stricter Codex routing was implemented: evaluator fallback, unobserved effort, lower-effort security review, and relabeled Luna max. They subsequently passed, along with the earlier evidence regressions.

A further regression rejected undercounted sessions when the participant records already show more distinct sessions than the reported budget. It failed before the consistency check and passed afterward.

Independent review identified launcher output-cap, log-write, child-cleanup, interruption, and terminal-session issues during development. Immediate repair verification closed those findings. The reviewer also exercised independent interruption and PTY fixtures; these confirmed cleanup and retained controlling-terminal access after repair. The final separate assessment is recorded below.

## Workflow validation

An Astra high baseline decision pass without this skill handled all four pressure cases safely. An independent Astra high pass using the skill also handled routing fallback, self-review under budget pressure, stale source/brief evidence, and missing scan/abuse coverage safely. This provides no measured behavioral lift over the baseline. No controlled cost-saving or production defect-rate claim is made.

## Remaining practical limits

- Native Desktop UI, macOS, and Windows execution were not exercised in this Linux environment.
- The CLI discovery/configuration probe made no inference requests; no all-model live dispatch or user-account availability test was run.
- Custom agent TOML was parsed and checked against documented discovery mechanics; the nine roles were not all spawned through a live Desktop/CLI conversation.
- Local evidence hashes and reviewer/routing records are not authenticated attestations. Semantic coverage, actual independence, effective permissions, and observed routing require inspection.
- Helpers do not sandbox hostile processes, secure credentials or connectors, install scanners, enforce external CI, or prove absence of vulnerabilities.

## Final verification

Final combined command:

```text
node --test tests/pipeline.test.mjs tests/launcher.test.mjs
```

Result: **52 tests passed, 0 failed, 0 skipped** on Linux, Node v24.19.0, Git 2.51.1. This comprises 35 evidence/installation tests and 17 launcher/installation tests. The personal-destination test injects directory values into a pure resolver; it does not alter HOME/CODEX_HOME or install into a real personal directory.

A separate fresh reviewer requested as **gpt-6-astra / high** assessed source, instructions, configurations, and relevant tests without builder history or the earlier reviewer report. It found a workflow-completeness defect: inspection-only tasks could not complete with no task authors. The repair added an explicit frozen review mode and an unchanged-candidate requirement. The same independent reviewer verified that bounded repair, including independent negative cases for unknown effort, carried-forward author self-review, and candidate mutation, then returned **ACCEPT with no open concrete finding** within the documented local trust model.

The initial security review, immediate lifecycle-repair verification, and separate fresh final assessment were distinct stages. This report does not claim a new reviewer for each ordinary repair. No source was edited by a reviewer. Model identities here describe requested review routing; they are not an authenticated billing/provider attestation.

Final reviewed executable hashes:

```text
d36880e43b41e06bb469fa2db44a863531554445303114f40f94e1f2720c8849  install.mjs
7474712d5b8aac39a93b57095286eeede49ab25e492113dc7f807931015306f6  scripts/codex-launch.mjs
75bf23f3f7b5ccd290595b306bf5c2cc603f28a799c087966915ce84f7c956de  scripts/evidence.mjs
2be7b52dd87d4cd1bd1a88c9bf7f6231327c89d10d92f68fc81ed06a33587c82  scripts/routes.mjs
```

The ZIP's CHECKSUMS.sha256 binds all packaged source/document files. Its checksums establish byte consistency, not reviewer identity, model entitlement, a secure application, or permission to release one.
