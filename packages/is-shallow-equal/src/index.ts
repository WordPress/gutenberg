/**
 * Internal dependencies
 */
import isShallowEqualObjects from './objects';
import isShallowEqualArrays from './arrays';

export { default as isShallowEqualObjects } from './objects';
export { default as isShallowEqualArrays } from './arrays';

export type ComparableObject = Record< string, any >;

/**
 * Returns true if the two arrays or objects are shallow equal, or false
 * otherwise. Also handles primitive values, just in case.
 *
 * @param a First object or array to compare.
 * @param b Second object or array to compare.
 *
 * @return Whether the two values are shallow equal.
 */
export default function isShallowEqual( a: unknown, b: unknown ): boolean {
	if ( a && b ) {
		if ( a.constructor === Object && b.constructor === Object ) {
			return isShallowEqualObjects( a, b );
		} else if ( Array.isArray( a ) && Array.isArray( b ) ) {
			return isShallowEqualArrays( a, b );
		}
	}

	return a === b;
}
