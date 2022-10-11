/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ThemeProps = {
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
	 * The children elements.
	 */
	children?: ReactNode;
};
