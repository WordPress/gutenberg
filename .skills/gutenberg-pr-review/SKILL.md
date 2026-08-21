---
name: gutenberg-pr-review
description: Review WordPress/Gutenberg pull requests, branches, or diffs for project-specific correctness, compatibility, accessibility, data-lifecycle, block, PHP/REST, testing, tooling, documentation, and release risks. Use for pre-submit reviews, PR review comments, or checking a proposed Gutenberg change against recurring maintainer concerns.
---

# Gutenberg PR Review

Review the change, not a generic checklist. Load only the references relevant to
the touched areas, verify each suspected problem against the actual diff and
current repository, and report only actionable findings.

## Establish scope

1. Read the PR description, linked issue, testing instructions, diff, and
   changed-file list. If only a branch is supplied, compare it with the
   repository's configured base.
2. Identify the stated behavior and affected contracts: runtime, public API,
   serialized content, accessibility, package output, REST schema, generated
   files, documentation, or release state.
3. Inspect surrounding implementation, tests, package metadata, and governing
   contributor documentation before declaring a convention.
4. Treat repository `AGENTS.md` instructions as authoritative. Do not replace
   them with historical review patterns.

For a GitHub PR:

```bash
gh pr view <number> --repo WordPress/gutenberg
gh pr diff <number> --repo WordPress/gutenberg
```

For a local branch:

```bash
git diff <base>...<branch>
git log <base>..<branch> --oneline
```

## Load focused guidance

Read the directly relevant files; combine them for cross-cutting changes.

- UI components, interaction, keyboard, focus, styles, responsive behavior,
  localization: [references/ui-accessibility.md](references/ui-accessibility.md)
- React hooks, `@wordpress/data`, async work, entities, preferences,
  performance: [references/react-data-lifecycle.md](references/react-data-lifecycle.md)
- Package layering, exports, public APIs, blocks, saved markup, compatibility:
  [references/packages-apis-compatibility.md](references/packages-apis-compatibility.md)
- PHP, REST routes and schemas, permissions, sanitization, escaping:
  [references/php-rest-schema.md](references/php-rest-schema.md)
- Workspaces, dependencies, builds, CI, generated artifacts, releases:
  [references/tooling-ci-release.md](references/tooling-ci-release.md)
- Tests, changelogs, documentation, fixtures, snapshots, delivery evidence:
  [references/testing-docs-delivery.md](references/testing-docs-delivery.md)

## Review method

Follow changed values and state across their complete lifecycle:

```text
input → validation → state/store → serialization or request
      → async completion/error → rendered output → cleanup/recovery
```

At each affected boundary, check:

- whether absent, empty, `false`, `null`, and `undefined` retain their intended
  meanings;
- whether authorization and validation occur before side effects;
- whether loading, empty, success, failure, cancellation, and retry states are
  distinguishable;
- whether old public consumers or stored content remain valid;
- whether keyboard, pointer, screen-reader, RTL, narrow-viewport, and reduced
  motion behavior remains equivalent where relevant;
- whether tests exercise observable behavior and would fail without the fix;
- whether metadata, types, docs, changelogs, generated output, and published
  artifacts agree with runtime behavior.

Search for existing helpers, analogous implementations, public consumers, and
fixtures before suggesting a new abstraction or claiming a break. Check both
editor and frontend behavior for block/style changes.

## Finding threshold

Report a finding only when the diff introduces or exposes a concrete defect,
compatibility risk, missing consequential verification, unsafe workflow, or
material maintainability problem.

- Cite the changed file and line.
- Explain the failure scenario and affected user or consumer.
- State the smallest credible remedy or the verification needed.
- Distinguish a must-fix issue from a non-blocking improvement.
- Phrase uncertain issues as a focused question and say what evidence is
  missing.
- Do not report personal style preferences, speculative generalities,
  pre-existing problems outside the change, or requirements contradicted by
  current repository evidence.
- Avoid duplicate findings when one root cause explains several symptoms.

## Output

Lead with findings ordered by severity. Use:

```markdown
### Must fix

- `path/file.js:42` — Concise defect title. Explain the failing path, impact,
  and required correction.

### Should fix

- `path/file.js:87` — Concrete non-blocking risk and proportionate remedy.
```

Omit empty severity sections. After findings, optionally include a short
summary and residual testing risks. If there are no findings, say so directly
and name any meaningful verification gap.

## Evidence provenance

This guidance was distilled from a frozen audit of every Gutenberg PR and its
review/discussion artifacts through PR #80540: 47,037 PRs (35,935 merged,
8,654 closed without merge, and 2,448 open), 561,837 artifacts collected, and
233,370 substantive human-authored artifacts individually audited. The audit
produced 133,803 candidate findings; multi-pass consolidation and editorial
triage produced 127 candidate rules.

Those candidates were validated against `origin/trunk` commit
`49120c3204955ba1f83c7224793f52813689e7e1` on 2026-07-28, then delta-checked
and updated through commit `03a6675a25ede7f8e31e5232742615f95358bcb6`.
Historical review evidence establishes recurrence, not present-day truth;
current code and repository instructions always win.
