/**
 * Given a function, returns an enhanced function which caches the result and
 * tracks in WeakMap. The result is only cached if the original function is
 * passed a valid object-like argument (requirement for WeakMap key).
 *
 * @param fn Original function.
 *
 * @return Enhanced caching function.
 */
function withWeakMapCache< K, V >( fn: ( key: K ) => V ): ( key: K ) => V {
	const cache = new WeakMap< object, V >();

	return ( key ) => {
		let value: V;
		// `has` and `get` accept any value, returning nothing for a non-object.
		if ( cache.has( key as object ) ) {
			// Found above.
			value = cache.get( key as object )!;
		} else {
			value = fn( key );

			// Can reach here if key is not valid for WeakMap, since `has`
			// will return false for invalid key. Since `set` will throw,
			// ensure that key is valid before setting into cache.
			if ( key !== null && typeof key === 'object' ) {
				cache.set( key, value );
			}
		}

		return value;
	};
}

export default withWeakMapCache;
