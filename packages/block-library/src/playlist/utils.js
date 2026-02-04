/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Transform media library image data into track image attributes.
 *
 * @param {Object} image - Image object from the media library.
 * @return {Object} Track image attributes for the playlist-track block.
 */
export function getTrackImageAttributes( image ) {
	const imageSrc = image?.src ?? image?.url;

	// Prevent using the default media attachment icon as the track image.
	if ( imageSrc?.endsWith( '/images/media/audio.svg' ) ) {
		return {
			image: '',
			imageAlt: '',
		};
	}

	return {
		// Note: Image is not available when a new track is uploaded.
		image: imageSrc,
		imageAlt: imageSrc ? image?.alt || image?.alt_text || '' : undefined,
	};
}

/**
 * Transform media library data into track block attributes.
 *
 * @param {Object} media - Media object from the media library.
 * @return {Object} Track attributes for the playlist-track block.
 */
export function getTrackAttributes( media ) {
	return {
		id: media.id || media.url, // Attachment ID or URL.
		src: media.url,
		title: media.title,
		artist:
			media.artist ||
			media?.meta?.artist ||
			media?.media_details?.artist ||
			__( 'Unknown artist' ),
		album:
			media.album ||
			media?.meta?.album ||
			media?.media_details?.album ||
			__( 'Unknown album' ),
		length: media?.fileLength || media?.media_details?.length_formatted,
		...getTrackImageAttributes( media?.image ),
	};
}

/**
 * Get the effective background color, falling back to body if transparent.
 *
 * @param {Element} element - The element to get the background color from.
 * @return {string} The background color.
 */
export function getEffectiveBackgroundColor( element ) {
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
 * Create a waveform container element with the specified attributes.
 *
 * @param {Object} options               - The options for the container.
 * @param {string} options.url           - The audio URL.
 * @param {string} options.waveformColor - The waveform bar color.
 * @param {string} options.progressColor - The progress indicator color.
 * @param {string} options.buttonColor   - The play button color.
 * @return {Element} The configured container element.
 */
export function createWaveformContainer( {
	url,
	waveformColor,
	progressColor,
	buttonColor,
} ) {
	const container = document.createElement( 'div' );
	container.setAttribute( 'data-waveform-player', '' );
	container.setAttribute( 'data-url', url );
	container.setAttribute( 'data-waveform-style', 'bars' );
	container.setAttribute( 'data-waveform-color', waveformColor );
	container.setAttribute( 'data-progress-color', progressColor );
	container.setAttribute( 'data-button-color', buttonColor );
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
