# Components

`@wordpress/components` is the legacy WordPress component library. It remains essential for WordPress compatibility, but it is not the new token-first design-system surface.

## Rules

- Load `@wordpress/components/build-style/style.css` when using the package outside WordPress.
- Preserve public `components-*` classes where third-party consumers may rely on them.
- New components should use SCSS Modules and token-based styles.
- Legacy components may migrate gradually; do not remove stable style behavior without a compatibility path.
- Prefer `React.ComponentProps<typeof Component>` when consumers need prop types; many component prop types are not separately exported.

## Relationship to UI

Use `@wordpress/ui` for new generic design-system primitives when available. Use `@wordpress/components` for existing WordPress bundled contexts and components that have not migrated.

## Sources

- [@wordpress/components README](../../../packages/components/README.md)
- [Components contributing guide](../../../packages/components/CONTRIBUTING.md)
- [Components design-system descriptions PR #79460](../../_sources/github/threads/pr-79460.md)
