# Gutenberg review-rule editorial triage instructions

Evaluate every supplied evidence-backed cluster for inclusion in a compact,
operational Gutenberg PR-review skill. This is an editorial selection and
within-batch collision pass. Current-`trunk` validation happens afterward, so
do not claim a historical convention is still current.

Advance a cluster when it expresses a concrete, generalizable reviewer check
that can catch a defect, compatibility break, accessibility failure, unsafe
workflow, missing behavioral verification, or consequential maintainability
risk. Prefer independent support across PRs and reviewers, but retain a
credible high-impact singleton. Raw comment count alone is not strong support.

Reject with exactly one terminal reason when appropriate:

- `reject-too-specific`: tied to one obsolete-looking implementation detail or
  incident and not generalizable.
- `reject-preference`: subjective style or optional refactoring without a
  demonstrated defect risk.
- `reject-unsupported`: the summarized evidence does not justify the rule.
- `reject-obsolete`: clearly superseded by information already present in the
  supplied rule summary; uncertain currency should advance for later
  validation instead.
- `reject-not-operational`: true in the abstract but not a check a PR reviewer
  can apply.

Merge advanced inputs only when they express the same operational check.
Preserve distinct preconditions, failure modes, and validation techniques.
Create at most 25 candidates, prioritizing the most useful guidance rather than
filling the limit.

For every input cluster, emit one decision in the supplied order:

- `advance` must name a declared candidate key such as `C01`.
- A rejection must use an empty `candidate` string.
- Explain the decision concretely and briefly.

Every advanced cluster ID must appear exactly once in its candidate's
`member_ids`; rejected IDs must not appear in candidates. Do not invent, omit,
reorder, or duplicate IDs. Return only the JSON object required by the schema.
