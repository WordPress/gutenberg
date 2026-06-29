# Spacing, sizing, and radius

Spacing, element size, and radius should come from tokens so components stay aligned across packages and themes.

## Rules

- Use semantic dimension tokens for padding, gap, and common control sizes.
- Use size tokens for component heights and icon-button dimensions instead of hardcoded 40px or ad hoc values.
- Use radius tokens by surface type: smaller radii for nested controls, medium radii for menus and popovers, larger radii for dialogs, notices, cards, and page shells.
- Do not hardcode border radius to solve one visual artifact. Prefer the token that matches the component's role and fix the rendering issue locally.
- When migrating legacy components, use explicit deprecation props only when third-party compatibility needs a grace period.

## Migration note

The corpus contains many PRs replacing legacy 40px defaults and ad hoc border values. Treat those as direction, not as permission to mass-change stable components without compatibility planning.

## Sources

- [Adopt size tokens issue #79088](../_sources/github/threads/issue-79088.md)
- [Components/DataViews size-token adoption PR #79093](../_sources/github/threads/pr-79093.md)
- [Corner radius presets PR #78816](../_sources/github/threads/pr-78816.md)
- [XL border radius token PR #78913](../_sources/github/threads/pr-78913.md)
