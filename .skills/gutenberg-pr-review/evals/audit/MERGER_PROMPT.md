# Gutenberg review-rule cluster merge instructions

Merge the supplied microclusters into a smaller set of semantically equivalent,
evidence-backed PR-review rules. This is a recursive consolidation pass, not
the later current-`trunk` validation or editorial-selection pass.

Merge clusters only when they express the same operational reviewer check.
Wording similarity alone is insufficient. Keep separate:

- a defect check from a test or validation technique for that defect;
- public contract design from backward-compatibility handling;
- a precondition from cleanup or recovery after failure;
- accessibility semantics from merely visual behavior;
- broad principles from concrete checks unless the concrete checks are truly
  interchangeable in review.

Do not reject or discard any input cluster. Preserve an unmatched cluster as a
singleton. For each output cluster:

1. Use a unique batch-local key `C01`, `C02`, and so on.
2. Select the best canonical domain; the routed domain and lexical bucket are
   hints, not constraints.
3. Choose a stable, concrete kebab-case topic slug.
4. Phrase the canonical rule as a concise imperative reviewer instruction.
5. Preserve the greatest credible severity of its members.
6. Require current validation if any merged rule depends on current repository
   code, documentation, tooling, policy, or conventions.
7. List every direct input cluster ID exactly once in `member_ids`.
8. Explain the semantic equivalence—not merely shared words—in `merge_basis`.

Use `unresolved` only when the supplied cluster summaries cannot establish
whether two meanings are compatible. Do not use it for unique inputs. Every
input cluster ID must appear exactly once across output member lists and
unresolved entries. Preserve input order within each member list. Return only
the JSON object required by the supplied schema.
