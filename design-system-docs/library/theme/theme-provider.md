# ThemeProvider

ThemeProvider applies generated token overrides to a subtree. Use it when a product needs a different primary color, background, cursor style, or corner-radius preset while staying inside the design system.

## Rules

- Load the static design token stylesheet once per document. ThemeProvider overrides are not a replacement for the baseline token stylesheet.
- Use `isRoot` for the top-level provider when portal content in the same document must inherit overrides.
- In iframes or other documents, load the token stylesheet in that document and wrap React content with the correct style provider for that document.
- Seed colors must be sRGB-parseable strings. Do not pass unsupported color spaces.
- Treat corner radius as a preset, not an individual token override.
- Do not document ThemeProvider as a stable public API until the package export boundary says it is stable.

## Portal reminder

ThemeProvider inheritance follows the DOM tree and CSS cascade, not the React tree. Portaled overlays may need root-level overrides to see the intended theme.

## Sources

- [@wordpress/theme README](../../../packages/theme/README.md)
- [ThemeProvider stable API revert PR #79594](../../_sources/github/threads/pr-79594.md)
- [ThemeProvider root corner radius PR #79153](../../_sources/github/threads/pr-79153.md)
- [ThemeProvider background prop rename PR #79007](../../_sources/github/threads/pr-79007.md)
- [sRGB seed-color contract PR #79148](../../_sources/github/threads/pr-79148.md)
