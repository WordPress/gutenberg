# Theme

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A theming package that's part of the WordPress Design System. It has two parts:

-   **Design Tokens**: A comprehensive system of design tokens for colors, spacing, typography, and more.
-   **Theme System**: A flexible theming provider for consistent theming across applications.

## Design Tokens

In the **[Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md)** document there is a complete reference of all available design tokens including colors, spacing, typography, and more.

### Architecture

Internally, the design system uses a tiered token architecture:

-   **Primitive tokens**: Raw values like hex colors or pixel dimensions which are what the browsers eventually interpret. These live in the `/tokens` directory as JSON source files and are an internal implementation detail.
-   **Semantic tokens**: Purpose-driven tokens with meaningful names that reference primitives and describe their intended use. These are what get exported as CSS custom properties.

This separation allows the design system to maintain consistency while providing flexibility, since primitive values can be updated without changing the semantic token names that developers use in their code.

### Design Tokens

Design tokens are the visual design atoms of a design system. They are named entities that store visual design attributes like colors, spacing, typography, and shadows. They serve as a single source of truth that bridges design and development, ensuring consistency across platforms and making it easy to maintain and evolve the visual language of an application.

Rather than hardcoding values like `#3858e9` or `16px` throughout your code, tokens provide semantic names like `--wpds-color-bg-interactive-brand-strong` or `--wpds-dimension-padding-2xl` that describe the purpose and context of the value. This makes code more maintainable and allows the design system to evolve. When a token's value changes, all components using that token automatically reflect the update.

#### Structure

