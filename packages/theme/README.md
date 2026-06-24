# Theme

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A theming package that's part of the WordPress Design System. It has two parts:

-   **Design Tokens**: A comprehensive system of design tokens for colors, spacing, typography, and more.
-   **Theme System**: A flexible theming provider for consistent theming across applications.

## Design Tokens

Design tokens are the visual design atoms of a design system. They are named entities that store visual design attributes like colors, spacing, typography, and shadows. They serve as a single source of truth that bridges design and development, ensuring consistency across platforms and making it easy to maintain and evolve the visual language of an application.

Rather than hardcoding values like `#3858e9` or `16px` throughout your code, tokens provide semantic names like `--wpds-color-background-interactive-brand-strong` or `--wpds-dimension-padding-2xl` that describe the purpose and context of the value. This makes code more maintainable and allows the design system to evolve. When a token's value changes, all components using that token automatically reflect the update.

The **[Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md)** contains a complete reference of all available design tokens including colors, spacing, typography, and more.

The **[Design Tokens Maintainer's Guide](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/tokens/README.md)** describes how design tokens are implemented in the design system.

### Using Design Tokens

Design tokens are delivered as CSS custom properties (e.g. `var(--wpds-color-foreground-content-neutral)`). To use them, a stylesheet defining the token values must be loaded on the page.

The [`ThemeProvider`](#theme-provider) component can be used to customize token values like colors for a specific part of your application.

#### Delivery model

The design system splits token delivery into two complementary layers:

-   **Static stylesheet (`design-tokens.css`)** — defines the default value for every `--wpds-*` custom property at the document `:root`. Loaded once per document (the main page, _and_ each iframe you render React into). Provides a working baseline even before any JavaScript runs.
-   **Runtime `<ThemeProvider>`** — applies per-instance overrides for a subtree, on top of the static defaults. Use it to override individual settings (e.g. `color.primary`, `cursor.control`).

#### Within WordPress

Stylesheets are managed on your behalf in a WordPress context, so you don't need to worry about loading them yourself. The design tokens stylesheet is enqueued automatically on every admin page and inside the block editor's content iframe.

#### Outside WordPress

Outside of WordPress, you will need to install and load the design tokens stylesheet to support the full range of theming capabilities:

```
npm install @wordpress/theme
```

```js
import '@wordpress/theme/design-tokens.css';
```

This stylesheet is universal and does not have a separate RTL version.

If your application renders React content into additional documents (an iframe, a popup window, etc.), each of those documents needs the same stylesheet loaded in its own `<head>`. See [Across documents (iframes and other portals)](#across-documents-iframes-and-other-portals).

### Developer Tools

For the best development experience, we recommend configuring the [build plugins](#build-plugins) and [Stylelint rules](#stylelint-plugins) provided by this package. The build plugins automatically inject fallback values into `var(--wpds-*)` references so components render correctly even when the tokens stylesheet is not yet loaded, and will raise an error if a reference does not match a known token. The Stylelint rules catch typos, unknown tokens, and other discouraged patterns during development.

If you use `@wordpress/build` to build your scripts, the build plugins are already enabled by default.

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
-   `background`: The background seed color (default: `'#f8f8f8'`).

Both properties accept an sRGB-parseable string: a hex value (e.g. `#3858e9`), an `rgb()`/`rgba()` string, or a CSS named color (e.g. `'blue'`). Other CSS color spaces (e.g. `hsl()`, `oklch()`, `lab()`) are not accepted and will throw an error. The theme system automatically generates appropriate color ramps and determines light/dark mode based on these seed colors.

The `cursor` prop accepts an object with the following optional properties:

-   `control`: The cursor style for interactive controls that are not links (e.g. buttons, checkboxes, and toggles). Accepts `'default'` or `'pointer'` (default: `'pointer'`).

The `cornerRadius` prop sets the overall roundness preset for the theme subtree. Accepts `'none'` (square corners), `'subtle'`, `'moderate'`, or `'pronounced'` (most rounded) (default: `'subtle'`). This scales the primitive `--wpds-border-radius-*` tokens for the provider subtree. The preset sets the overall amount of roundness, not an individual border-radius token size.

When the `color`, `cursor`, or `cornerRadius` prop is omitted, the theme inherits the value from the closest parent `ThemeProvider`, or uses the default value if none is inherited.

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

Use `isRoot` on the top-level provider for an application or page. It's also the recommended pattern for the topmost provider rendered into a separate document (iframe, popup window). The static design-tokens stylesheet still provides the default values; `isRoot` is only needed when you want a `<ThemeProvider>`'s overrides to reach the whole document.

### Across documents (iframes and other portals)

When you render React content into a different document (typically an iframe), two things must be true for design tokens to work correctly in that document:

1.  **The design-tokens stylesheet is present in the document's `<head>`.** This is the static `:root` block that defines every `--wpds-*` custom property.

    Inside WordPress, this is enqueued automatically for both the admin page and the block editor's content iframe.

    For custom iframes, the consumer is responsible for loading it — either by importing `@wordpress/theme/design-tokens.css` from a stylesheet that the iframe already loads, or by injecting the CSS string directly.

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

This package provides Stylelint plugins to help enforce consistent usage of design tokens. To use them, add the plugins to your Stylelint configuration:

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

This rule reports an error when a CSS value references a `--wpds-*` custom property that is not a valid design token. This helps catch typos and ensures that only valid design tokens are used.

```css
/* ✗ Error: '--wpds-unknown-token' is not a valid Design System token */
.example {
	color: var( --wpds-unknown-token );
}

/* ✓ OK */
.example {
	color: var( --wpds-color-foreground-content-neutral );
}
```

### `plugin-wpds/no-setting-wpds-custom-properties`

This rule reports an error when a CSS declaration sets (defines) a custom property in the `--wpds-*` namespace. The design system tokens should only be consumed, not defined or overridden in consuming code.

```css
/* ✗ Error: Do not set CSS custom properties using the Design System tokens namespace */
.example {
	--wpds-my-token: red;
}

/* ✗ Error: Overriding existing tokens is also not allowed */
.example {
	--wpds-color-foreground-content-neutral: red;
}

/* ✓ OK */
.example {
	--my-custom-token: red;
}
```

### `plugin-wpds/no-token-fallback-values`

This rule reports an error when a `var()` call for a `--wpds-*` token includes a manual fallback value. Fallback values for design tokens are injected automatically at build time by the [build plugins](#build-plugins), so manual fallbacks in source are redundant and can drift out of sync with the token definitions.

```css
/* ✗ Error: Do not add a fallback value for Design System token '--wpds-color-foreground-content-neutral' */
.example {
	color: var( --wpds-color-foreground-content-neutral, #1e1e1e );
}

/* ✓ OK */
.example {
	color: var( --wpds-color-foreground-content-neutral );
}

/* ✓ OK: Non-wpds custom properties are not checked */
.example {
	color: var( --my-custom-color, red );
}
```

## Build Plugins

This package provides build plugins that inject fallback values into bare `var(--wpds-*)` references at build time. This ensures components render correctly even when a `ThemeProvider` or design tokens stylesheet is not present — for example, `var(--wpds-color-foreground-content-neutral)` becomes `var(--wpds-color-foreground-content-neutral, #1e1e1e)`.

`@wordpress/build` already applies these plugins automatically when `@wordpress/theme` is installed. You only need to configure them manually for custom build setups.

Three plugin variants are available, covering common build tool setups:

| Export                                                        | Tool    | Scope |
| ------------------------------------------------------------- | ------- | ----- |
| `@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks` | PostCSS | CSS   |
| `@wordpress/theme/esbuild-plugins/esbuild-ds-token-fallbacks` | esbuild | JS/TS |
| `@wordpress/theme/vite-plugins/vite-ds-token-fallbacks`       | Vite    | JS/TS |

All three plugins skip files that don't contain `--wpds-` references, so there is zero overhead on unrelated modules.

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
