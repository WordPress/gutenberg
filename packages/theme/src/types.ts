/**
 * External dependencies
 */
import { type ReactNode } from 'react';

export interface ThemeProviderSettings {
	/**
	 * The set of color options to apply to the theme.
	 */
	color?: {
		/**
		 * The primary seed color to use for the theme.
		 *
		 * By default, it inherits from parent `ThemeProvider`,
		 * and fallbacks to statically built CSS.
		 */
		primary?: string;
		/**
		 * The background seed color to use for the theme.
		 *
		 * By default, it inherits from parent `ThemeProvider`,
		 * and fallbacks to statically built CSS.
		 */
		bg?: string;
	};

	/**
	 * The density of the theme. If left unspecified, the theme inherits from
	 * the density of the closest `ThemeProvider`, or uses the default density
	 * if there is no inherited density.
	 *
	 * @default undefined
	 */
	density?: undefined | 'default' | 'compact' | 'comfortable';
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
