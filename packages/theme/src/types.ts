import { type ReactNode } from 'react';

export type CornerRadiusPreset = 'none' | 'subtle' | 'moderate' | 'pronounced';

export interface ThemeProviderSettings {
	/**
	 * The set of color options to apply to the theme.
	 */
	color?: {
		/**
		 * The primary seed color to use for the theme. Accepts an
		 * sRGB-parseable string: a hex value (e.g. `#3858e9`), an
		 * `rgb()`/`rgba()` string, or a CSS named color (e.g. `'blue'`). Other
		 * CSS color spaces (e.g. `hsl()`, `oklch()`, `lab()`) are not accepted
		 * and throw an error.
		 *
		 * By default, it inherits from parent `ThemeProvider`,
		 * and fallbacks to statically built CSS.
		 */
		primary?: string;
		/**
		 * The background seed color to use for the theme. Accepts an
		 * sRGB-parseable string: a hex value (e.g. `#f8f8f8`), an
		 * `rgb()`/`rgba()` string, or a CSS named color (e.g. `'blue'`). Other
		 * CSS color spaces (e.g. `hsl()`, `oklch()`, `lab()`) are not accepted
		 * and throw an error.
		 *
		 * By default, it inherits from parent `ThemeProvider`,
		 * and fallbacks to statically built CSS.
		 */
		background?: string;
	};

	/**
	 * The set of cursor options to apply to the theme.
	 */
	cursor?: {
		/**
		 * The cursor style for interactive controls that are not links
		 * (e.g. buttons, checkboxes, and toggles).
		 *
		 * By default, it inherits from the parent `ThemeProvider`,
		 * and falls back to the prebuilt default (`default`).
		 */
		control?: 'default' | 'pointer';
	};

	/**
	 * Overall roundness preset for the theme subtree: `none` (square corners),
	 * `subtle`, `moderate`, or `pronounced` (most rounded).
	 *
	 * This scales the individual `--wpds-border-radius-*` token sizes for the
	 * subtree; it sets the overall amount of roundness, not a single token
	 * size.
	 *
	 * By default, it inherits from the parent `ThemeProvider`,
	 * and falls back to the prebuilt default (`subtle`).
	 */
	cornerRadius?: CornerRadiusPreset;
}

export interface ThemeProviderProps extends ThemeProviderSettings {
	/**
	 * The children to render.
	 */
	children?: ReactNode;

	/**
	 * When a ThemeProvider is the root provider, it will apply its theming
	 * settings also to the root document element (e.g. the html element).
	 * This is useful, for example, to make sure that the `html` element can
	 * consume the right background color, or that overlays rendered inside a
	 * portal can inherit the correct color scheme.
	 *
	 * @default false
	 */
	isRoot?: boolean;
}
