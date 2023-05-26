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

	const isWWW = val?.startsWith( 'www.' );
	const isHTTPProtocol = /^(http|https)/.test( val ) && protocolIsValid;
	const isMailTo = val?.startsWith( 'mailto:' ) && protocolIsValid;
	const isTel = val?.startsWith( 'tel:' ) && protocolIsValid;
	const isInternal = val?.startsWith( '#' ) && isValidFragment( val );

	return isHTTPProtocol || isWWW || isMailTo || isTel || isInternal;
}
