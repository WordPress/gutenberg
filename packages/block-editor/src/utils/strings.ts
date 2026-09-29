/**
 * Escapes the RegExp special characters.
 *
 * @param string Input string.
 *
 * @return Regex-escaped string.
 */
export function escapeRegExp( string: string ): string {
	return string.replace( /[\\^$.*+?()[\]{}|]/g, '\\$&' );
}
