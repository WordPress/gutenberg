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
 * External dependencies
 */
import { colord } from 'colord';

/**
 * Configuration constants.
 * Note: DEFAULT_WAVEFORM_HEIGHT should match $waveform-player-height in style.scss.
 */
const DEFAULT_WAVEFORM_HEIGHT = 100;

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
 * @param {number} options.height        - The waveform height in pixels.
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
	height = DEFAULT_WAVEFORM_HEIGHT,
} ) {
	const container = document.createElement( 'div' );
	container.setAttribute( 'data-waveform-player', '' );
	container.setAttribute( 'data-url', url );
	container.setAttribute( 'data-height', String( height ) );
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
 * Apply contrasting color to SVG icon paths for visibility.
 * The icons should contrast with the button background (which uses textColor).
 *
 * @param {Element} container   - The waveform container element.
 * @param {string}  buttonColor - The button background color (textColor).
 */
export function styleSvgIcons( container, buttonColor ) {
	// Compute a contrasting color for the icons based on button brightness.
	const isButtonDark = colord( buttonColor ).isDark();
	const iconColor = isButtonDark ? '#ffffff' : '#000000';

	const svgPaths = container.querySelectorAll( 'svg path' );
	svgPaths.forEach( ( path ) => {
		path.style.fill = iconColor;
	} );
}

/**
 * Ensure the waveform title, subtitle, and duration elements have the correct content.
 * WaveformPlayer may not populate these correctly in certain contexts (e.g., editor iframe).
 *
 * @param {Element} container - The waveform container element.
 * @param {string}  title     - The track title.
 * @param {string}  artist    - The track artist (subtitle).
 * @param {string}  duration  - The track duration (e.g., "1:30").
 */
export function ensureWaveformText( container, title, artist, duration ) {
	const titleEl = container.querySelector( '.waveform-title' );
	const subtitleEl = container.querySelector( '.waveform-subtitle' );
	const timeEl = container.querySelector( '.waveform-time' );

	if ( titleEl && title && ! titleEl.textContent ) {
		titleEl.textContent = title;
	}
	if ( subtitleEl && artist && ! subtitleEl.textContent ) {
		subtitleEl.textContent = artist;
	}
	// Set the duration if available and currently showing 0:00 / 0:00.
	if ( timeEl && duration && timeEl.textContent?.includes( '0:00 / 0:00' ) ) {
		timeEl.textContent = `0:00 / ${ duration }`;
	}
}
