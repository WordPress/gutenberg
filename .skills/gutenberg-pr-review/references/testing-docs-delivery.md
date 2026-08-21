# Tests, documentation, changelogs, and delivery evidence

Use this reference when behavior, fixtures, snapshots, generated documentation,
package changelogs, PR testing instructions, or release notes are affected.

## Behavioral verification

- Add proportionate coverage for changed behavior, likely errors, and
  materially different empty, null, enabled, disabled, and boundary inputs.
- Make a bug regression test fail on the base revision and pass with the fix.
- Assert observable user behavior rather than incidental implementation. Guard
  explicitly against false positives and false negatives.
- Prefer `user-event` and accessible `getByRole` queries for UI tests. Scope
  locators to the intended region and rely on strict lazy locators.
- In Playwright, use web-first assertions and `expect.poll` for changing state
  rather than eager element handles or arbitrary waits.
- Test block UI at the integration layer where possible; reserve E2E tests for
  behavior that requires a full browser environment.
- Establish state in setup hooks and restore it in teardown that runs after
  assertion failures. Use supported API utilities for repeated E2E setup while
  retaining a user-driven test for the workflow itself.
- For changed visuals, include useful before/after evidence and exercise
  overflow, long content, empty states, and narrow viewports where relevant.

## Canonical commands and governed files

- Run the applicable repository lint, build, type-check, and focused test
  commands against the final change. Do not claim broad coverage from an
  unrelated green check.
- Regenerate fixtures, snapshots, schemas, docs, and metadata with their
  repository-provided commands. Review the generated diff and verify a second
  generation is clean.
- For handbook changes, synchronize Markdown with `docs/toc.json`, run
  `npm run docs:build`, commit `docs/manifest.json`, and use repository-absolute
  links that work in the handbook, GitHub, and npm contexts.

## Changelogs and release communication

- For each relevant package change—including production code, shipped
  dependencies, public or private API changes, and material package
  documentation—add an entry under `Unreleased`, link the PR, and classify it
  under the appropriate release subsection. Omission is acceptable only when
  the package's optional changelog check and repository evidence establish
  that the change is too small to warrant an entry.
- Update public API docs, examples, types, migration notes, and Dev Notes when
  third-party behavior changes. Documentation must describe the final shipped
  behavior, not an earlier review iteration.
- Keep the PR description and testing instructions synchronized with the final
  diff. State which environments and interaction paths were actually tested.
- Curate generated plugin release notes for accurate categories, reverted work,
  and changes excluded from that distribution.
