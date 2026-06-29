# Contributing to the system

Design-system changes should make the system easier to use consistently. A contribution is not ready because it adds an option; it is ready when it clarifies which option should be used.

## What good changes include

- A clear use case and a short explanation of why existing components or tokens are insufficient.
- Storybook examples that show the recommended path, not just every possible prop combination.
- Usage guidance for ambiguous decisions, especially status intent, icon-only actions, overlays, and form errors.
- Accessibility notes for keyboard, focus, labelling, and announcements when behavior changes.
- Package-boundary justification when a change crosses `theme`, `ui`, `components`, `admin-ui`, or `dataviews`.

## What to avoid

- New hardcoded color, radius, spacing, or motion values when a semantic token exists.
- New public APIs that are only needed by one product-specific workflow.
- Stabilizing experimental APIs before bundled-package compatibility has been checked.
- Documentation that repeats package READMEs instead of explaining decisions.
- Rules based on a single unresolved issue. Mark those as open decisions or leave them out.

## Source material hygiene

The raw GitHub corpus contains bot comments, CI output, tentative proposals, and back-and-forth review ideas. Use it as research, not as final documentation. Prefer merged PRs, current package READMEs, and repeated agreement across issues when writing rules.

## Sources

- [Badge usage-guidance PR #79585](../_sources/github/threads/pr-79585.md)
- [ThemeProvider stable API revert, PR #79594](../_sources/github/threads/pr-79594.md)
- [CSS module discussion, PR #79490](../_sources/github/threads/pr-79490.md)
