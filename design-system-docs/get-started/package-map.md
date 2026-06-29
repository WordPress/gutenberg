# Package map

## Public design-system packages

| Package | Role | Status notes |
| --- | --- | --- |
| `@wordpress/theme` | Design tokens, ThemeProvider, stylelint/build tooling, token artifacts. | Experimental package; some APIs remain private for bundled-package compatibility. |
| `@wordpress/ui` | Token-driven React components for the design system. | Experimental npm package, not a `window.wp` WordPress script. |
| `@wordpress/dataviews` | Dataset views, picker flows, and data editing forms. | Public package that currently depends on components/theme styles. |
| `@wordpress/admin-ui` | Admin page layouts and admin theme color helpers. | Public package, but its future surface is expected to become more focused. |
| `@wordpress/icons` | Shared icon library. | Public package used by component controls and app surfaces. |

`@wordpress/components` remains important for WordPress screens and existing plugin compatibility. It is the older bundled component package. New design-system work should prefer `@wordpress/ui` when the new package has the needed primitive and the consumer can accept its experimental status.

## Choosing the right package

- Need a semantic style value? Use `@wordpress/theme` tokens.
- Need a generic primitive? Prefer `@wordpress/ui`.
- Need a WordPress admin page shell? Use `@wordpress/admin-ui`.
- Need a table/grid/list browser with filters and actions? Use `@wordpress/dataviews`.
- Need to work in an existing bundled WordPress script context? Check whether `@wordpress/components` is still the correct dependency.

## Sources

- [Reference-site page snapshot](../_sources/reference-site/pages.json)
- [@wordpress/components README](../../packages/components/README.md)
- [@wordpress/dataviews README](../../packages/dataviews/README.md)
- [Missing packages in Storybook intro, PR #77504](../_sources/github/threads/pr-77504.md)
