// TODO: Unit tests.

/**
 * Returns true if the given object has enumerable properties, or false
 * otherwise.
 *
 * @param {Object} object Object to test.
 *
 * @return {boolean} Whether object has enumerable properties.
 */
function hasEnumerableProperties( object ) {
	const keys = Object.getOwnPropertyNames( object );
	for ( const key of keys ) {
		if ( Object.getOwnPropertyDescriptor( object, key ).enumerable ) {
			return true;
		}
	}

	return false;
}

export default hasEnumerableProperties;
