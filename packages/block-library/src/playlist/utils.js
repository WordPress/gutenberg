/**
 * Utilities specific to the playlist block.
 *
 * Shared waveform utilities (createWaveformContainer, getWaveformColors, etc.)
 * are in ../utils/waveform-utils.js.
 */

/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';
import { colord } from 'colord';

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
		uniqueId: uuid(), // Unique ID for the track.
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
 * Width of the waveform player button in pixels.
 * Keep in sync with $waveform-button-size in style.scss.
 */
export const WAVEFORM_BUTTON_WIDTH = 100;

/**
 * Get computed style for an element, using ownerDocument for iframe compatibility.
 *
 * @param {Element} element - The element to get styles from.
 * @return {CSSStyleDeclaration} The computed style.
 */
function getComputedStyleSafe( element ) {
	return element.ownerDocument.defaultView.getComputedStyle( element );
}

/**
 * Get the effective background color, falling back to body if transparent.
 *
 * @param {Element} element - The element to get the background color from.
 * @return {string} The background color.
 */
export function getEffectiveBackgroundColor( element ) {
	const blockContainer = element.closest( '.wp-block-playlist' );
	const target = blockContainer || element;
	let bgColor = getComputedStyleSafe( target ).backgroundColor;

	if ( ! bgColor || colord( bgColor ).alpha() === 0 ) {
		bgColor = getComputedStyleSafe(
			element.ownerDocument.body
		).backgroundColor;
	}

	return bgColor;
}

/**
 * Get the progress background color based on the background color.
 * Lightens light colors and darkens dark colors for contrast,
 * but reverses direction if already at white or black.
 *
 * @param {string} bgColor - The background color string (hex, rgb, or rgba format).
 * @param {number} amount  - The amount to adjust (0-1).
 * @return {string} The adjusted color as an rgb() string.
 */
export function getProgressBackgroundColor( bgColor, amount = 0.25 ) {
	const parsed = colord( bgColor );
	if ( ! parsed.isValid() ) {
		return bgColor;
	}

	const { r, g, b } = parsed.toRgb();

	// Calculate perceived brightness (0-255).
	const brightness = ( r * 299 + g * 587 + b * 114 ) / 1000;

	// Determine if we should lighten or darken.
	// Light colors get lighter, dark colors get darker.
	// But if already at an extreme (near white/black), reverse direction.
	const isLight = brightness > 128;
	const isNearWhite = brightness > 240;
	const isNearBlack = brightness < 30;

	let shouldLighten;
	if ( isNearWhite ) {
		shouldLighten = false; // Near white: darken for contrast.
	} else if ( isNearBlack ) {
		shouldLighten = true; // Near black: lighten for contrast.
	} else {
		shouldLighten = isLight; // Normal: lighten light colors, darken dark colors.
	}

	let newR, newG, newB;
	if ( shouldLighten ) {
		// Lighten: move towards 255.
		newR = Math.round( r + ( 255 - r ) * amount );
		newG = Math.round( g + ( 255 - g ) * amount );
		newB = Math.round( b + ( 255 - b ) * amount );
	} else {
		// Darken: move towards 0.
		newR = Math.round( r * ( 1 - amount ) );
		newG = Math.round( g * ( 1 - amount ) );
		newB = Math.round( b * ( 1 - amount ) );
	}

	return `rgb(${ newR }, ${ newG }, ${ newB })`;
}
