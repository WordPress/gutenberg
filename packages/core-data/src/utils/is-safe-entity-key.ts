/**
 * Characters with special meaning in a URL path or query string, plus the
 * backslash and control characters.
 */
const UNSAFE_CHARACTERS = /[?#&\\\x00-\x1f\x7f]/;

/**
 * Checks whether an entity record key can be used in a REST path.
 *
 * Rejects URL delimiters, control characters, and dot segments, in their raw
 * and percent-encoded forms.
 *
 * @param key The entity record key to check. A key that is not a number,
 *            string, null or undefined is rejected.
 * @return True if the key can be used in a REST path.
 */
export default function isSafeEntityKey( key: unknown ): boolean {
	if ( key === null || key === undefined || typeof key === 'number' ) {
		return true;
	}
	if ( typeof key !== 'string' ) {
		return false;
	}
	// Keys such as `theme//slug` contain a raw `/`, but never an encoded one.
	if ( /%2f/i.test( key ) ) {
		return false;
	}
	// Check the percent-decoded form as well.
	const decoded = key.replace( /%([0-7][0-9a-f])/gi, ( match, hex ) =>
		String.fromCharCode( parseInt( hex, 16 ) )
	);
	if ( UNSAFE_CHARACTERS.test( decoded ) ) {
		return false;
	}
	return decoded
		.split( '/' )
		.every( ( segment ) => segment !== '.' && segment !== '..' );
}
