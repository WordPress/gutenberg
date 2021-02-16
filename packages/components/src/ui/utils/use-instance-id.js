/**
 * Duplicated from @wordpress/compose to enable TypeScript support for ui/* files.
 */

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * @type {WeakMap<any, number>}
 */
const instanceMap = new WeakMap();

/**
 * Creates a new id for a given object.
 *
 * @param {unknown} object Object reference to create an id for.
 * @return {number} The instance id (index).
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
 * @param {string | number} [preferredId=''] Default ID to use.
 * @return {string | number} The unique instance id.
 */
export function useInstanceId( object, prefix, preferredId = '' ) {
	return useMemo( () => {
		if ( preferredId ) return preferredId;
		const id = createId( object );

		return prefix ? `${ prefix }-${ id }` : id;
	}, [ object ] );
}
