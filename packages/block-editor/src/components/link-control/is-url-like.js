/**
 * WordPress dependencies
 */
import { getProtocol, isValidProtocol, isValidFragment } from '@wordpress/url';

/**
 * Determines whether a given value could be a URL. Note this does not
 * guarantee the value is a URL only that it looks like it might be one. For
 * example, just because a string has `www.` in it doesn't make it a URL,
 * but it does make it highly likely that it will be so in the context of
 * creating a link it makes sense to treat it like one.
 *
 * @param {string} val the candidate for being URL-like (or not).
 *
 * @return {boolean} whether or not the value is potentially a URL.
 */
export default function isURLLike( val ) {
	const hasSpaces = val.includes( ' ' );

	if ( hasSpaces ) {
		return false;
	}

	const protocol = getProtocol( val );
	const protocolIsValid = isValidProtocol( protocol );

	// Protocols like mailto:, tel:, etc. are valid without domain validation.
	if ( protocolIsValid && ! /^(https?|ftp):$/i.test( protocol ) ) {
		return true;
	}

	const urlWithoutProtocol = protocol ? val.slice( protocol.length ) : val;
	const urlForValidation = urlWithoutProtocol.replace( /^\/\//, '' );
	const hasValidDomainTLD = isValidDomainTLD( urlForValidation );

	const isWWW = val?.startsWith( 'www.' );

	const isInternal = val?.startsWith( '#' ) && isValidFragment( val );

	return isWWW || isInternal || hasValidDomainTLD;
}

/**
 * Validates and checks if a URL has a valid domain and TLD structure.
 * Validates according several RFC 1035 rules:
 * - Labels can only contain alphanumeric characters and hyphens
 * - Labels cannot start or end with a hyphen
 * - TLD must be alphabetic only (2-63 chars)
 * Note: Subdomains may have non-standard characters (like underscores),
 * but the domain and TLD must be valid.
 *
 * @param {string} url - The URL to check (without protocol).
 * @return {boolean} Returns true if URL has a valid domain+TLD structure, false otherwise.
 */
function isValidDomainTLD( url ) {
	// Clean the URL by removing anything after the first occurrence of "?" or "#".
	const cleanedURL = url.split( /[?#]/ )[ 0 ];

	// Handling userinfo (user@host).
	const hostname = cleanedURL.split( '/' )[ 0 ].split( '@' ).pop() || '';

	// Handling port
	const hostnameWithoutPort = hostname.split( ':' )[ 0 ];

	// Get only domain and TLD
	const hostParts = hostnameWithoutPort.split( '.' );
	if ( hostParts.length < 2 ) {
		return false;
	}

	const tld = hostParts[ hostParts.length - 1 ];
	const domain = hostParts[ hostParts.length - 2 ];

	// TLD: alphabetic only (2-63 chars).
	if ( ! /^[a-zA-Z]{2,63}$/.test( tld ) ) {
		return false;
	}

	// Domain: alphanumeric and hyphens only, cannot start/end with hyphen (1-63 chars).
	if ( ! /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test( domain ) ) {
		return false;
	}

	return true;
}
