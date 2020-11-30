/**
 * External dependencies
 */
import colorize from 'tinycolor2';

/**
 * Internal dependencies
 */
import { is } from './is';
import { memoize } from './memoize';
export { default as colorize } from 'tinycolor2';

/** @type {HTMLDivElement} */
let __colorComputationNode;

/**
 * @return {HTMLDivElement | undefined}
 */
function getColorComputationNode() {
	if ( typeof document === 'undefined' ) return;

	if ( ! __colorComputationNode ) {
		// Create a temporary element for style computation.
		const el = document.createElement( 'div' );
		el.setAttribute( 'data-g2-color-computation-node', '' );
		// Inject for window computed style.
		document.body.appendChild( el );
		__colorComputationNode = el;
	}

	return __colorComputationNode;
}

/**
 * @param {string | unknown} value
 * @return {boolean}
 */
export function isColor( value ) {
	if ( ! is.string( value ) ) return false;
	const test = colorize( value );

	return test.isValid();
}

/**
 * @param {string | unknown} color
 * @return {string}
 */
function __getComputedBackgroundColor( color ) {
	if ( ! is.string( color ) ) return '';

	if ( isColor( color ) ) return color;

	if ( ! color.includes( 'var(' ) ) return '';
	if ( typeof document === 'undefined' ) return '';

	// Attempts to gracefully handle CSS variables color values.
	const el = getColorComputationNode();
	if ( ! el ) return '';

	el.style.background = color;
	// Grab the style
	const computedColor = window.getComputedStyle( el ).background;
	// Reset
	el.style.background = '';

	return computedColor || '';
}

export const getComputedBackgroundColor = memoize(
	__getComputedBackgroundColor
);

/**
 * @param {string | unknown} color
 * @return {string}
 */
function __getComputedColor( color ) {
	if ( ! is.string( color ) ) return '';

	if ( isColor( color ) ) return color;

	if ( ! color.includes( 'var(' ) ) return '';
	if ( typeof document === 'undefined' ) return '';

	// Attempts to gracefully handle CSS variables color values.
	const el = getColorComputationNode();
	if ( ! el ) return '';

	el.style.color = color;
	// Grab the style
	const computedColor = window.getComputedStyle( el ).color;
	// Reset
	el.style.color = '';

	return computedColor || '';
}

export const getComputedColor = memoize( __getComputedColor );

/**
 * @param {string | unknown} color
 * @return {string}
 */
export function getOptimalTextColor( color ) {
	const background = getComputedBackgroundColor( color );
	const isReadableWithBlackText = colorize.isReadable(
		background,
		'#000000'
	);

	return isReadableWithBlackText ? '#000000' : '#ffffff';
}

/**
 * @param {string | unknown} color
 * @return {string}
 */
export function getOptimalTextShade( color ) {
	const result = getOptimalTextColor( color );

	return result === '#000000' ? 'dark' : 'light';
}
