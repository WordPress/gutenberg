---
name: wp-theme
description: Use when styling an interface with WordPress Design System design tokens (`--wpds-*` CSS custom properties), replacing legacy color variables, or setting up `ThemeProvider` from `@wordpress/theme`.
compatibility: "Use `@wordpress/theme` in a JavaScript or TypeScript project. Node.js 22.13 or later is needed to run its tools."
---

# Style with `@wordpress/theme`

This skill ships with the `@wordpress/theme` package and matches the installed version. For components, use the `wp-ui` skill from `@wordpress/ui`.

## Choose tokens

-   Prefer a component's props when they already express the styling intent. Use tokens for styles that no component covers.
-   Use `--wpds-*` tokens instead of fixed hex colors, pixel font sizes, radii, shadows or motion values.
-   Pick the token by its semantic role and state, such as the property, the kind of element and the tone, and not by the nearest raw value. Two tokens with the same value in one theme are not interchangeable.
-   Do not copy token names from memory. Look them up as described below, and check every token you write.
-   Find tokens by searching the bundled reference instead of reading all of it. From this skill's directory, run `grep -i '<terms>' references/tokens.md`, for example `grep -i 'background.*brand' references/tokens.md`. Each matching row has the token name and its meaning.
-   Read the bundled [token reference](references/tokens.md) for how to pick a token and for the full list.
-   Check the tokens you wrote by running the project's linters, which report any `--wpds-*` token that does not exist in the installed `@wordpress/theme`: Stylelint with the `plugin-wpds/no-unknown-ds-tokens` rule for CSS, and ESLint with the `@wordpress/no-unknown-ds-tokens` rule for tokens in JavaScript. The `wp-theme-setup` skill describes how to enable both. Run the project's installed linters, for example `npm exec --no -- stylelint <files>`, `pnpm exec stylelint <files>` or `yarn stylelint <files>`, and not a bare `npx`, which downloads a package that is not installed. The reports only say that a token is unknown, so use the search above to find the right one. If the linters are not set up, check that the exact name appears in the bundled reference, for example with `grep -c -- '--wpds-border-radius-md' references/tokens.md`.
-   When available, the Design System MCP server's `get_design_tokens` tool returns the same kind of guidance as the bundled reference. The MCP server can describe a later version of the design system than the installed `@wordpress/theme`, so a token it returns may not exist in the installed version. Always confirm each token against the bundled reference or the project's linters, which match the installed package.
-   Do not replace every CSS literal. A value that is not a design decision, such as a one-off layout measurement, does not need a token.
-   Use `--wp--preset--*` custom properties, not `--wpds-*`, when styling blocks or content previews with the active theme's `theme.json` presets.

## Replace legacy styles

-   Do not add legacy Sass color variables, such as the `@wordpress/base-styles` palette (`$gray-700`, `$alert-red`, `$white`), or `--wp-admin-*` custom properties. Use the `--wpds-*` equivalent chosen by semantic role.
-   When you touch a style that uses a legacy variable, replace it with a token. Check the result in light and dark themes, and nested providers if you use them.

## Use `ThemeProvider`

For loading the tokens stylesheet and for linters and build-time fallbacks, use the `wp-theme-setup` skill. For `ThemeProvider` props, nesting, light and dark themes, and use across iframes and portals, read the **Theme Provider** section of the `README.md` in the installed `@wordpress/theme` package and follow it. Check that a popup rendered outside your provider still receives the tokens, because tokens follow the DOM tree.
