/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Array to keey track of allocated ids.
 */
const allocatedIds = [];

/**
 * Find an unallocated id.
 */
function findId() {
	let id = allocatedIds.findIndex( ( allocated ) => ! allocated );

	if ( id === -1 ) {
		id = allocatedIds.length;
	}

	// Allocated the id.
	allocatedIds[ id ] = true;

	return id;
}

/**
 * Free an allocated id.
 *
 * @param {number} id Id to free.
 */
function freeId( id ) {
	delete allocatedIds[ id ];
}

/**
 * Provide a unique instance ID.
 */
export default function useInstanceId() {
	const id = useMemo( findId, [] );
	useEffect( () => () => freeId( id ), [] );
	return id;
}
