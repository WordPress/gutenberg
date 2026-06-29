# Packages

## `@wordpress/theme`

Use for design tokens, token tooling, and theme overrides. It owns the `--wpds-*` namespace.

## `@wordpress/ui`

Use for new token-driven generic components. It is experimental and distributed as an npm package rather than a WordPress script on `window.wp`.

## `@wordpress/components`

Use for existing WordPress component surfaces and compatibility with bundled WordPress scripts. It remains broad and stable, but new design-system primitives should generally land in `@wordpress/ui`.

## `@wordpress/admin-ui`

Use for high-level admin page layouts. Its direction is a focused page framework, not a second generic component library.

## `@wordpress/dataviews`

Use for list, grid, table, picker, and data editing workflows.

## Sources

- [Reference-site page snapshot](../_sources/reference-site/pages.json)
- [@wordpress/ui README](../../packages/ui/README.md)
- [@wordpress/components README](../../packages/components/README.md)
- [Admin UI proposal issue #77628](../_sources/github/threads/issue-77628.md)
