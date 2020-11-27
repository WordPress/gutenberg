/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/** @type {WeakMap<Object, number>} */
const instanceMap = new WeakMap();

/**
 * Creates a new ID for a given object.
 *
 * @param {Object} object Object reference to create an id for.
 * @return {number} ID
 */
function createId( object ) {
	const instances = instanceMap.get( object ) || 0;
	instanceMap.set( object, instances + 1 );
	return instances;
}

/**
 * Provides a unique instance ID.
 *
 * @param {Object} object   Object to create an id for.
 * @param {string} [prefix] Prefix for the unique id.
 * @param {string} [preferredId] Default ID to use.
 * @return {string | number} Instance ID
 */
export default function useInstanceId( object, prefix, preferredId = '' ) {
	return useMemo( () => {
		if ( preferredId ) return preferredId;
		const id = createId( object );

		return prefix ? `${ prefix }-${ id }` : id;
	}, [ object ] );
}
