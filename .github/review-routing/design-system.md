---
team: WordPress/gutenberg-components
---

Should the design system team review this change? Answer yes when the change does one or more of these:

- Adds or changes a public API of the design system packages `@wordpress/components`, `@wordpress/ui`, `@wordpress/theme`, `@wordpress/base-styles` or `@wordpress/icons`, such as a component, a prop, an export, an icon, a Sass mixin or a design token.
- Replaces or migrates the design system components that interface code uses, such as moving from `@wordpress/components` to `@wordpress/ui`, or adds tooling such as a lint rule to support that migration.
- Keeps the styles of a component in `@wordpress/components` consistent with the equivalent component in `@wordpress/ui`.
- Adds or changes documentation of the design system, such as usage guidance for its components or a showcase of its design tokens.
- Builds interface UI by hand when a component from `@wordpress/components` or `@wordpress/ui` could provide it.
- Changes how interface UI uses design tokens, colors, spacing or typography.
- Implements a documented design system pattern: destructive actions, error messages, save and submit, or copy to clipboard.

Answer no in all other cases, for example when the change only updates dependencies, tooling, tests, types or build configuration, or only changes the internal implementation or styles of a component, even if it touches files in the design system packages.
