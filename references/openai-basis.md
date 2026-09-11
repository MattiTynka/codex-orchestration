# OpenAI prompting basis

Original sources checked 2026-09-09; subagent configuration and permission guidance rechecked 2026-09-10 for the 1.2.0 routing update. The prompts are original task contracts, not copied vendor personas. Routing is the user's policy; documentation supports implementation mechanics and model-specific prompting choices.

| Source | Applied choice |
|---|---|
| [GPT-6 Astra prompting guidance](https://developers.openai.com/api/docs/guides/latest-model) | Explicit completion authority, useful progress before questions, concise evidence-preserving updates, conditional delegation, and verification proportional to real risks. This skill explicitly requests bounded useful delegation under the user's routing policy. |
| [GPT-5.6 prompting guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.6) | A compact goal/context/constraints/evidence contract, one statement per rule, clear local-action authority, and responses preserving consequential caveats. Sol/Terra/Luna receive different task scopes instead of repeated process lectures. |
| [Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra), [Terra model](https://developers.openai.com/api/docs/models/gpt-5.6-terra), [Luna model](https://developers.openai.com/api/docs/models/gpt-5.6-luna) | Exact model IDs and runtime effort values. The 1.2.0 user policy selects Terra xhigh/max, Luna max, Sol medium, and Astra medium/high; verify actual client/account support separately. |
| [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) | Standalone TOML roles; custom-file settings override explicit spawn settings, which override agent defaults and parent settings. Set both model and effort. Confirm actual execution, discovery and inherited permissions. |
| [Build skills](https://learn.chatgpt.com/docs/build-skills) | Repository/user discovery paths, SKILL.md plus optional references/scripts, progressive loading, and UI metadata. |
| [Non-interactive Codex](https://learn.chatgpt.com/docs/non-interactive-mode) | Fresh worker/reviewer `codex exec`, explicit sandbox/approval policy, stdin packet, JSONL events, and final output. Installed `exec --help` independently verifies accepted CLI flags. |
| [Codex Security](https://learn.chatgpt.com/docs/security) | Optional plugin/CLI security evidence remains distinct from required independent assessment and external release enforcement. |

No prompt asks for hidden chain-of-thought, treats “think harder” as a reasoning setting, or enables API-specific pro/caching features in a CLI configuration. No API rate table, claimed consensus, or guaranteed savings has been used to choose a role. Economics must be measured on accepted repository tasks. The 1.2.0 scheduling policy defers expensive tests to an integrated candidate and prefers completion events; it does not claim measured savings. The user's requested PR stopping point is a workflow rule, not an OpenAI platform merge control.
