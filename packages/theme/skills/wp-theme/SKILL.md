---
name: wp-theme
description: Use when styling an interface with WordPress Design System design tokens (`--wpds-*` CSS custom properties), replacing legacy color variables, or setting up `ThemeProvider` from `@wordpress/theme`.
---

# Style with `@wordpress/theme`

This skill ships with the `@wordpress/theme` package and matches the installed version. For components, use the `wp-ui` skill from `@wordpress/ui`.

## Choose tokens

-   Prefer a component's props when they already express the styling intent. Use tokens for styles that no component covers.
-   Use `--wpds-*` tokens instead of fixed hex colors, pixel font sizes, radii, shadows or motion values.
-   Pick the token by its semantic role and state, such as the property, the kind of element and the tone, and not by the nearest raw value. Two tokens with the same value in one theme are not interchangeable.
-   Verify that the token exists in the installed `@wordpress/theme` version. Do not copy token names from memory.
-   Use the bundled [token reference](references/tokens.md). It explains how to pick a token and lists every semantic token with its meaning. When available, the Design System MCP server's `get_design_tokens` tool returns the same guidance.
-   Do not replace every CSS literal. A value that is not a design decision, such as a one-off layout measurement, does not need a token.
-   Use `--wp--preset--*` custom properties, not `--wpds-*`, when styling blocks or content previews with the active theme's `theme.json` presets.

## Replace legacy styles

-   Do not add legacy Sass color variables, such as the `@wordpress/base-styles` palette (`$gray-700`, `$alert-red`, `$white`), or `--wp-admin-*` custom properties. Use the `--wpds-*` equivalent chosen by semantic role.
-   When you touch a style that uses a legacy variable, replace it with a token. Check the result in light and dark themes, and nested providers if you use them.

## Use `ThemeProvider`

For loading the tokens stylesheet and for linters and build-time fallbacks, use the `wp-theme-setup` skill. Once the tokens are loaded:

-   Use one root provider per document. Use nested providers for local overrides, and do not add a root provider for every overlay.
-   A React portal changes where an element is placed in the DOM, and tokens follow the DOM tree. Check that a popup rendered outside your provider still receives the tokens.
