---
name: wp-theme-setup
description: Use when setting up WordPress Design System tokens in a project: installing `@wordpress/theme`, loading the tokens stylesheet, configuring the Stylelint and ESLint token rules from `@wordpress/theme-build-tools` and `@wordpress/eslint-plugin`, and adding token fallback values automatically at build time.
---

# Set up design tokens in a project

This skill ships with the `@wordpress/theme` package and matches the installed version. To choose tokens once the project is set up, use the `wp-theme` skill.

Inspect the project first: its package manager, its bundler (PostCSS, Lightning CSS, esbuild, Vite, or `@wordpress/build`), and its Stylelint and ESLint configuration. Change only what is missing, and do not duplicate setup that already exists.

## 1. Install and load the tokens

-   Install `@wordpress/theme` and check its Node.js requirement (`>=22.13.0`). Its JavaScript entrypoints are ESM-only, so use `import` syntax in configuration files.
-   In standard WordPress admin and editor screens, WordPress loads the stylesheet as the `wp-theme` style handle (since WordPress 7.1). Do not bundle it there or add setup of your own. Before 7.1, check which version of the tokens your minimum supported WordPress provides.
-   For a separate app shell, an iframe or a popup window inside WordPress, enqueue `wp-theme` as a style dependency in that document instead of bundling `@wordpress/theme/design-tokens.css`.
-   Outside WordPress, import `@wordpress/theme/design-tokens.css` once per document, including each iframe or popup window that renders content.

## 2. Lint token usage

Install `@wordpress/theme-build-tools` and `@wordpress/theme` as development dependencies, plus `stylelint` if the project does not have it. Enable the Stylelint plugins in the Stylelint configuration:

```json
{
	"plugins": [
		"@wordpress/theme-build-tools/stylelint-plugins/no-unknown-ds-tokens",
		"@wordpress/theme-build-tools/stylelint-plugins/no-setting-wpds-custom-properties",
		"@wordpress/theme-build-tools/stylelint-plugins/no-token-fallback-values"
	],
	"rules": {
		"plugin-wpds/no-unknown-ds-tokens": true,
		"plugin-wpds/no-setting-wpds-custom-properties": true,
		"plugin-wpds/no-token-fallback-values": true
	}
}
```

-   `no-unknown-ds-tokens` reports `--wpds-*` tokens that do not exist in the installed `@wordpress/theme`.
-   `no-setting-wpds-custom-properties` reports definitions or overrides in the `--wpds-*` namespace. Use `ThemeProvider` to change token values.
-   `no-token-fallback-values` reports hand-written fallbacks that can drift from the generated ones. Remove them and rely on step 3.

For tokens written in JavaScript, such as inline styles or CSS in template strings, use the `@wordpress/no-unknown-ds-tokens` and `@wordpress/no-setting-ds-tokens` rules from `@wordpress/eslint-plugin`. They are part of its `recommended` configuration. If the project enables ESLint rules individually, turn them on explicitly.

Run the linters on the whole project, fix the reports, and then add the checks to the project's lint script and CI.

## 3. Add token fallback values at build time

The build plugins add the generated fallback to every bare `var(--wpds-*)` reference, so components still render when the tokens stylesheet is not loaded. For example, `var(--wpds-color-foreground-content-neutral)` becomes `var(--wpds-color-foreground-content-neutral, #1e1e1e)`. Existing fallbacks are unchanged, and an unknown token in a bare reference fails the build.

-   Projects that build with `@wordpress/build` already get the plugins. Do not add them again.
-   For a custom build, add the plugin that matches the tool. For CSS, use `postcss-plugins/postcss-ds-token-fallbacks` for PostCSS or `lightningcss-plugins/lightningcss-ds-token-fallbacks` for Lightning CSS. For tokens in JavaScript or TypeScript, use `esbuild-plugins/esbuild-ds-token-fallbacks` for esbuild or `vite-plugins/vite-ds-token-fallbacks` for Vite. All are exported from `@wordpress/theme-build-tools`.
-   With Vite, use both the Vite plugin for JavaScript and TypeScript and the PostCSS plugin for CSS.

```js
// postcss.config.mjs
import dsTokenFallbacks from '@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks';

export default {
	plugins: [ dsTokenFallbacks ],
};
```

```ts
// vite.config.ts
import dsTokenFallbacks from '@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks';
import dsTokenFallbacksJs from '@wordpress/theme-build-tools/vite-plugins/vite-ds-token-fallbacks';

export default defineConfig( {
	plugins: [ dsTokenFallbacksJs() ],
	css: { postcss: { plugins: [ dsTokenFallbacks ] } },
} );
```

-   For esbuild, add `plugins: [ dsTokenFallbacks ]` to the `esbuild.build()` options.

## 4. Verify

Run the build and check the output for a token reference: it should now have a fallback value. Introduce a misspelled token in a scratch file and confirm that Stylelint reports it, then remove the file. Report any step you could not run.
