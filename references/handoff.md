# PR handoff for external review

For authorized implementation work, the pipeline's deliverable is a verified candidate and a PR ready for external review. After the required local test battery and independent assessment pass, create or update the PR in the authorized repository. Do not finish with only an offer to open it when the workflow and user already authorize that action.

## Prepare migration files before final tests

When the feature needs database changes, write migration files using the consuming repository's naming, ordering, transaction, and compatibility contracts. Include them in the same candidate as their application callers. Have Astra high assess migration design and data-integrity risks. Include applicable migration tests and recovery/rollback guidance; destructive changes may require a forward-repair strategy rather than a fictional reversible rollback.

Writing migration files is part of implementation, before the final battery. Do not add untested migrations after a green run. Execute migration tests only in an authorized disposable/local test database. Applying changes to hosted, staging, or production databases requires separate explicit authority and is outside this handoff workflow. If no migration is needed, say so in the PR when relevant; do not generate empty migrations.

## Open the review artifact

Inspect the intended repository, remote, base branch, existing PRs, and final diff. Include only task-owned changes. Prepare the task commit before freezing source for the final test battery: the evidence snapshot includes HEAD and the index, so committing after checks would invalidate their records. After local acceptance, push that exact verified commit as authorized by the implementation workflow, then create or update its PR. If hooks or later edits change the candidate, reverify and review the replacement before claiming acceptance. Use the repository's PR template and preserve unrelated content in an existing PR. Default to a draft PR for external review unless the user or repository explicitly requests a ready-for-review PR.

The PR description must make the change independently reviewable:

- The original problem, resulting behavior, and relevant requirement/security constraints.
- Scope and consequential design choices, without presenting the author's confidence as proof.
- Exact verification commands and results, final source/commit identity, and accessible evidence pointers with secrets excluded.
- Independent correctness/security assessment and unresolved limitations, with local results distinguished from external CI.
- Migration files, compatibility/rollout ordering, and recovery guidance when applicable.
- An explicit statement that external review is pending and the PR has not been merged.

Do not merge, enable auto-merge, approve on behalf of the external reviewer, deploy, or apply hosted migrations. Even passing external CI does not change that stopping point. Return the PR URL, branch/commit, verification summary, and any pending external checks. Leave external review and merge decisions to the repository's authorized reviewers. A later explicit user instruction is a separate task with its own authority and gates.

If the workspace lacks Git metadata, a usable remote, credentials, or permission to publish, finish the authorized local changes and prepare a local PR title/body plus the exact missing prerequisite. Report the PR handoff as incomplete; do not invent a URL, initialize Git merely for bookkeeping, or claim an open PR. A failed required local check leaves the candidate `FIX` or `INCOMPLETE`; a draft PR alone cannot convert that into acceptance.

For inspection-only tasks, return the review report without authoring migrations, commits, or a PR unless the user separately requests those actions. Local acceptance and `releaseAuthorized: false` remain separate from the PR's existence.
