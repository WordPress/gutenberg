/**
 * External dependencies
 */
import {
	to,
	serialize,
	contrastWCAG21,
	sRGB,
	type ColorTypes,
	// Disable reason: ESLint resolver can't handle `exports`. Import resolver
	// checking is redundant in TypeScript files.
	// eslint-disable-next-line import/no-unresolved
} from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import './register-color-spaces';

/**
 * Cache for WCAG contrast calculations
 */
const contrastCache = new Map< string, number >();

/**
 * Cache for color string representations
 */
const colorStringCache = new Map< ColorTypes, string >();

/**
 * Get cached string representation of a color
 * @param color - Color object to stringify
 * @return Cached string representation
 */
export function getColorString( color: ColorTypes ): string {
	let str = colorStringCache.get( color );
	if ( str === undefined ) {
		str = serialize( to( color, sRGB ), { format: 'hex', inGamut: true } );
		colorStringCache.set( color, str );
	}
	return str;
}

/**
 * Get cached contrast calculation between two colors
 * @param colorA - First color
 * @param colorB - Second color
 * @return WCAG 2.1 contrast ratio
 */
export function getCachedContrast(
	colorA: ColorTypes,
	colorB: ColorTypes
): number {
	const keyA = getColorString( colorA );
	const keyB = getColorString( colorB );
	const cacheKey =
		keyA < keyB ? `${ keyA }|${ keyB }` : `${ keyB }|${ keyA }`;

	let contrast = contrastCache.get( cacheKey );
	if ( contrast === undefined ) {
		contrast = contrastWCAG21( colorA, colorB );
		contrastCache.set( cacheKey, contrast );
	}
	return contrast;
}

/**
 * Clear all caches - useful for memory management or testing
 */
export function clearCaches(): void {
	contrastCache.clear();
	colorStringCache.clear();
}
