import type { Color } from '@wordpress/global-styles-engine';

/**
 * A color, either a palette entry or just a custom color.
 */
export type ColorObject =
	Color | { color: string | null | undefined; slug?: undefined };

/**
 * A color type `withColors` handles: an attribute name, or an object mapping
 * attribute names to color contexts.
 */
export type ColorType = string | Record< string, string >;

/**
 * Props of a component wrapped by `withColors`.
 */
export interface WithColorsProps {
	attributes: Record< string, unknown >;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	colors?: Color[];
	[ prop: string ]: unknown;
}
