import { getProtocol, isValidProtocol, isValidFragment } from '@wordpress/url';

/**
 * Checks if a value is a hash/anchor link (e.g., #section).
 *
 * @param val The value to check.
 * @return True if the value is a valid hash link.
 */
export function isHashLink( val: string | undefined ): boolean | undefined {
	return val?.startsWith( '#' ) && isValidFragment( val );
}

/**
 * Checks if a value is a relative path (e.g., /page, ./page, ../page).
 *
 * @param val The value to check.
 * @return True if the value is a relative path.
 */
export function isRelativePath( val: string | undefined ): boolean | undefined {
	return (
		val?.startsWith( '/' ) ||
		val?.startsWith( './' ) ||
		val?.startsWith( '../' )
	);
}

/**
 * Determines whether a given value could be a URL or valid href value (like
 * relative paths or hash links). Note this does not guarantee the value is a
 * URL only that it looks like something that should be treated as direct entry
 * rather than a search term. For example, just because a string has `www.` in
 * it doesn't make it a URL, but it does make it highly likely that it will be
 * so in the context of creating a link it makes sense to treat it like one.
 *
 * Examples of "URL-like" values:
 * - URLs with protocols: `https://wordpress.org`, `mailto:test@example.com`
 * - Domain-like strings: `www.wordpress.org`, `wordpress.org`
 * - Relative paths: `/handbook`, `./page`, `../parent`
 * - Hash links: `#section`
 *
 * @param val the candidate for being URL-like (or not).
 *
 * @return whether or not the value is potentially a URL.
 */
export default function isURLLike( val: string ): boolean | undefined {
	const hasSpaces = val.includes( ' ' );

	if ( hasSpaces ) {
		return false;
	}

	const protocol = getProtocol( val );
	// `isValidProtocol` rejects a missing protocol.
	const protocolIsValid = isValidProtocol( protocol as string );

	const mayBeTLD = hasPossibleTLD( val );

	const isWWW = val?.startsWith( 'www.' );

	return (
		protocolIsValid ||
		isWWW ||
		isHashLink( val ) ||
		mayBeTLD ||
		isRelativePath( val )
	);
}

/**
 * Checks if a given URL has a valid Top-Level Domain (TLD).
 *
 * @param url       - The URL to check.
 * @param maxLength - The maximum length of the TLD.
 * @return Returns true if the URL has a valid TLD, false otherwise.
 */
function hasPossibleTLD( url: string, maxLength = 6 ): boolean {
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
