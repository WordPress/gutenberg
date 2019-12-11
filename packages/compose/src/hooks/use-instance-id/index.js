/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Array to keep track of allocated ids.
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
 * Provides a unique instance ID.
 */
export default function useInstanceId() {
	// Take advantage of useMemo to get the same id throughout the life of a
	// component.
	const id = useMemo( findId, [] );
	// Free up the id when the comonent unmounts. This must depend on `id` since
	// useMemo is not guaranteed to return the same id throughout the life of
	// the component.
	useEffect( () => () => freeId( id ), [ id ] );
	return id;
}
