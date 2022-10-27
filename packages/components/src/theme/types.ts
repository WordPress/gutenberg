/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ThemeInputValues = {
	/**
	 * Used to set the accent color (used by components as the primary color).
	 *
	 * If an accent color is not defined, the default fallback value is the original
	 * WP Admin main theme color. No all valid CSS color syntaxes are supported —
	 * in particular, keywords (like `'currentcolor'`, `'inherit'`, `'initial'`,
	 * `'revert'`, `'unset'`...) and CSS custom properties (e.g.
	 * `var(--my-custom-property)`) are _not_ supported values for this property.
	 */
	accent?: string;
	/**
	 * TODO: Write description
	 */
	background?: string;
};

export type ThemeOutputValues = {
	colors: Partial< {
		accent: string;
		accentDarker10: string;
		accentDarker20: string;
		/** Foreground color to use when accent color is the background. */
		accentInverted: string;
		background: string;
		foreground: string;
		/** Foreground color to use when foreground color is the background. */
		foregroundInverted: string;
		gray: {
			100: string;
			200: string;
			300: string;
			400: string;
			600: string;
			700: string;
			800: string;
		};
	} >;
};

export type ThemeProps = ThemeInputValues & {
	/**
	 * The children elements.
	 */
	children?: ReactNode;
};
