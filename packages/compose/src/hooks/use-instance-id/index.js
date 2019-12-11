/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Next id to use, if there are no free ids.
 */
let nextId = 0;

/**
 * Array to keep track of free ids.
 */
const freedIds = [];

/**
 * Find a free id.
 */
function findId() {
	if ( freedIds.length ) {
		return freedIds.pop();
	}

	return nextId++;
}

/**
 * Free an id.
 *
 * @param {number} id Id to free.
 */
function freeId( id ) {
	freedIds.push( id );
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
