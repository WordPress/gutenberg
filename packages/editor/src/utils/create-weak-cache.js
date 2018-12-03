/**
 * Returns a function which caches a computed value on a given object key. Due
 * to its caching being achieved by WeakCache, the function must only accept a
 * valid WeakMap key as its argument (objects, arrays). The function is only
 * passed the key; any other arguments are discarded.
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
 *
 * @param {Function} getCacheValue Function to compute the cache value.
 *
 * @return {Function} Function whose computed value is weakly cached.
 */
function createWeakCache( getCacheValue ) {
	const cache = new WeakMap();

	return ( key ) => {
		if ( ! cache.has( key ) ) {
			cache.set( key, getCacheValue( key ) );
		}

		return cache.get( key );
	};
}

export default createWeakCache;
