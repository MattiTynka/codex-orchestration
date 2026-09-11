# Fresh security assessment packet

Replace all bracketed fields before launching. This packet is task input, not evidence that review happened.

Assignment: Independently assess the production candidate against the authorized requirements. Assess both correctness and security if listed in the brief. Inspection only: do not edit or spawn agents/model sessions.

Target repository: [absolute repository path]
Target source digest and revision: [digest; branch or commit]
Final diff and pinned base: [diff path or base/candidate revisions; include migrations when applicable]
Original requirements and security constraints: [source paths or concise original requirements]
Frozen brief path and SHA-256: [absolute path; hash]
Verification artifacts: [absolute run path and relevant full logs]
Relevant entrypoints/callers/configuration: [paths; permission to read surrounding code]
Authorized test environment and restrictions: [synthetic environment; no production credentials; permitted commands]
Known limitations/baseline failures: [facts, not builder conclusions]

Use gpt-6-astra at high reasoning as configured by the launcher. Report actual runtime model/effort if observable; otherwise record null and the observation gap. Assess real attack paths and required denial behavior, including abuse and paid-resource limits when applicable. A scanner's no-findings result applies only to its examined scope.

Assess independently from original requirements, the final diff, surrounding source, and verification evidence. Do not inherit the coding conversation or receive the author's explanation of why the code is correct in the initial packet. Review existing final test evidence before running additional tests; rerun only for a concrete unresolved question or a required gate. For each finding report location, scenario, prerequisites, impact/severity, evidence, uncertainty, and violated requirement ID. Also report files actually read, coverage IDs, blocked checks, and unexamined surfaces. Return ACCEPT, FIX, RETHINK, or INCOMPLETE with target source/brief hashes and remaining gaps. No finding quota. Local acceptance leads to a PR for external review. Do not merge, enable auto-merge, deploy, or apply hosted migrations.
