/**
 * External dependencies
 */
import { get } from 'lodash';
import tinycolor from 'tinycolor2';
import memoize from 'memize';

/**
 * Internal dependencies
 */
import { COLORS } from './colors-values';

/**
 * Generating a CSS complient rgba() color value.
 *
 * @param {string} hexValue The hex value to convert to rgba().
 * @param {number} alpha The alpha value for opacity.
 * @return {string} The converted rgba() color value.
 *
 * @example
 * rgba( '#000000', 0.5 )
 * // rgba(0, 0, 0, 0.5)
 */
export function rgba( hexValue = '', alpha = 1 ) {
	const { r, g, b } = tinycolor( hexValue ).toRgb();
	return `rgba(${ r }, ${ g }, ${ b }, ${ alpha })`;
}

/**
 * Retrieves a color from the color palette.
 *
 * @param {import('lodash').PropertyPath} value The value to retrieve.
 * @return {string} The color (or fallback, if not found).
 *
 * @example
 * color( 'blue.wordpress.700' )
 * // #00669b
 */
export function color( value ) {
	const fallbackColor = '#000';
	return get( COLORS, value, fallbackColor );
}

/** @type {HTMLDivElement} */
let __colorComputationNode;

/**
 * @return {HTMLDivElement | undefined} The HTML element for color computation.
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
 *
 * @return {boolean} Whether the value is a valid color.
 */
export function isColor( value ) {
	if ( typeof value !== 'string' ) return false;
	const test = tinycolor( value );

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
function __getComputedBackgroundColor( backgroundColor ) {
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

/**
 * Retrieves the computed background color. This is useful for getting the
 * value of a CSS variable color.
 *
 * @param {string | unknown} color The background color to compute.
 *
 * @return {string} The computed background color.
 */
export const getComputedBackgroundColor = memoize(
	__getComputedBackgroundColor
);

/**
 * Retrieves the computed text color. This is useful for getting the
 * value of a CSS variable color.
 *
 * @param {string | unknown} textColor
 *
 * @return {string} The computed text color.
 */
function __getComputedColor( textColor ) {
	if ( typeof textColor !== 'string' ) return '';

	if ( isColor( textColor ) ) return textColor;

	if ( ! textColor.includes( 'var(' ) ) return '';
	if ( typeof document === 'undefined' ) return '';

	// Attempts to gracefully handle CSS variables color values.
	const el = getColorComputationNode();
	if ( ! el ) return '';

	el.style.color = textColor;
	// Grab the style
	const computedColor = window?.getComputedStyle( el ).color;
	// Reset
	el.style.color = '';

	return computedColor || '';
}

/**
 * Retrieves the computed text color. This is useful for getting the
 * value of a CSS variable color.
 *
 * @param {string | unknown} color
 *
 * @return {string} The computed text color.
 */
export const getComputedColor = memoize( __getComputedColor );

/**
 * Get the text shade optimized for readability, based on a background color.
 *
 * @param {string | unknown} backgroundColor  The background color.
 *
 * @return {string} The optimized text color (black or white).
 */
export function getOptimalTextColor( backgroundColor ) {
	const background = getComputedBackgroundColor( backgroundColor );
	const isReadableWithBlackText = tinycolor.isReadable(
		background,
		'#000000'
	);

	return isReadableWithBlackText ? '#000000' : '#ffffff';
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