The design system follows the [Design Tokens Community Group (DTCG)](https://design-tokens.github.io/community-group/format/) specification and organizes tokens into distinct types based on what kind of visual property they represent. Token definitions are stored as JSON files in the `/tokens` directory:

| File              | Description                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `color.json`      | Color palettes including primitive color ramps and semantic color tokens for backgrounds, foregrounds, strokes, and focus states |
| `dimension.json`  | Spacing scale and semantic spacing tokens for padding, margins, and sizing                                                       |
| `typography.json` | Font family stacks, font sizes, and line heights                                                                                 |
| `border.json`     | Border radius and width values                                                                                                   |
| `elevation.json`  | Shadow definitions for creating depth and layering                                                                               |

Each JSON file contains both primitive and semantic token definitions in a hierarchical structure. These files are the source of truth for the design system and are processed during the build step to generate CSS custom properties and other output formats in `/src/prebuilt`.

#### Token Naming

Semantic tokens follow a consistent naming pattern:

```
--wpds-<type>-<property>-<target>[-<modifier>]
```

**Type** indicates what kind of value it represents, usually mapping to a DTCG token type.

| Value       | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| `color`     | Color values for backgrounds, foregrounds, and strokes                         |
| `dimension` | Spacing, sizing, and other measurable lengths (e.g., padding, margins, widths) |
| `border`    | Border properties like radius and width                                        |
| `elevation` | Shadow definitions for layering and depth                                      |
| `font`      | Typography properties like family, size, and line-height                       |

**Property** is the specific design property being defined.

| Value     | Description                        |
| --------- | ---------------------------------- |
| `bg`      | Background color                   |
| `fg`      | Foreground color (text and icons)  |
| `stroke`  | Border and outline color           |
| `padding` | Internal spacing within an element |
| `gap`     | Spacing between elements           |
| `radius`  | Border radius for rounded corners  |
| `width`   | Border width                       |
| `size`    | Font size                          |
| `family`  | Font family                        |

**Target** is the component or element type the token applies to.

| Value         | Description                                               |
| ------------- | --------------------------------------------------------- |
| `surface`     | Container or layout backgrounds and borders               |
| `interactive` | Interactive elements like buttons, inputs, and controls   |
| `content`     | Static content like text and icons                        |
| `track`       | Track components like scrollbars and slider tracks        |
| `thumb`       | Thumb components like scrollbar thumbs and slider handles |
| `focus`       | Focus indicators and rings                                |

**Modifier** is an optional size or intensity modifier.

| Value                               | Description          |
| ----------------------------------- | -------------------- |
| `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` | Size scale modifiers |

#### Color Token Modifiers

Color tokens extend the base pattern with additional modifiers for tone, emphasis, and state:

```
--wpds-color-<property>-<target>-<tone>[-<emphasis>][-<state>]
```

**Tone** defines the semantic intent of the color.

| Value     | Description                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| `neutral` | Neutrally toned UI elements                                                             |
| `brand`   | Brand-accented or primary action colors                                                 |
| `success` | Positive or completed states                                                            |
| `info`    | Informational or system-generated context                                               |
| `caution` | Heads-up or low-severity issues; “proceed carefully”                                    |
| `warning` | Higher-severity or time-sensitive issues that require user attention but are not errors |
| `error`   | Blocking issues, validation failures, or destructive actions                            |

> [!NOTE]
> `caution` and `warning` represent two escalation levels of non-error severity.
> Use **`caution`** for guidance or minor risks, and **`warning`** when the user must act to prevent an error.

**Emphasis** adjusts color strength relative to the base tone, if specified. The default is a normal emphasis.

| Value    | Description                                    |
| -------- | ---------------------------------------------- |
| `strong` | Higher contrast and/or elevated emphasis       |
| `weak`   | Subtle variant for secondary or muted elements |

**State** represents the interactive state of the element, if specified. The default is an idle state.

| Value      | Description                         |
| ---------- | ----------------------------------- |
| `active`   | Hovered, pressed, or selected state |
| `disabled` | Unavailable or inoperable state     |

## Theme Provider

The `ThemeProvider` is a React component that should wrap your application to provide design tokens and theme context to the child UI components. It accepts a set of customizable seed values and automatically generates a set of design tokens, which are exposed as CSS custom properties for use throughout the application.

```tsx
import { ThemeProvider } from '@wordpress/theme';

function App() {
	return (
		<ThemeProvider color={ { primary: 'blue' } } density="compact">
			{ /* Your app content */ }
		</ThemeProvider>
	);
}
```

The `color` prop accepts an object with the following optional properties:

-   `primary`: The primary/accent seed color (default: `'#3858e9'`).
-   `bg`: The background seed color (default: `'#f8f8f8'`).

Both properties accept any valid CSS color value. The theme system automatically generates appropriate color ramps and determines light/dark mode based on these seed colors.

The `density` prop controls the spacing scale throughout the UI:

-   `'default'`: Standard spacing for general use.
-   `'compact'`: Reduced spacing for information-dense interfaces like data tables or dashboards.
-   `'comfortable'`: Increased spacing for focused experiences like modals, dialogs, or full-screen settings panels.

The density setting adjusts dimension tokens like gaps and paddings to maintain consistent spacing throughout the UI. Changing the density automatically updates spacing of all components that use these tokens.

When the `color` or `density` prop is omitted, the theme inherits the value from the closest parent `ThemeProvider`, or uses the default value if none is inherited.

### Nesting Providers

The provider can be used recursively to override or modify the theme for a specific subtree.

```tsx
<ThemeProvider color={ { bg: 'white' } }>
	{ /* light-themed UI components */ }
	<ThemeProvider color={ { bg: '#1e1e1e' } } density="compact">
		{ /* dark-themed UI components with compact spacing */ }
		<ThemeProvider color={ { primary: 'red' } }>
			{ /* dark-themed with red accent, inheriting compact density */ }
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
		"@wordpress/theme/stylelint-plugins/no-setting-wpds-custom-properties"
	],
	"rules": {
		"plugin-wpds/no-unknown-ds-tokens": true,
		"plugin-wpds/no-setting-wpds-custom-properties": true
	}
}
```

### `plugin-wpds/no-unknown-ds-tokens`

This rule reports an error when a CSS value references a `--wpds-*` custom property that is not a valid design token. This helps catch typos and ensures that only valid design tokens are used.

```css
/* ✗ Error: '--wpds-unknown-token' is not a valid Design System token */
.example {
	color: var(--wpds-unknown-token);
}

/* ✓ OK */
.example {
	color: var(--wpds-color-fg-content-neutral);
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
	--wpds-color-fg-content-neutral: red;
}

/* ✓ OK */
.example {
	--my-custom-token: red;
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
