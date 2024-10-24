/**
 * WordPress dependencies
 */
import { getProtocol, isValidProtocol } from '@wordpress/url';

// Please see packages/block-editor/src/components/link-control/is-url-like.js
export default function isURLLike( val ) {
	const hasSpaces = val.includes( ' ' );

	if ( hasSpaces ) {
		return false;
	}

	const protocol = getProtocol( val );
	const protocolIsValid = isValidProtocol( protocol );

	const mayBeTLD = hasPossibleTLD( val );

	const isWWW = val?.startsWith( 'www.' );

	return protocolIsValid || isWWW || mayBeTLD;
}

// Please see packages/block-editor/src/components/link-control/is-url-like.js
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
