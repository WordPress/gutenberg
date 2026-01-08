/**
 * External dependencies
 */
// @ts-ignore
import { IndexeddbPersistence } from 'y-indexeddb';

/** @typedef {import('../types').ObjectType} ObjectType */
/** @typedef {import('../types').ObjectID} ObjectID */
/** @typedef {import('../types').CRDTDoc} CRDTDoc */
/** @typedef {import('../types').ProviderCreator} ProviderCreator */
/** @typedef {import('../types').ProviderCreatorResult} ProviderCreatorResult */

/**
 * Connect function to the IndexedDB persistence provider.
 *
 * @param {ObjectType} objectType The object type.
 * @param {ObjectID}   objectId   The object ID.
 * @param {CRDTDoc}    doc        The CRDT document.
 *
 * @return {Promise< ProviderCreatorResult >} Promise that resolves when the connection is established.
 */
export function createIndexedDbProvider( objectType, objectId, doc ) {
	const roomName = `${ objectType }-${ objectId }`;
	const provider = new IndexeddbPersistence( roomName, doc );

	return Promise.resolve( {
		destroy: () => provider.destroy(),
	} );
}
