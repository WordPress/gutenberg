/**
 * External dependencies
 */
import type Color from 'colorjs.io';

/**
 * Cache for WCAG contrast calculations
 */
const contrastCache = new Map< string, number >();

/**
 * Cache for color string representations
 */
const colorStringCache = new Map< Color, string >();

/**
 * Get cached string representation of a color
 * @param color - Color object to stringify
 * @return Cached string representation
 */
export function getColorString( color: Color ): string {
	let str = colorStringCache.get( color );
	if ( str === undefined ) {
		str = color.to( 'srgb' ).toString( { format: 'hex', inGamut: true } );
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
export function getCachedContrast( colorA: Color, colorB: Color ): number {
	const keyA = getColorString( colorA );
	const keyB = getColorString( colorB );
	const cacheKey =
		keyA < keyB ? `${ keyA }|${ keyB }` : `${ keyB }|${ keyA }`;

	let contrast = contrastCache.get( cacheKey );
	if ( contrast === undefined ) {
		contrast = colorA.contrastWCAG21( colorB );
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
