/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

const instancesMap = new WeakMap();

/**
 * Creates a new instance id for a given function.
 *
 * @param {Function} fn Function to use the id for.
 */
function findId( fn ) {
	const instances = instancesMap.get( fn ) || 0;
	instancesMap.set( fn, instances + 1 );
	return instances;
}

/**
 * Provides a unique instance ID.
 *
 * @param {Function} fn Function to use the id for.
 */
export default function useInstanceId( fn ) {
	return useMemo( () => findId( fn ), [ fn ] );
}
