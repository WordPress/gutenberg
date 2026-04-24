import {
	to,
	toGamut,
	serialize,
	contrastWCAG21,
	sRGB,
	OKLCH,
	HSL,
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
	ensureColorSpacesRegistered( sRGB );
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
	// `toGamut` with `method: 'css'` internally resolves OKLCH via the
	// registry, regardless of the target gamut. HSL is registered so callers
	// can pass `hsl(...)` strings; sRGB additionally owns the hex and
	// keyword parsers used by `parse()`.
	ensureColorSpacesRegistered( sRGB, OKLCH, HSL );
	// map into sRGB using CSS OKLCH method
	return to( toGamut( c, { space: sRGB, method: 'css' } ), OKLCH );
}
