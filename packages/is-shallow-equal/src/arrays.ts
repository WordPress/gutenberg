/**
 * Returns true if the two arrays are shallow equal, or false otherwise.
 *
 * @param a First array to compare.
 * @param b Second array to compare.
 *
 * @return Whether the two arrays are shallow equal.
 */
export default function isShallowEqualArrays(
	a: unknown[],
	b: unknown[]
): boolean {
	if ( a === b ) {
		return true;
	}

	if ( a.length !== b.length ) {
		return false;
	}

	for ( let i = 0, len = a.length; i < len; i++ ) {
		if ( a[ i ] !== b[ i ] ) {
			return false;
		}
	}

	return true;
}
