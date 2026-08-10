## Status

`@wordpress/ui` is the home for design system components. The package includes many common UI components, though equivalents may still live in `@wordpress/components`; see the [`use-recommended-components` ESLint rule](../eslint-plugin/rules/use-recommended-components.js) for which to use.

Full guidance lives in [CONTRIBUTING.md](./CONTRIBUTING.md). The points below summarize how code in this package should be written.

## Scope

-   Add a component here only when it is generic and reusable in building admin interfaces. If it can live in a higher-level package or one scoped to a particular feature (`admin-ui`, `block-editor`, `dataviews`, etc.), it should.
-   Prefer composing existing `@wordpress/ui` components over bespoke markup and styles.

## Styling

-   Use semantic `--wpds-*` tokens for visual values; avoid hardcoded colors, spacing, and arbitrary consumer-facing value props. See [Design principles](./CONTRIBUTING.md#design-principles).
-   Match token families to semantics: `interactive` for clickable UI, `content` for static text; use state variants (`-active`, `-disabled`) rather than mixing tones across states.
-   Do not ship outer margins on component roots. Consumers should provide their own spacing.
-   Follow the [CSS layer pattern](./CONTRIBUTING.md#css-layers) and the [custom property / state rules](./CONTRIBUTING.md#custom-properties-and-state-styles).
-   Style disabled states with `[data-disabled]` for Base UI components. See [Disabled state styling](./CONTRIBUTING.md#disabled-state-styling).
-   Respect `prefers-reduced-motion` when adding motion animation. See [Design principles](./CONTRIBUTING.md#design-principles).
-   Apply [global CSS defense](./CONTRIBUTING.md#global-css-defense-wp-admin) classes when rendering native elements affected by wp-admin global styling.

## Code conventions

-   Follow the [folder structure](./CONTRIBUTING.md#folder-structure) and [public API rules](./CONTRIBUTING.md#public-apis).
-   Use [compound components](./CONTRIBUTING.md#compound-components) and the [`render` prop patterns](./CONTRIBUTING.md#render-prop-and-ref-forwarding).
-   Use `ComponentProps` from `../utils/types` for wp-ui components; do not export prop types — use `React.ComponentProps< typeof Component >`.
-   Use `forwardRef`, named function expressions, and `displayName` on subcomponents.
-   Add Storybook stories under `Design System/Components/`.
