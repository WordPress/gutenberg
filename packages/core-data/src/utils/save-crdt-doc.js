/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { getSyncManager } from '../sync';

const SYNC_SAVE_API_PATH = '/wp-sync/v1/save';
const saveCRDTDocQueues = new Map();

async function serializeAndSaveCRDTDoc( objectType, objectId, room ) {
	const serializedDoc = await getSyncManager()?.createPersistedCRDTDoc(
		objectType,
		objectId
	);

	if ( ! serializedDoc ) {
		return;
	}

	await apiFetch( {
		path: SYNC_SAVE_API_PATH,
		method: 'POST',
		data: {
			room,
			doc: serializedDoc,
		},
	} );
}

/**
 * Persist the current CRDT document through the sync /save endpoint.
 *
 * @param {import('@wordpress/sync').ObjectType} objectType Object type.
 * @param {import('@wordpress/sync').ObjectID}   objectId   Object ID.
 */
export async function saveCRDTDoc( objectType, objectId ) {
	const room = `${ objectType }:${ objectId }`;

	// Saves are chained per-room, which forms a queue.
	// Without a queue, two /save calls might fire close together with a risk
	// that the older serialized CRDT snapshot completes after the newer one and
	// overwrites it with stale data.
	// Wait for the prior request chain to complete before firing the next save.
	const previousSave = saveCRDTDocQueues.get( room ) || Promise.resolve();

	const currentSave = previousSave
		// A failed save should reject its caller, but not block later saves.
		.catch( () => {} )
		.then( () => serializeAndSaveCRDTDoc( objectType, objectId, room ) );

	saveCRDTDocQueues.set( room, currentSave );

	try {
		await currentSave;
	} finally {
		if ( saveCRDTDocQueues.get( room ) === currentSave ) {
			saveCRDTDocQueues.delete( room );
		}
	}
}
