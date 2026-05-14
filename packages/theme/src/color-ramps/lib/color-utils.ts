import {
	ColorSpace,
	to,
	toGamut,
	serialize,
	contrastWCAG21,
	sRGB,
	OKLCH,
	type PlainColorObject,
} from 'colorjs.io/fn';

/**
 * Get string representation of a color.
 * @param color A `PlainColorObject`, or an sRGB-parseable string (typically a
 *              hex value, e.g. `#3858e9`).
 * @return String representation
 */
export function getColorString( color: string | PlainColorObject ): string {
	ColorSpace.register( sRGB );
	const rgbRounded = serialize( to( color, sRGB ) );
	return serialize( rgbRounded, { format: 'hex' } );
}

/**
 * Get contrast value between two colors.
 * @param colorA First color: a `PlainColorObject`, or an sRGB-parseable string.
 * @param colorB Second color: a `PlainColorObject`, or an sRGB-parseable string.
 * @return WCAG 2.1 contrast ratio
 */
export function getContrast(
	colorA: string | PlainColorObject,
	colorB: string | PlainColorObject
): number {
	ColorSpace.register( sRGB );
	return contrastWCAG21( colorA, colorB );
}

/**
 * Make sure that a color is valid in the sRGB gamut and convert it to OKLCH.
 * @param c A `PlainColorObject`, or an sRGB-parseable string.
 */
export function clampToGamut( c: string | PlainColorObject ) {
	ColorSpace.register( sRGB );
	// Workaround for upstream toGamut(method:'css') bug.
	// https://github.com/color-js/color.js/pull/734
	ColorSpace.register( OKLCH );
	return to( toGamut( c, { space: sRGB, method: 'css' } ), OKLCH );
}
