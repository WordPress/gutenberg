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
	const trimmedUrl = url?.trim();

	if ( ! trimmedUrl ) {
		return { url: trimmedUrl, type: URL_TYPE };
	}

	let type = URL_TYPE;
	const protocol = getProtocol( trimmedUrl ) || '';

	// Determine the type based on the URL format
	if ( protocol.includes( 'mailto' ) ) {
		type = MAILTO_TYPE;
	} else if ( protocol.includes( 'tel' ) ) {
		type = TEL_TYPE;
	} else if ( trimmedUrl?.startsWith( '#' ) ) {
		type = INTERNAL_TYPE;
	}

	// Hash links, relative paths, query parameters, and URLs with protocols should not be modified
	if (
		isHashLink( trimmedUrl ) ||
		isRelativePath( trimmedUrl ) ||
		trimmedUrl.startsWith( '?' ) ||
		protocol
	) {
		return { url: trimmedUrl, type };
	}

	// Bare domains need https:// prepended
	return { url: prependHTTPS( trimmedUrl ), type };
}
