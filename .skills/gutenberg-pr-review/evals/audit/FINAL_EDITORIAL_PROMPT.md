# Gutenberg review-rule final consolidation instructions

Select and merge the strongest operational Gutenberg PR-review rules in this
cross-batch shortlist. Historical evidence supports each input, but current
`trunk` validation happens afterward.

Advance only checks that are concrete, broadly reusable, and likely to catch a
meaningful defect, compatibility break, accessibility failure, unsafe workflow,
or missing behavioral verification. Prefer support from multiple PRs and
reviewers. Retain a singleton only for a credible high-impact failure mode.

Apply exactly one terminal rejection to every input that does not advance:

- `reject-too-specific`: incident- or implementation-specific.
- `reject-preference`: optional style or refactoring preference.
- `reject-unsupported`: evidence does not justify the generalized rule.
- `reject-obsolete`: clearly superseded in the supplied information.
- `reject-not-operational`: not an actionable PR-review check.

Merge advanced inputs only when they express the same operational check. Keep
distinct preconditions, failure modes, and verification techniques separate.
Create at most eight candidates. Do not fill the limit: choose only guidance
strong enough to justify scarce skill context.

For every input, emit one decision in the supplied order. Every advanced ID
must appear exactly once in its declared candidate; rejected IDs must not
appear. Return only the schema-conforming JSON object.
