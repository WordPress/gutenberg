/**
 * Internal dependencies
 */
import isShallowEqualObjects from './objects';
import isShallowEqualArrays from './arrays';

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
const isShallowEqualBase = function isShallowEqual(
	a: unknown,
	b: unknown
): boolean {
	if ( a && b ) {
		if ( a.constructor === Object && b.constructor === Object ) {
			return isShallowEqualObjects( a, b );
		} else if ( Array.isArray( a ) && Array.isArray( b ) ) {
			return isShallowEqualArrays( a, b );
		}
	}

	return a === b;
};

// `wpScriptDefaultExport` exposes `window.wp.isShallowEqual` as the callable
// default export. Attach the named helpers to preserve the existing global API.
const isShallowEqual = Object.assign( isShallowEqualBase, {
	isShallowEqual: isShallowEqualBase,
	isShallowEqualObjects,
	isShallowEqualArrays,
} );

export default isShallowEqual;
export { isShallowEqual, isShallowEqualObjects, isShallowEqualArrays };
