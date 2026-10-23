import apiFetch from '@wordpress/api-fetch';
import type { ObjectID, ObjectType } from '@wordpress/sync';
import { getSyncManager } from '../sync';

const SYNC_SAVE_API_PATH = '/wp-sync/v1/save';
const saveCRDTDocQueues = new Map< string, Promise< void > >();

async function serializeAndSaveCRDTDoc(
	objectType: ObjectType,
	objectId: ObjectID,
	room: string
): Promise< void > {
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
 * @param objectType Object type.
 * @param objectId   Object ID.
 */
export async function saveCRDTDoc(
	objectType: ObjectType,
	objectId: ObjectID
): Promise< void > {
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
