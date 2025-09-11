/**
 * External dependencies
 */
import { IndexeddbPersistence } from 'y-indexeddb';

/**
 * Internal dependencies
 */
import type { ObjectType, ObjectID, CRDTDoc } from './types';

/**
 * Connect function to the IndexedDB persistence provider.
 *
 * @param objectId   The object ID.
 * @param objectType The object type.
 * @param doc        The CRDT document.
 *
 * @return Promise that resolves when the connection is established.
 */
export function connectIndexDb(
	objectId: ObjectID,
	objectType: ObjectType,
	doc: CRDTDoc
) {
	const roomName = `${ objectType }-${ objectId }`;
	const provider = new IndexeddbPersistence( roomName, doc );

	return new Promise< VoidFunction >( ( resolve ) => {
		provider.on( 'synced', () => {
			resolve( () => provider.destroy() );
		} );
	} );
}
