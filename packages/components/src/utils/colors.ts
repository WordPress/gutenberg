import memoize from 'memize';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

let colorComputationNode: HTMLDivElement;

extend( [ namesPlugin ] );

/**
 * Generating a CSS compliant rgba() color value.
 *
 * @param hexValue The hex value to convert to rgba().
 * @param alpha    The alpha value for opacity.
 * @return The converted rgba() color value.
 *
 * @example
 * rgba( '#000000', 0.5 )
 * // rgba(0, 0, 0, 0.5)
 */
export function rgba( hexValue = '', alpha = 1 ) {
	return colord( hexValue ).alpha( alpha ).toRgbString();
}

/**
 * @return The HTML element for color computation.
 */
function getColorComputationNode() {
	if ( typeof document === 'undefined' ) {
		return;
	}

	if ( ! colorComputationNode ) {
		// Create a temporary element for style computation.
		const el = document.createElement( 'div' );
		el.setAttribute( 'data-g2-color-computation-node', '' );
		// Inject for window computed style.
		document.body.appendChild( el );
		colorComputationNode = el;
	}

	return colorComputationNode;
}

/**
 * @param value
 *
 * @return Whether the value is a valid color.
 */
function isColor( value: string | unknown ) {
	if ( typeof value !== 'string' ) {
		return false;
	}
	const test = colord( value );

	return test.isValid();
}

/**
 * Retrieves the computed background color. This is useful for getting the
 * value of a CSS variable color.
 *
 * @param backgroundColor The background color to compute.
 *
 * @return The computed background color.
 */
function _getComputedBackgroundColor( backgroundColor: string | unknown ) {
	if ( typeof backgroundColor !== 'string' ) {
		return '';
	}

	if ( isColor( backgroundColor ) ) {
		return backgroundColor;
	}

	if ( ! backgroundColor.includes( 'var(' ) ) {
		return '';
	}
	if ( typeof document === 'undefined' ) {
		return '';
	}

	// Attempts to gracefully handle CSS variables color values.
	const el = getColorComputationNode();
	if ( ! el ) {
		return '';
	}

	el.style.background = backgroundColor;
	// Grab the style.
	const computedColor = window?.getComputedStyle( el ).background;
	// Reset.
	el.style.background = '';

	return computedColor || '';
}

const getComputedBackgroundColor = memoize( _getComputedBackgroundColor );

/**
 * Get the text shade optimized for readability, based on a background color.
 *
 * @param backgroundColor The background color.
 *
 * @return The optimized text color (black or white).
 */
export function getOptimalTextColor(
	backgroundColor: string | unknown
): string {
	const background = getComputedBackgroundColor( backgroundColor );

	return colord( background ).isLight() ? '#000000' : '#ffffff';
}

/**
 * Get the text shade optimized for readability, based on a background color.
 *
 * @param backgroundColor The background color.
 *
 * @return The optimized text shade (dark or light).
 */
export function getOptimalTextShade(
	backgroundColor: string | unknown
): string {
	const result = getOptimalTextColor( backgroundColor );

	return result === '#000000' ? 'dark' : 'light';
}
