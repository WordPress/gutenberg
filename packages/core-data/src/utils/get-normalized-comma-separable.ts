/**
 * Given a value which can be specified as one or the other of a comma-separated
 * string or an array, returns a value normalized to an array of strings, or
 * null if the value cannot be interpreted as either.
 *
 * @param  value
 *
 * @return Normalized field value.
 */
function getNormalizedCommaSeparable(
	value: string | string[]
): string[] | null {
	if ( typeof value === 'string' ) {
		return value.split( ',' );
	} else if ( Array.isArray( value ) ) {
		return value;
	}

	return null;
}

export default getNormalizedCommaSeparable;
