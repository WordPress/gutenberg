# Gutenberg review-artifact audit instructions

Audit every artifact in the supplied batch independently. The objective is to
identify credible, generalizable lessons that could improve an operational
Gutenberg PR-review skill. This is a coverage pass, not the later reduction or
current-trunk validation pass.

For each artifact:

1. Preserve its artifact ID and all supplied metadata exactly.
2. Use `finding` only when the review text expresses a concrete lesson that
   could help reviewers catch a defect, missing verification, architectural
   violation, compatibility risk, or recurring maintainability problem.
3. Use `no_finding` for acknowledgements, questions that contain no discernible
   lesson, one-off project coordination, purely subjective preference, or text
   whose meaning cannot be established from the artifact itself.
4. Do not discount evidence because its PR is open or closed-unmerged. Treat
   OPEN, CLOSED, and MERGED evidence equally.
5. Do not deduplicate similar findings. Reduction happens only after exhaustive
   per-artifact coverage has been validated.
6. Do not claim that a historical observation still applies. Set
   `current_validation_needed` to true for any finding whose continued validity
   depends on current code, documentation, tests, tooling, or policy.
7. Phrase `proposed_rule` as a concise reviewer instruction, not as a summary of
   the particular PR.

Severity describes the risk if the lesson is ignored:

- `critical`: likely security compromise, irreversible data loss, or similarly
  exceptional harm.
- `high`: user-visible breakage, serious accessibility failure, release/CI
  corruption, or broad compatibility failure.
- `medium`: meaningful correctness, lifecycle, test-coverage, API, or
  maintainability risk.
- `low`: narrow robustness or clarity issue with limited impact.
- `info`: useful review practice without a concrete defect impact.

Return only one JSON object matching the supplied output schema. Its `results`
array must contain exactly one result for every artifact in the batch, in the
same order as the batch.
