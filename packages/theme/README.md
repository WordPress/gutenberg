# Theme

A theming package that's part of the WordPress Design System. It has two parts:

-   **Design Tokens**: A comprehensive system of design tokens for colors, spacing, typography, and more.
-   **Theme System**: A flexible theming provider for consistent theming across applications.

This package is not a WordPress block theme, site theme, or `theme.json` API. It provides the WordPress Design System's design tokens and React theming primitives for JavaScript packages and applications.

## Documentation

This README is the entry point for package consumers. It covers how to load design tokens, use `ThemeProvider`, and configure the package's development tooling.

-   To use design tokens and `ThemeProvider`, start here.
-   To pick the right design token or browse every available token, see the generated [Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md).
-   To edit token source files, see the [Design Tokens Maintainer's Guide](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/tokens/README.md).

## Design Tokens

Design tokens are named values that describe the visual purpose of a value. Rather than hardcoding values like `#3858e9` or `16px`, use semantic custom properties like `--wpds-color-background-interactive-brand-strong` or `--wpds-dimension-padding-2xl`.

The **[Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md)** explains the naming pattern, how to choose a token, and the complete generated list of available design tokens.

### Using Design Tokens

Design tokens are delivered as CSS custom properties (e.g. `var(--wpds-color-foreground-content-neutral)`). To use them, a stylesheet defining the token values must be loaded on the page.

The [`ThemeProvider`](#theme-provider) component can be used to customize token values like colors for a specific part of your application.

#### Delivery model

The design system splits token delivery into two complementary layers:

-   **Static stylesheet (`design-tokens.css`)** — defines the default value for every `--wpds-*` custom property at the document `:root`. Loaded once per document (the main page, _and_ each iframe you render React into). Provides a working baseline even before any JavaScript runs.
-   **Runtime `<ThemeProvider>`** — applies per-instance overrides for a subtree, on top of the static defaults. Use it to override individual settings (e.g. `color.primary`, `cursor.control`).

#### Within WordPress

Stylesheets are managed on your behalf in standard WordPress admin and editor screens. WordPress registers the design tokens stylesheet as the `wp-theme` style handle and loads it where WordPress admin and editor packages already depend on the shared base styles. This includes the admin page and the block editor's content iframe.

If your plugin renders a separate app shell, iframe, popup window, or package bundle outside those WordPress-managed style dependencies, enqueue the `wp-theme` stylesheet in that document instead of bundling `@wordpress/theme/design-tokens.css` into your plugin. See the [wp_enqueue_style documentation](https://developer.wordpress.org/reference/functions/wp_enqueue_style/#parameters) for how to specify stylesheet dependencies.

#### Outside WordPress

Outside of WordPress, install and load the design tokens stylesheet to support the full range of theming capabilities:

```sh
npm install @wordpress/theme
```

```js
import '@wordpress/theme/design-tokens.css';
```

The package's JavaScript entrypoints are ESM-only and require Node.js `^20.19.0` or `>=22.13.0`. Use `import` syntax from ESM or TypeScript configuration files.

This stylesheet is universal and does not have a separate RTL version.

If your application renders React content into additional documents (an iframe, a popup window, etc.), each of those documents needs the same stylesheet loaded in its own `<head>`. See [Across documents (iframes and other portals)](#across-documents-iframes-and-other-portals).

### Developer Tools

Use the [Stylelint plugins](#stylelint-plugins) to validate token usage and the [build plugins](#build-plugins) to inject generated fallback values. `@wordpress/build` enables the build plugins automatically when `@wordpress/theme` is installed.

### Accessibility

The semantic color tokens are designed so the default foreground/background pairs used by the design system meet [WCAG AA text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Components still need to choose the correct semantic pair for the UI state they render, and must not rely on color alone to convey information.

Design tokens do not replace component-level accessibility handling:

-   **Forced colors:** components are still responsible for `forced-colors` overrides where native high-contrast rendering would otherwise hide borders, icons, focus rings, or state indicators.
-   **Reduced motion:** motion tokens provide shared durations and easing curves, but consuming components are still responsible for respecting `prefers-reduced-motion` for non-essential animations.

For example, define non-essential transitions only when the user has not requested reduced motion:

```css
@media not ( prefers-reduced-motion ) {
	.example {
		transition-property: opacity;
		transition-duration: var( --wpds-motion-duration-md );
		transition-timing-function: var( --wpds-motion-easing-subtle );
	}
}
```

## Theme Provider

The `ThemeProvider` is a React component that should wrap your application to provide design tokens and theme context to the child UI components. It accepts a set of customizable seed values and automatically generates a set of design tokens, which are exposed as CSS custom properties for use throughout the application.

```tsx
import { ThemeProvider } from '@wordpress/theme';

function App() {
	return (
		<ThemeProvider color={ { primary: 'blue' } }>
			{ /* Your app content */ }
		</ThemeProvider>
	);
}
```

The `color` prop accepts an object with the following optional properties:

-   `primary`: The primary/accent seed color (default: `'#3858e9'`).
-   `background`: The background seed color (default: `'#fcfcfc'`).

Both properties accept a fully opaque sRGB-parseable string: a hex value (e.g. `#3858e9`), an `rgb()`/`rgba()` string, or a CSS named color (e.g. `'blue'`). Non-opaque alpha values, `transparent`, and other CSS color spaces (e.g. `hsl()`, `oklch()`, `lab()`) are not accepted and will throw an error. The theme system automatically generates appropriate color ramps and determines light/dark mode based on these seed colors.

The `cursor` prop accepts an object with the following optional properties:

-   `control`: The cursor style for interactive controls that are not links (e.g. buttons, checkboxes, and toggles). Accepts `'default'` or `'pointer'` (default: `'pointer'`).

The `cornerRadius` prop sets the overall roundness preset for the theme subtree. Accepts `'none'` (square corners), `'subtle'`, `'moderate'`, or `'pronounced'` (most rounded) (default: `'subtle'`). This scales the primitive `--wpds-border-radius-*` tokens for the provider subtree. The preset sets the overall amount of roundness, not an individual border-radius token size.

When the `color`, `cursor`, or `cornerRadius` prop is omitted, the theme inherits the value from the closest parent `ThemeProvider`, or uses the default value if none is inherited.

`ThemeProvider` does not accept wrapper customization props such as `className`, `style`, `as`, `render`, or `ref`.

### Nesting Providers

The provider can be used recursively to override or modify the theme for a specific subtree.

```tsx
<ThemeProvider color={ { background: 'white' } }>
	{ /* light-themed UI components */ }
	<ThemeProvider color={ { background: '#1e1e1e' } }>
		{ /* dark-themed UI components */ }
		<ThemeProvider color={ { primary: 'red' } }>
			{ /* dark-themed with red accent */ }
		</ThemeProvider>
	</ThemeProvider>
	{ /* light-themed UI components */ }
</ThemeProvider>
```

The `ThemeProvider` redefines some of the design system tokens. Components consuming semantic design system tokens will automatically follow the chosen theme. Note that the tokens are defined and inherited using the CSS cascade, and therefore the DOM tree, not the React tree. This is very important when using React portals.

### `isRoot` and the containing document

By default, the styles a `<ThemeProvider>` emits are scoped to the provider's wrapper `<div>`, so overrides apply only to its subtree.

Setting `isRoot` additionally hoists those overrides to the containing document's `:root`, so anything rendered into that document — including overlays portalled outside the provider's React tree — picks them up.

```tsx
<ThemeProvider color={ { primary: '#a00' } } isRoot>
	{ /* …app… */ }
</ThemeProvider>
```

Use `isRoot` on the top-level provider for an application or page. It's also the recommended pattern for the topmost provider rendered into a separate document (iframe, popup window).

Render at most one root provider per document. Multiple `isRoot` providers that share the same document are unsupported because each one would try to define the document-level token values. Nested and sibling providers can still be used normally when `isRoot` is omitted, and separate documents can each have their own root provider.

The static design-tokens stylesheet still provides the default values; `isRoot` is only needed when you want a `<ThemeProvider>`'s overrides to reach the whole document.

### Across documents (iframes and other portals)

When you render React content into a different document (typically an iframe), two things must be true for design tokens to work correctly in that document:

1.  **The design-tokens stylesheet is present in the document's `<head>`.** This is the static `:root` block that defines every `--wpds-*` custom property.

    Inside WordPress, this is enqueued automatically for both the admin page and the block editor's content iframe.

    For custom iframes, the consumer is responsible for loading it in the iframe document. Within WordPress, enqueue the `wp-theme` stylesheet for that document. Outside WordPress, import `@wordpress/theme/design-tokens.css` from a stylesheet that the iframe already loads, or inject the CSS string directly.

2.  **Dynamically injected component styles are routed to the iframe document.** Some `@wordpress/components` styles are injected into the document at runtime rather than shipped as static CSS — for example Emotion-based styles, and styles from CSS modules built with `@wordpress/build`. `StyleProvider` tells that machinery which document's `<head>` to inject into. Wrap the iframe subtree in `<StyleProvider document={ iframeDocument }>`.

The canonical pattern combines both with a `<ThemeProvider isRoot>` to apply any overrides to the iframe's `:root`:

```tsx
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';
import { ThemeProvider } from '@wordpress/theme';
import { createPortal } from 'react-dom';

function IframeContent( { iframeDocument, children } ) {
	return createPortal(
		<StyleProvider document={ iframeDocument }>
			<ThemeProvider isRoot color={ { primary: '#a00' } }>
				{ children }
			</ThemeProvider>
		</StyleProvider>,
		iframeDocument.body
	);
}
```

The static stylesheet inside the iframe provides every default; `<ThemeProvider isRoot>` adds (or omits) overrides on top, exactly like in the main document.

### Legacy compatibility

The public token surface is the semantic `--wpds-*` custom properties documented in the [Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md).

`@wordpress/theme` may also maintain legacy compatibility aliases for existing WordPress admin and `@wordpress/components` internals. Those aliases are transitional implementation details, including the `--wp-components-*` namespace, and are not a supported API for consumers. New code should use semantic `--wpds-*` design tokens instead.

### Building

This package is built in two steps. When `npm run build` is run at the root of the repo, it will first run the "prebuild" step of this package, which is defined in the `build` script of this package's package.json.

This step will:

1. Generate primitive tokens.
2. Build CSS and JavaScript token files.
3. Update the design tokens documentation.
4. Format all generated files.

The files generated in this step will all be committed to the repo.

After the prebuild step, the package will be built into its final form via the repo's standard package build script.

## Stylelint Plugins

These rules validate design token usage in CSS. Enable them in your Stylelint configuration:

```json
{
	"plugins": [
		"@wordpress/theme/stylelint-plugins/no-unknown-ds-tokens",
		"@wordpress/theme/stylelint-plugins/no-setting-wpds-custom-properties",
		"@wordpress/theme/stylelint-plugins/no-token-fallback-values"
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

| Export                                                        | Tool    | Scope |
| ------------------------------------------------------------- | ------- | ----- |
| `@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks` | PostCSS | CSS   |
| `@wordpress/theme/esbuild-plugins/esbuild-ds-token-fallbacks` | esbuild | JS/TS |
| `@wordpress/theme/vite-plugins/vite-ds-token-fallbacks`       | Vite    | JS/TS |

Existing fallbacks are unchanged. An unknown token in a bare reference fails the build.

### PostCSS

```js
// postcss.config.mjs
import dsTokenFallbacks from '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks';

export default {
	plugins: [ dsTokenFallbacks ],
};
```

### esbuild

```js
import dsTokenFallbacks from '@wordpress/theme/esbuild-plugins/esbuild-ds-token-fallbacks';

await esbuild.build( {
	plugins: [ dsTokenFallbacks ],
	// …
} );
```

### Vite

The Vite setup uses both the Vite plugin (for JS/TS) and the PostCSS plugin (for CSS):

```ts
// vite.config.ts
import dsTokenFallbacks from '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks';
import dsTokenFallbacksJs from '@wordpress/theme/vite-plugins/vite-ds-token-fallbacks';

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
