# Codex CLI and Desktop compatibility

The 1.2.1 policy uses Astra high leadership, Astra medium/high implementation and review, Terra xhigh/max basic coding, and Luna max test supervision. See [routing](routing.md) for exact routes and [validation](../VALIDATION.md) for dated execution evidence. Historical client versions and catalog entries are not proof of access in a new setup.

## Preflight and discovery

Confirm account/client support for every requested model and effort. Set exact IDs such as `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, and `gpt-6-astra`. Set model and effort as runtime configuration, then inspect actual execution. Do not substitute `high` for `xhigh`/`max` or fill observed fields from configured intent. Missing required support leaves `INCOMPLETE`.

Inspect `codex --version`, `codex --help`, and `codex exec --help` when using the CLI. Current official [subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) describes per-role model/effort configuration and inherited runtime permissions. Verify the current schema instead of assuming every client exposes the same selectors.

Local skills are discovered under `.agents/skills/` and custom agents under `.codex/agents/` (or their personal equivalents). This export contains package assets, not installed roles. Its original installer is absent. Do not run historical installation commands or change global configuration as part of maintaining the bundle.

Agent definitions set name, description, developer instructions, exact model/effort, and disabled descendant agents. Custom-agent configuration can override explicit spawn defaults. Inspect duplicate names and effective settings on mismatches. During an explicitly authorized installation update, retire old `cpp-astra-low`/`cpp-sol-high` definitions and update changed roles; this export does not modify existing installations.

## CLI

The launcher defaults to an interactive Astra high lead with workspace-write, on-request approvals, and a two-child cap. `lead --route lead-high` requests Astra high. A new invocation is a new session; it cannot change an existing lead. The lead may dispatch a bounded Astra high consequential-design assignment when useful.

Use a real role selector or explicit model plus effort. A model named only in prompt text does not select it. The fresh `worker --route` and `review --kind ... [--route ...]` paths use literal argv, no shell interpolation, new `codex exec` sessions, and disabled descendants. Inspect dry-run arguments before live use. Separate model processes count in the task budget.

## Desktop

Open the local target repository, select **Astra / High**, and invoke the skill. The skill cannot change the model of an existing conversation or connect a hosted environment to local files.

Refresh discovery if explicitly installed roles do not appear. Inspect the actual dispatch schema. On surfaces exposing `fork_turns`, use `none` for a fresh packet; a full-history fork may inherit the parent route and disallow overrides. When native model selection or fresh review cannot be established, use the compatible local CLI fallback. Missing capability is an explicit gap, not permission to simulate a route in text.

A reviewer must have fresh context and effective read-only access. Native children may inherit parent permission overrides despite role defaults. Prefer a fresh restricted CLI reviewer when that is needed to establish read-only execution; it still loads repository/user configuration, hooks, and connectors. Do not bypass permissions or claim OS isolation from a role file.

## Test waiting and worktrees

Prefer completion events for long tests. If only polling is available, use infrequent checks with backoff within tool limits and keep the lead from polling a Luna supervisor repeatedly. Follow [testing](testing.md). A process timeout remains a bound, not an instruction to restart quiet tests.

Use separate worktrees for independent writable tasks in a real Git repository; explicitly select each worker's directory. Native subagents may share the parent's directory. Worktrees do not isolate processes, databases, ports, secrets, or network access. Follow [integration guidance](routing.md#worktrees-and-integration).

## Windows and local prerequisites

Node 22+ is required; Git is needed for evidence snapshots and Git fixture tests. This export itself has no Git metadata. No npm install is required. Commands accept quoted PowerShell paths. Pass a native Codex executable with `--codex`; `.cmd`/`.bat` shims are refused to preserve shell-free execution.

Prompt/output paths reject symlink ancestors. Use canonical directories when the platform aliases a temporary path; do not weaken that check. The evidence helper resolves Node to its own runtime and can invoke npm's JavaScript entrypoint on Windows. Process-tree cleanup is best effort, not hostile-process containment. Respect the active sandbox and approval policy.

## Maintenance

Run `node --test tests/dispatch.test.mjs tests/observe-routing.test.mjs tests/routes.test.mjs tests/evidence-routing.test.mjs` after route contract changes. The historical `pipeline.test.mjs`, `launcher.test.mjs`, and installer are absent from this export. Fixture tests establish helper behavior, not live model access or every OS/client/account combination.

Verify installed discovery and runtime metadata separately when live operation is requested. Preserve managed defaults and required CI. Changed routes or permissions invalidate affected evidence. The workflow ends with a [PR for external review](handoff.md), never an automatic merge or hosted migration.
