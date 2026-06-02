/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { getSyncManager } from '../sync';

const SYNC_SAVE_API_PATH = '/wp-sync/v1/save';

/**
 * Persist the current CRDT document through the sync /save endpoint.
 *
 * @param {import('@wordpress/sync').ObjectType} objectType Object type.
 * @param {import('@wordpress/sync').ObjectID}   objectId   Object ID.
 */
export async function saveCRDTDoc( objectType, objectId ) {
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
			room: `${ objectType }:${ objectId }`,
			doc: serializedDoc,
		},
	} );
}
