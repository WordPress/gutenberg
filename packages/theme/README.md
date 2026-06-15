# Theme

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A theming package that's part of the WordPress Design System. It has two parts:

-   **Design Tokens**: A comprehensive system of design tokens for colors, spacing, typography, and more.
-   **Theme System**: A flexible theming provider for consistent theming across applications.

## Design Tokens

In the **[Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md)** document there is a complete reference of all available design tokens including colors, spacing, typography, and more.

### Using Design Tokens

Design tokens are delivered as CSS custom properties (e.g. `var(--wpds-color-foreground-content-neutral)`). To use them, a stylesheet defining the token values must be loaded on the page.

The [`ThemeProvider`](#theme-provider) component can be used to customize token values like colors for a specific part of your application.

#### Within WordPress

Stylesheets are managed on your behalf in a WordPress context, so you don't need to worry about loading them yourself.

#### Outside WordPress

Outside of WordPress, you will need to install and load the design tokens stylesheet to support the full range of theming capabilities:

```
npm install @wordpress/theme
```

```js
import '@wordpress/theme/design-tokens.css';
```

This stylesheet is universal and does not have a separate RTL version.

### Developer Tools

For the best development experience, we recommend configuring the [build plugins](#build-plugins) and [Stylelint rules](#stylelint-plugins) provided by this package. The build plugins automatically inject fallback values into `var(--wpds-*)` references so components render correctly even when the tokens stylesheet is not yet loaded, and will raise an error if a reference does not match a known token. The Stylelint rules catch typos, unknown tokens, and other discouraged patterns during development.

If you use `@wordpress/build` to build your scripts, the build plugins are already enabled by default.

### Architecture

Internally, the design system uses a tiered token architecture:

-   **Primitive tokens**: Raw values like hex colors or pixel dimensions which are what the browsers eventually interpret. These live in the `/tokens` directory as JSON source files and are an internal implementation detail.
-   **Semantic tokens**: Purpose-driven tokens with meaningful names that reference primitives and describe their intended use. These are what get exported as CSS custom properties.

This separation allows the design system to maintain consistency while providing flexibility, since primitive values can be updated without changing the semantic token names that developers use in their code.

### Design Tokens

Design tokens are the visual design atoms of a design system. They are named entities that store visual design attributes like colors, spacing, typography, and shadows. They serve as a single source of truth that bridges design and development, ensuring consistency across platforms and making it easy to maintain and evolve the visual language of an application.

Rather than hardcoding values like `#3858e9` or `16px` throughout your code, tokens provide semantic names like `--wpds-color-background-interactive-brand-strong` or `--wpds-dimension-padding-2xl` that describe the purpose and context of the value. This makes code more maintainable and allows the design system to evolve. When a token's value changes, all components using that token automatically reflect the update.

#### Structure

The design system follows the [Design Tokens Community Group (DTCG)](https://design-tokens.github.io/community-group/format/) specification and organizes tokens into distinct types based on what kind of visual property they represent. Token definitions are stored as JSON files in the `/tokens` directory:

| File              | Description                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `color.json`      | Color palettes including primitive color ramps and semantic color tokens for backgrounds, foregrounds, strokes, and focus states |
| `dimension.json`  | Spacing scale and semantic spacing tokens for padding, margins, and sizing                                                       |
| `typography.json` | Font family stacks, font sizes, and line heights                                                                                 |
| `border.json`     | Border radius and width values                                                                                                   |
| `elevation.json`  | Shadow definitions for creating depth and layering                                                                               |
| `motion.json`     | Animation durations and easing curves                                                                                            |

Each JSON file contains both primitive and semantic token definitions in a hierarchical structure. These files are the source of truth for the design system and are processed during the build step to generate CSS custom properties and other output formats in `/src/prebuilt`.

#### Token Naming

Semantic tokens follow a consistent naming pattern that encodes the token's purpose. See the [Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md) for the naming pattern, the meaning of each segment (type, property, target, tone, emphasis, state), and guidance on how to pick the right token.

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
