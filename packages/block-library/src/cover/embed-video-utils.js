/**
 * WordPress dependencies
 */
import { getBlockVariations } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { matchesPatterns } from '../embed/util';

const DEFAULT_EMBED_BLOCK = 'core/embed';

// List of supported video providers for cover block backgrounds
const VIDEO_PROVIDERS = [
	'youtube',
	'vimeo',
	'videopress',
	'animoto',
	'tiktok',
	'wordpress-tv',
];

/**
 * Checks if a URL is a valid video embed URL from supported providers.
 *
 * @param {string} url The URL to validate.
 * @return {boolean} True if the URL matches a supported video provider pattern.
 */
export function isValidVideoEmbedUrl( url ) {
	if ( ! url ) {
		return false;
	}

	const embedBlock = findVideoEmbedProvider( url );
	return embedBlock !== null;
}

/**
 * Finds the embed provider for a given URL if it's a supported video provider.
 *
 * @param {string} url The URL to check.
 * @return {string|null} The provider name slug (e.g., 'youtube') or null if not found.
 */
export function getVideoEmbedProvider( url ) {
	const embedBlock = findVideoEmbedProvider( url );
	return embedBlock ? embedBlock.name : null;
}

/**
 * Finds a matching video embed block variation for the given URL.
 *
 * @param {string} url The URL to match against provider patterns.
 * @return {Object|null} The matching block variation or null if not found.
 */
function findVideoEmbedProvider( url ) {
	const embedVariations = getBlockVariations( DEFAULT_EMBED_BLOCK );

	if ( ! embedVariations ) {
		return null;
	}

	const matchingVariation = embedVariations.find( ( { patterns } ) =>
		matchesPatterns( url, patterns )
	);

	if (
		! matchingVariation ||
		! VIDEO_PROVIDERS.includes( matchingVariation.name )
	) {
		return null;
	}

	return matchingVariation;
}

/**
 * Extracts iframe src from embed HTML.
 *
 * @param {string} html The embed HTML.
 * @return {string|null} The iframe src URL or null if not found.
 */
export function getIframeSrc( html ) {
	if ( ! html ) {
		return null;
	}

	const srcMatch = html.match( /src=["']([^"']+)["']/ );
	return srcMatch ? srcMatch[ 1 ] : null;
}

/**
 * Detects the video provider from an iframe src URL.
 *
 * @param {string} src The iframe src URL.
 * @return {string|null} The provider name slug or null if not recognized.
 */
export function detectProviderFromSrc( src ) {
	if ( ! src ) {
		return null;
	}

	const lowerSrc = src.toLowerCase();

	if (
		lowerSrc.includes( 'youtube.com' ) ||
		lowerSrc.includes( 'youtu.be' )
	) {
		return 'youtube';
	}
	if ( lowerSrc.includes( 'vimeo.com' ) ) {
		return 'vimeo';
	}
	if ( lowerSrc.includes( 'videopress.com' ) ) {
		return 'videopress';
	}
	if ( lowerSrc.includes( 'animoto.com' ) ) {
		return 'animoto';
	}
	if ( lowerSrc.includes( 'tiktok.com' ) ) {
		return 'tiktok';
	}
	if ( lowerSrc.includes( 'wordpress.tv' ) ) {
		return 'wordpress-tv';
	}

	return null;
}

/**
 * Modifies an iframe src URL to add background video parameters.
 * Automatically detects the provider from the URL.
 *
 * @param {string} src The iframe src URL.
 * @return {string} The modified URL.
 */
export function getBackgroundVideoSrc( src ) {
	if ( ! src ) {
		return src;
	}

	try {
		const url = new URL( src );

		// Detect provider from the iframe src URL
		const provider = detectProviderFromSrc( src );

		// Add provider-specific parameters for background video behavior
		switch ( provider ) {
			case 'youtube':
				// YouTube parameters for background video
				url.searchParams.set( 'autoplay', '1' );
				url.searchParams.set( 'mute', '1' );
				url.searchParams.set( 'loop', '1' );
				url.searchParams.set( 'controls', '0' );
				url.searchParams.set( 'showinfo', '0' );
				url.searchParams.set( 'modestbranding', '1' );
				url.searchParams.set( 'playsinline', '1' );
				url.searchParams.set( 'rel', '0' );
				// For loop to work, we need the playlist parameter
				const videoId = url.pathname.split( '/' ).pop();
				if ( videoId ) {
					url.searchParams.set( 'playlist', videoId );
				}
				break;

			case 'vimeo':
				// Vimeo parameters for background video
				url.searchParams.set( 'autoplay', '1' );
				url.searchParams.set( 'muted', '1' );
				url.searchParams.set( 'loop', '1' );
				url.searchParams.set( 'background', '1' );
				url.searchParams.set( 'controls', '0' );
				break;

			case 'videopress':
			case 'wordpress-tv':
				// VideoPress parameters
				url.searchParams.set( 'autoplay', '1' );
				url.searchParams.set( 'loop', '1' );
				url.searchParams.set( 'muted', '1' );
				break;

			default:
				// Generic parameters that might work for other providers
				url.searchParams.set( 'autoplay', '1' );
				url.searchParams.set( 'muted', '1' );
				url.searchParams.set( 'loop', '1' );
				break;
		}

		return url.toString();
	} catch ( error ) {
		// If URL parsing fails, return original src
		return src;
	}
}
