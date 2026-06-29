# Design tokens

Design tokens are the public styling API of the design system. Choose tokens by purpose, not by matching a raw value.

## Rules

- Use semantic `--wpds-*` tokens in component styles. Do not copy token values into component CSS.
- Treat primitive tokens as internal implementation detail. Components and consuming apps should use semantic tokens.
- Do not set or override custom properties in the `--wpds-*` namespace from consuming code.
- Do not add manual fallback values to `var( --wpds-* )` references. Use the build tooling that injects token fallbacks.
- Keep token names descriptive: type, property, target, tone, emphasis, and state should explain why the token exists.
- Use `@wordpress/theme/design-tokens.css` as the static baseline outside WordPress. In WordPress, token styles are enqueued centrally.

## Picking a color token

Choose the property first: background, foreground, stroke, or focus. Then choose target: surface, interactive, content, track, or thumb. Only then choose tone and emphasis.

For example, text inside a passive notice should use a content token. A clickable destructive button should use interactive error tokens. A card border should use a surface stroke token.

## Tooling

Use the stylelint plugins and build plugins from `@wordpress/theme` so token typos, namespace overrides, and manual fallback values are caught before review.

## Sources

- [@wordpress/theme README](../../packages/theme/README.md)
- [Design tokens reference](../../packages/theme/docs/tokens.md)
- [Design tokens maintainer guide](../../packages/theme/tokens/README.md)
- [Token maintainer guide PR #79157](../_sources/github/threads/pr-79157.md)
