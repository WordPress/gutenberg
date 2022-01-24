/**
 * External dependencies
 */
import memoize from 'memize';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/** @type {HTMLDivElement} */
let colorComputationNode;

extend( [ namesPlugin ] );

/**
 * @return {HTMLDivElement | undefined} The HTML element for color computation.
 */
function getColorComputationNode() {
	if ( typeof document === 'undefined' ) return;

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
 * @param {string | unknown} value
 *
 * @return {boolean} Whether the value is a valid color.
 */
function isColor( value ) {
	if ( typeof value !== 'string' ) return false;
	const test = colord( value );

	return test.isValid();
}

/**
 * Retrieves the computed background color. This is useful for getting the
 * value of a CSS variable color.
 *
 * @param {string | unknown} backgroundColor The background color to compute.
 *
 * @return {string} The computed background color.
 */
function _getComputedBackgroundColor( backgroundColor ) {
	if ( typeof backgroundColor !== 'string' ) return '';

	if ( isColor( backgroundColor ) ) return backgroundColor;

	if ( ! backgroundColor.includes( 'var(' ) ) return '';
	if ( typeof document === 'undefined' ) return '';

	// Attempts to gracefully handle CSS variables color values.
	const el = getColorComputationNode();
	if ( ! el ) return '';

	el.style.background = backgroundColor;
	// Grab the style
	const computedColor = window?.getComputedStyle( el ).background;
	// Reset
	el.style.background = '';

	return computedColor || '';
}

const getComputedBackgroundColor = memoize( _getComputedBackgroundColor );

/**
 * Get the text shade optimized for readability, based on a background color.
 *
 * @param {string | unknown} backgroundColor The background color.
 *
 * @return {string} The optimized text color (black or white).
 */
export function getOptimalTextColor( backgroundColor ) {
	const background = getComputedBackgroundColor( backgroundColor );

	return colord( background ).isLight() ? '#000000' : '#ffffff';
}

/**
 * Get the text shade optimized for readability, based on a background color.
 *
 * @param {string | unknown} backgroundColor The background color.
 *
 * @return {string} The optimized text shade (dark or light).
 */
export function getOptimalTextShade( backgroundColor ) {
	const result = getOptimalTextColor( backgroundColor );

	return result === '#000000' ? 'dark' : 'light';
}
