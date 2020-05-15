/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

const instanceMap = new WeakMap();

/**
 * Creates a new id for a given object.
 *
 * @param {Object} object Object reference to create an id for.
 */
function createId( object ) {
	const instances = instanceMap.get( object ) || 0;
	instanceMap.set( object, instances + 1 );
	return instances;
}

/**
 * Provides a unique instance ID.
 *
 * @param {Object} object Object reference to create an id for.
 * @param {string} prefix Prefix for the unique id.
 */
export default function useInstanceId( object, prefix ) {
	return useMemo( () => {
		const id = createId( object );
		return prefix ? `${ prefix }-${ id }` : id;
	}, [ object ] );
}
