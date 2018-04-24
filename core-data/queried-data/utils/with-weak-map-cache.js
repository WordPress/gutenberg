/**
 * External dependencies
 */
import { isObjectLike } from 'lodash';

/**
 * Given a function, returns an enhanced function which caches the result and
 * tracks in WeakMap. The result is only cached if the original function is
 * passed a valid object-like argument (requirement for WeakMap key).
 *
 * @param {Function} fn Original function.
 *
 * @return {Function} Enhanced caching function.
 */
function withWeakMapCache( fn ) {
	const cache = new WeakMap();

	return function( key ) {
		let value;
		if ( cache.has( key ) ) {
			value = cache.get( key );
		} else {
			value = fn( key );

			// Can reach here if key is not valid for WeakMap, since `has`
			// will return false for invalid key. Since `set` will throw,
			// ensure that key is valid before setting into cache.
			if ( isObjectLike( key ) ) {
				cache.set( key, value );
			}
		}

		return value;
	};
}

export default withWeakMapCache;
