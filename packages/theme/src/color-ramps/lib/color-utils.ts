/**
 * External dependencies
 */
import {
	to,
	toGamut,
	serialize,
	contrastWCAG21,
	sRGB,
	OKLCH,
	clone,
	get,
	set,
	type ColorTypes,
} from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import './register-color-spaces';

/**
 * Get string representation of a color
 * @param color Color object to stringify
 * @return String representation
 */
export function getColorString( color: ColorTypes ): string {
	const rgbRounded = serialize( to( color, sRGB ) );
	return serialize( rgbRounded, { format: 'hex' } );
}

/**
 * Get contrast value between two colors
 * @param colorA First color
 * @param colorB Second color
 * @return WCAG 2.1 contrast ratio
 */
export function getContrast( colorA: ColorTypes, colorB: ColorTypes ): number {
	return contrastWCAG21( colorA, colorB );
}

/**
 * Make sure that a color is valid in the sRGB gamut and convert it to OKLCH.
 * @param c
 */
export function clampToGamut( c: ColorTypes ) {
	// map into sRGB using CSS OKLCH method
	return to( toGamut( c, { space: sRGB, method: 'css' } ), OKLCH );
}

/**
 * Rotates a color's hue by the specified degrees in OKLCH color space.
 * Preserves lightness and chroma, only modifying the hue angle.
 * @param seed    The seed color string (hex, rgb, etc.)
 * @param degrees The number of degrees to rotate the hue (positive = counterclockwise)
 * @return The rotated color as a hex string
 */
export function rotateHue( seed: string, degrees: number ): string {
	const color = clampToGamut( seed );
	const currentHue = get( color, [ OKLCH, 'h' ] ) || 0;
	const newHue = ( currentHue + degrees ) % 360;
	const rotated = set( clone( color ), [ OKLCH, 'h' ], newHue );
	return getColorString( toGamut( rotated, { space: sRGB, method: 'css' } ) );
}
