# Theme Build Tools

Build plugins and Stylelint plugins for the WordPress Design System design tokens provided by [`@wordpress/theme`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/theme/README.md).

-   The [Stylelint plugins](#stylelint-plugins) validate `--wpds-*` design token usage in CSS.
-   The [build plugins](#build-plugins) inject the generated fallback values into `var(--wpds-*)` references, for PostCSS, Lightning CSS, esbuild, and Vite.

The token names and fallback values come from the `@wordpress/theme` package installed in your project, so they always match the design tokens stylesheet it ships. `@wordpress/theme` is an optional peer dependency: without it, the plugins leave your code unchanged and the Stylelint rule for unknown tokens is skipped.

## Installation

```sh
npm install @wordpress/theme-build-tools --save-dev
```

Install the tool you use the plugins with (`stylelint`, `postcss`, `lightningcss`, `esbuild`, or `vite`) as well; they are optional peer dependencies.

The package's entrypoints are ESM-only and require Node.js `^20.19.0` or `>=22.13.0`. Use `import` syntax from ESM or TypeScript configuration files.

## Stylelint Plugins

These rules validate design token usage in CSS. Enable them in your Stylelint configuration:

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

### `plugin-wpds/no-unknown-ds-tokens`

Reports references to unknown `--wpds-*` tokens.

### `plugin-wpds/no-setting-wpds-custom-properties`

Reports definitions or overrides in the `--wpds-*` namespace.

### `plugin-wpds/no-token-fallback-values`

Reports manual fallbacks that can drift from the generated values.

## Build Plugins

The build plugins inject generated fallbacks into bare `var(--wpds-*)` references so components still render when the design tokens stylesheet is unavailable. For example, `var(--wpds-color-foreground-content-neutral)` becomes `var(--wpds-color-foreground-content-neutral, #1e1e1e)`.

`@wordpress/build` already applies these plugins automatically when `@wordpress/theme` is installed. You only need to configure them manually for custom build setups.

| Export                                                                  | Tool          | Scope |
| ----------------------------------------------------------------------- | ------------- | ----- |
| `@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks`           | PostCSS       | CSS   |
| `@wordpress/theme-build-tools/lightningcss-plugins/lightningcss-ds-token-fallbacks` | Lightning CSS | CSS   |
| `@wordpress/theme-build-tools/esbuild-plugins/esbuild-ds-token-fallbacks`           | esbuild       | JS/TS |
| `@wordpress/theme-build-tools/vite-plugins/vite-ds-token-fallbacks`                 | Vite          | JS/TS |

Existing fallbacks are unchanged. An unknown token in a bare reference in transformed values fails the build.

The JavaScript plugins treat token references in string values, JSX attribute values, and static template parts as CSS. This includes tagged templates such as `String.raw`. They leave comments, regular expressions, property names, module paths, JSX text, and TypeScript types unchanged. Token names assembled across template expressions are not resolved. As before, a token reference in a runtime message string is also treated as CSS.

Files the JavaScript parser cannot read are left unchanged for the downstream compiler. To add fallbacks in Vite files that use custom syntax, configure the syntax-stripping plugin with `enforce: 'pre'` and list it before the token fallback plugin.

Both JavaScript plugins preserve source maps. The Vite plugin runs before JavaScript and TypeScript compilation and supports module IDs with query strings. It skips `?raw` and `?url` imports so their exported file contents and URLs stay unchanged.

### PostCSS

```js
// postcss.config.mjs
import dsTokenFallbacks from '@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks';

export default {
	plugins: [ dsTokenFallbacks ],
};
```

### Lightning CSS

```js
import { transform, composeVisitors } from 'lightningcss';
import dsTokenFallbacks from '@wordpress/theme-build-tools/lightningcss-plugins/lightningcss-ds-token-fallbacks';

const { code } = transform( {
	filename: 'styles.css',
	code: Buffer.from( css ),
	visitor: composeVisitors( [ dsTokenFallbacks ] ),
} );
```

The visitor preserves CSS Modules [`from global`](https://lightningcss.dev/css-modules.html#local-css-variables) references such as `var(--wpds-dimension-gap-sm from global)` when it adds a fallback. Custom properties inside generated fallbacks, including `--wp-admin-*` variables, also remain global so admin overrides still apply.

### esbuild

```js
import dsTokenFallbacks from '@wordpress/theme-build-tools/esbuild-plugins/esbuild-ds-token-fallbacks';

await esbuild.build( {
	plugins: [ dsTokenFallbacks ],
	// …
} );
```

### Vite

The Vite setup uses both the Vite plugin (for JS/TS) and the PostCSS plugin (for CSS):

```ts
// vite.config.ts
import dsTokenFallbacks from '@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks';
import dsTokenFallbacksJs from '@wordpress/theme-build-tools/vite-plugins/vite-ds-token-fallbacks';

export default defineConfig( {
	plugins: [ dsTokenFallbacksJs() ],
	css: {
		postcss: {
			plugins: [ dsTokenFallbacks ],
		},
	},
} );
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
