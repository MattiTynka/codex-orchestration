# Codex orchestration

A skill bundle for Codex CLI and local Desktop workspaces. Astra high coordinates; Astra medium implements substantive code; Astra high handles consequential design and sensitive logic/review. Terra xhigh/max handles basic coding and specified fixtures. Luna max supervises long tests. Fresh reviewers use Sol medium for routine low-risk changes or Astra medium/high for substantive/sensitive changes.

The workflow defers expensive suites until the integrated candidate is ready, preserves source-bound evidence, and ends by preparing a PR for external review. It does not merge, enable auto-merge, deploy, or apply hosted migrations. Necessary migration files are authored before the final test battery and included in the PR.

## Package scope

This is an extracted bundle with no Git metadata, package manifest, dependency installation, or remote. Node **22+** is required. Git is required for `evidence.mjs` and its disposable repository tests; the evidence target must be a real Git repository root.

`SKILL.md`, `references/`, helpers, examples, and nine `codex-agents/` definitions are package assets. They do not establish that the skill or roles are installed in this client. The original archive's `install.mjs`, `tests/pipeline.test.mjs`, and `tests/launcher.test.mjs` are absent from this export; do not run their historical commands here.

For a separately authorized installation, place skill assets in the target's `.agents/skills/codex-production-pipeline/` and role TOMLs in `.codex/agents/`, preserving existing configuration. Version 1.2.0 retires `cpp-astra-low`/`cpp-sol-high`, adds `cpp-terra-xhigh`/`cpp-correctness-routine`, and changes existing roles. Review installed conflicts and duplicate names rather than blindly copying over them. Maintaining this export does not update other installations.

## Start in CLI

From this skill directory:

```text
node scripts/codex-launch.mjs lead --repo /absolute/path/to/repository --dry-run
node scripts/codex-launch.mjs lead --repo /absolute/path/to/repository
```

The default is Astra high, workspace-write, on-request approvals, and at most two concurrent child agents. The explicit `--route lead-high` option also selects Astra high. Use `--codex /absolute/native/executable` if needed; Windows `.cmd`/`.bat` shims are refused.

In the resulting conversation:

```text
Use $codex-production-pipeline to implement this change: [outcome].
Keep required quality/security gates and prepare the PR for external review without merging.
```

Use `worker --route` for bounded implementation or test supervision, and `review --kind correctness|security` for a fresh reviewer. Correctness defaults to Astra medium; `--route correctness-routine` selects Sol medium for routine low-risk work. Security remains Astra high. See [routing](references/routing.md) for exact commands and runtime observation.

## Start in Desktop

Open the local consuming repository, select **Astra / High** for orchestration, and invoke the skill. Sol medium remains available for bounded routine coding, and Terra xhigh/max for basic coding and specified fixtures. A skill cannot change an existing conversation's model.

Verify discovered roles, explicit model/effort selection, fresh reviewer context, and effective permissions. Native child permissions can inherit parent overrides. Use a fresh restricted CLI reviewer when the native surface cannot establish read-only access. See [compatibility](references/compatibility.md).

## Workflow references

- [Task contracts](references/contracts.md): bounded assignments and evidence reports.
- [Routing](references/routing.md): work classes, model selection, observed execution, and worktree integration.
- [Testing](references/testing.md): deferred expensive suites, Luna ownership, completion events, and rerun conditions.
- [Review](references/review.md) and [security](references/security.md): independent assessment and preserved gates.
- [Evidence](references/evidence.md): source/brief binding, checks, authorship, routing, and local assessment.
- [PR handoff](references/handoff.md): migration authoring, verified commit, draft PR, external review, and no merge.

Adapt the brief examples to the consuming repository's real required checks. Examples are deliberately incomplete, not a generic acceptance or security suite. Short deterministic commands run directly; long tests have one supervisor. Independent branches must be integrated before final testing and review.

## Verify this bundle

```text
node --test tests/dispatch.test.mjs tests/observe-routing.test.mjs tests/routes.test.mjs tests/evidence-routing.test.mjs
```

Use `node --check` for changed scripts. No development server, compilation build, linter, typecheck, or npm install is configured. Tests use fixture child processes and disposable Git repositories; they do not prove live model entitlement.

See [VALIDATION.md](VALIDATION.md) for current and historical checks and [OpenAI sources](references/openai-basis.md) for documentation basis. Historical green results are not verification of this revision. No measured quality, speed, or cost improvement is claimed.

Local `ACCEPT`, observed inference, an open PR, external CI, and release authority are separate claims. The evidence helper always returns `releaseAuthorized: false`; local records are not authenticated attestations. If the target lacks a usable remote or publishing authority, prepare the local PR body and report the handoff gap. Do not initialize Git solely for bookkeeping.
