# Gutenberg review-finding reduction instructions

Reduce every supplied finding into a smaller set of evidence-backed,
generalizable PR-review rules. This is a semantic consolidation pass, not the
later current-`trunk` validation pass.

Cluster findings that express the same underlying reviewer check even when
their wording and source categories differ. Preserve meaningful distinctions
between preconditions, failure modes, and validation techniques. Do not reject
or discard findings in this stage: a finding with no credible semantic peer
must remain as a singleton cluster.

For each cluster:

1. Use a unique batch-local key `C01`, `C02`, and so on.
2. Select the best matching canonical domain from the schema; the batch's
   routed domain is only a hint.
3. Use a stable kebab-case `topic_slug` describing the concrete check.
4. Phrase `canonical_rule` as a concise imperative reviewer instruction.
5. Set severity to the greatest credible impact represented by the members.
6. Set `needs_current_validation` when the rule depends on current repository
   code, documentation, tooling, policy, or conventions.
7. List every supporting finding ID exactly once in `member_ids`.
8. Explain why the members express the same operational check in `merge_basis`.

Use `unresolved` only when the supplied fields cannot establish meaning without
the original comment body or PR diff. Do not use it merely because a finding is
unique. Every supplied finding ID must appear exactly once across all cluster
member lists and unresolved entries. Do not invent, omit, or duplicate IDs.
Return only the JSON object required by the supplied schema.
