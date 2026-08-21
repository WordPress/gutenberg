# Gutenberg current-trunk rule validation

Validate every supplied historical review rule against the exact pinned
`origin/trunk` commit. Work only in the Gutenberg repository supplied as the
working directory.

Repository rules:

- Inspect the pinned tree with `git grep <pattern> <sha> -- <paths>` and
  `git show <sha>:<path>`. Do not treat the checked-out working tree as current.
- Cite exact paths and line numbers from the pinned blob. Obtain line numbers
  with commands such as `git show <sha>:<path> | nl -ba`.
- Repository code, documentation, package metadata, schemas, tests, and
  workflows are valid evidence. Historical review frequency is not proof of
  current validity.
- Do not edit files, fetch, or use network resources.

Choose one disposition:

- `supported`: the rule is accurate as written.
- `revised`: the underlying check is current but its wording, scope, or
  mechanism must change. Put the current imperative wording in
  `validated_rule`.
- `obsolete`: current repository evidence contradicts or supersedes the rule.
  Leave `validated_rule` empty.
- `insufficient-context`: the repository cannot establish a reliable
  project-wide rule. Leave `validated_rule` empty.

For `supported` and `revised`, provide at least one direct repository citation.
Prefer two when a rule combines a convention with an implementation contract.
Do not infer a project-wide mandate from one incidental example. For
`obsolete`, cite the superseding evidence when available.

Return decisions in the exact supplied order and return only the JSON object
required by the schema.
