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
 * Get string representation of a color
 * @param color Color object to stringify
 * @return String representation
 */
export function getColorString( color: ColorTypes ): string {
	return serialize( to( color, sRGB ), { format: 'hex', inGamut: true } );
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
