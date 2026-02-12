/**
 * WordPress dependencies
 */
import { getProtocol, prependHTTPS } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { isHashLink, isRelativePath } from './is-url-like';
import { TEL_TYPE, MAILTO_TYPE, INTERNAL_TYPE, URL_TYPE } from './constants';

/**
 * Normalizes a URL string by adding https:// protocol if needed.
 * This function determines the final URL that will be saved.
 *
 * Normalization rules:
 * - Bare domains (wordpress.org, www.wordpress.org) → prepend https://
 * - URLs with explicit protocols (http://, https://, mailto:, tel:, etc.) → keep as-is
 * - Relative paths (/, ./, ../) → keep as-is
 * - Hash links (#section) → keep as-is
 *
 * @param {string} url - The URL to normalize
 * @return {Object} An object containing the normalized URL and its type
 */
export default function normalizeUrl( url ) {
	if ( ! url ) {
		return { url, type: URL_TYPE };
	}

	let type = URL_TYPE;
	const protocol = getProtocol( url ) || '';

	// Determine the type based on the URL format
	if ( protocol.includes( 'mailto' ) ) {
		type = MAILTO_TYPE;
	} else if ( protocol.includes( 'tel' ) ) {
		type = TEL_TYPE;
	} else if ( url?.startsWith( '#' ) ) {
		type = INTERNAL_TYPE;
	}

	// Hash links, relative paths, and URLs with protocols should not be modified
	if ( isHashLink( url ) || isRelativePath( url ) || protocol ) {
		return { url, type };
	}

	// Bare domains need https:// prepended
	return { url: prependHTTPS( url ), type };
}
