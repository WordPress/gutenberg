import {
	to,
	toGamut,
	serialize,
	contrastWCAG21,
	sRGB,
	OKLCH,
	type ColorTypes,
} from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import { ensureColorSpacesRegistered } from './register-color-spaces';

/**
 * Get string representation of a color
 * @param color Color object to stringify
 * @return String representation
 */
export function getColorString( color: ColorTypes ): string {
	ensureColorSpacesRegistered();
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
	// `contrastWCAG21` resolves luminance via path traversal on the color
	// instances themselves, so it does not require any spaces to be
	// registered.
	return contrastWCAG21( colorA, colorB );
}

/**
 * Make sure that a color is valid in the sRGB gamut and convert it to OKLCH.
 * @param c
 */
export function clampToGamut( c: ColorTypes ) {
	ensureColorSpacesRegistered();
	// map into sRGB using CSS OKLCH method
	return to( toGamut( c, { space: sRGB, method: 'css' } ), OKLCH );
}
