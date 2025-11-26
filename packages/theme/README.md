# Theme

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A theming package that's part of the WordPress Design System. It has two parts:

-   **Design Tokens**: A comprehensive system of design tokens for colors, spacing, typography, and more
-   **Theme System**: A flexible theming provider for consistent theming across applications

## Design Tokens

In the **[Design Tokens Reference](docs/ds-tokens.md)** document there is a complete reference of all available design tokens including colors, spacing, typography, and more.

### Color Tokens

The design system defines color tokens using the following naming scheme:

```
--wpds-<element>-<tone>[-<emphasis>][-<state>]
```

**Element** specifies what the color is applied to.

| Value                | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `bg-surface`         | Backgrounds of layout or container surfaces.                                                |
| `bg-interactive`     | Backgrounds of interactive elements such as buttons, inputs, and toggles.                   |
| `bg-track`           | Backgrounds of track components like scrollbars and slider tracks.                          |
| `bg-thumb`           | Backgrounds of thumb components like scrollbar thumbs and slider thumbs.                    |
| `fg-content`         | Foreground color for text and icons in static content.                                      |
| `fg-interactive`     | Foreground color for text and icons in interactive elements such as links and buttons.      |
| `stroke-surface`     | Decorative borders and dividers for non-interactive surfaces.                               |
| `stroke-interactive` | Accessible borders for interactive controls.                                                |
| `stroke-focus`       | Stroke color specifically for focus rings.                                                  |

**Tone** defines the semantic intent of the color.

| Value     | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| `neutral` | Neutrally toned UI elements.                                                             |
| `brand`   | Brand-accented or primary action colors.                                                 |
| `success` | Positive or completed states.                                                            |
| `info`    | Informational or system-generated context.                                               |
| `caution` | Heads-up or low-severity issues; “proceed carefully.”                                    |
| `warning` | Higher-severity or time-sensitive issues that require user attention but are not errors. |
| `error`   | Blocking issues, validation failures, or destructive actions.                            |

> [!NOTE]
> `caution` and `warning` represent two escalation levels of non-error severity.
> Use **`caution`** for guidance or minor risks, and **`warning`** when the user must act to prevent an error.

**Emphasis** adjusts color strength relative to the base tone, if specified. The default is a normal emphasis.

| Value                | Description                                 |
| -------------------- | ------------------------------------------- |
| `strong`             | Higher contrast and/or elevated emphasis.   |
| `weak`               | Subtle variant for secondary or muted elements. |

**State** represents the interactive state of the element, if specified. The default is an idle state.

| Value      | Description                              |
| ---------- | ---------------------------------------- |
| `active`   | Hovered, pressed, or selected state.     |
| `disabled` | Unavailable or inoperable state.         |

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

-   `primary`: The primary/accent seed color (default: `'#3858e9'`)
-   `bg`: The background seed color (default: `'#f8f8f8'`)

Both properties accept any valid CSS color value. The theme system automatically generates appropriate color ramps and determines light/dark mode based on these seed colors.

### Nesting Providers

The provider can be used recursively to override or modify the theme for a specific subtree.

```tsx
<ThemeProvider color={ { bg: 'white' } }>
	{ /* light-themed UI components */ }
	<ThemeProvider color={ { bg: '#1e1e1e' } }>
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

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
