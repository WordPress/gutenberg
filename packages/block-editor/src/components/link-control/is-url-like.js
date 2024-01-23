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

	const mayBeTLD = hasPossibleTLD( val );

	const isWWW = val?.startsWith( 'www.' );

	const isInternal = val?.startsWith( '#' ) && isValidFragment( val );

	return protocolIsValid || isWWW || isInternal || mayBeTLD;
}

/**
 * Checks if a given URL has a valid Top-Level Domain (TLD).
 *
 * @param {string} url       - The URL to check.
 * @param {number} maxLength - The maximum length of the TLD.
 * @return {boolean} Returns true if the URL has a valid TLD, false otherwise.
 */
function hasPossibleTLD( url, maxLength = 6 ) {
	// Clean the URL by removing anything after the first occurrence of "?" or "#".
	const cleanedURL = url.split( /[?#]/ )[ 0 ];

	// Regular expression explanation:
	// - (?<=\S)                  : Positive lookbehind assertion to ensure there is at least one non-whitespace character before the TLD
	// - \.                       : Matches a literal dot (.)
	// - [a-zA-Z_]{2,maxLength}   : Matches 2 to maxLength letters or underscores, representing the TLD
	// - (?:\/|$)                 : Non-capturing group that matches either a forward slash (/) or the end of the string
	const regex = new RegExp(
		`(?<=\\S)\\.(?:[a-zA-Z_]{2,${ maxLength }})(?:\\/|$)`
	);

	return regex.test( cleanedURL );
}
