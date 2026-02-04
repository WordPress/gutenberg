/**
 * Shared utilities for the playlist block.
 */

/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * Get the effective background color, falling back to body if transparent.
 *
 * @param {Element} element - The element to get the background color from.
 * @return {string} The background color.
 */
function getEffectiveBackgroundColor( element ) {
	const blockContainer = element.closest( '.wp-block-playlist' );
	let bgColor = blockContainer
		? window.getComputedStyle( blockContainer ).backgroundColor
		: window.getComputedStyle( element ).backgroundColor;

	const isTransparent =
		! bgColor ||
		bgColor === 'transparent' ||
		bgColor === 'rgba(0, 0, 0, 0)' ||
		bgColor.match( /rgba\([^)]+,\s*0\s*\)/ );

	if ( isTransparent ) {
		bgColor = window.getComputedStyle( document.body ).backgroundColor;
	}

	return bgColor;
}

/**
 * Get all colors needed for the waveform player based on the element's styles.
 *
 * @param {Element} element - The element to derive colors from.
 * @return {Object} Object containing textColor, bgColor, waveformColor, progressColor.
 */
export function getWaveformColors( element ) {
	const textColor = window.getComputedStyle( element ).color;
	const bgColor = getEffectiveBackgroundColor( element );
	const waveformColor = colord( textColor ).alpha( 0.3 ).toRgbString();
	const progressColor = colord( textColor ).alpha( 0.6 ).toRgbString();

	return { textColor, bgColor, waveformColor, progressColor };
}

/**
 * Create a waveform container element with the specified attributes.
 *
 * @param {Object} options               - The options for the container.
 * @param {string} options.url           - The audio URL.
 * @param {string} options.title         - The track title.
 * @param {string} options.artist        - The track artist.
 * @param {string} options.artwork       - The album artwork URL.
 * @param {string} options.waveformColor - The waveform bar color.
 * @param {string} options.progressColor - The progress indicator color.
 * @param {string} options.buttonColor   - The play button color.
 * @return {Element} The configured container element.
 */
export function createWaveformContainer( {
	url,
	title,
	artist,
	artwork,
	waveformColor,
	progressColor,
	buttonColor,
} ) {
	const container = document.createElement( 'div' );
	container.setAttribute( 'data-waveform-player', '' );
	container.setAttribute( 'data-url', url );
	container.setAttribute( 'data-height', '100' );
	container.setAttribute( 'data-waveform-style', 'bars' );
	container.setAttribute( 'data-waveform-color', waveformColor );
	container.setAttribute( 'data-progress-color', progressColor );
	container.setAttribute( 'data-button-color', buttonColor );
	if ( title ) {
		container.setAttribute( 'data-title', title );
	}
	if ( artist ) {
		container.setAttribute( 'data-subtitle', artist );
	}
	if ( artwork ) {
		container.setAttribute( 'data-artwork', artwork );
	}
	return container;
}

/**
 * Apply background color to SVG icon paths for contrast.
 *
 * @param {Element} container - The waveform container element.
 * @param {string}  bgColor   - The background color to apply.
 */
export function styleSvgIcons( container, bgColor ) {
	const svgPaths = container.querySelectorAll( 'svg path' );
	svgPaths.forEach( ( path ) => {
		path.style.fill = bgColor;
	} );
}
