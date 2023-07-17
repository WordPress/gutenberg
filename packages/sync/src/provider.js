/**
 * External dependencies
 */
// @ts-ignore
import * as Y from 'yjs';

/** @typedef {import('./types').ObjectType} ObjectType */
/** @typedef {import('./types').ObjectID} ObjectID */
/** @typedef {import('./types').ObjectConfig} ObjectConfig */
/** @typedef {import('./types').CRDTDoc} CRDTDoc */
/** @typedef {import('./types').ConnectDoc} ConnectDoc */
/** @typedef {import('./types').SyncProvider} SyncProvider */

/**
 * Create a sync provider.
 *
 * @param {ConnectDoc} connectLocal  Connect the document to a local database.
 * @param {ConnectDoc} connectRemote Connect the document to a remote sync connection.
 * @return {SyncProvider} Sync provider.
 */
export const createSyncProvider = ( connectLocal, connectRemote ) => {
	/**
	 * @type {Record<string,ObjectConfig>}
	 */
	const config = {};

	/**
	 * @type {Record<string,Record<string,()=>void>>}
	 */
	const listeners = {};

	/**
	 * @type {Record<string,Record<string,CRDTDoc>>}
	 */
	const docs = {};

	/**
	 * Registeres an object type.
	 *
	 * @param {ObjectType}   objectType   Object type to register.
	 * @param {ObjectConfig} objectConfig Object config.
	 */
	function register( objectType, objectConfig ) {
		config[ objectType ] = objectConfig;
	}

	/**
	 * Fetch data from local database or remote source.
	 *
	 * @param {ObjectType} objectType    Object type to load.
	 * @param {ObjectID}   objectId      Object ID to load.
	 * @param {Function}   handleChanges Callback to call when data changes.
	 */
	async function bootstrap( objectType, objectId, handleChanges ) {
		const doc = new Y.Doc();
		docs[ objectType ] = docs[ objectType ] || {};
		docs[ objectType ][ objectId ] = doc;

		const updateHandler = () => {
			const data = config[ objectType ].fromCRDTDoc( doc );
			handleChanges( data );
		};
		doc.on( 'update', updateHandler );

		// connect to locally saved database.
		const destroyLocalConnection = await connectLocal(
			objectId,
			objectType,
			doc
		);

		// Once the database syncing is done, start the remote syncing
		if ( connectRemote ) {
			await connectRemote( objectId, objectType, doc );
		}

		const loadRemotely = config[ objectType ].fetch;
		if ( loadRemotely ) {
			loadRemotely( objectId ).then( ( data ) => {
				doc.transact( () => {
					config[ objectType ].applyChangesToDoc( doc, data );
				} );
			} );
		}

		listeners[ objectType ] = listeners[ objectType ] || {};
		listeners[ objectType ][ objectId ] = () => {
			destroyLocalConnection();
			doc.off( 'update', updateHandler );
		};
	}

	/**
	 * Fetch data from local database or remote source.
	 *
	 * @param {ObjectType} objectType Object type to load.
	 * @param {ObjectID}   objectId   Object ID to load.
	 * @param {any}        data       Updates to make.
	 */
	async function update( objectType, objectId, data ) {
		const doc = docs[ objectType ][ objectId ];
		if ( ! doc ) {
			throw 'Error doc ' + objectType + ' ' + objectId + ' not found';
		}
		doc.transact( () => {
			config[ objectType ].applyChangesToDoc( doc, data );
		} );
	}

	/**
	 * Stop updating a document and discard it.
	 *
	 * @param {ObjectType} objectType Object type to load.
	 * @param {ObjectID}   objectId   Object ID to load.
	 */
	async function discard( objectType, objectId ) {
		if ( listeners?.[ objectType ]?.[ objectId ] ) {
			listeners[ objectType ][ objectId ]();
		}
	}

	return {
		register,
		bootstrap,
		update,
		discard,
	};
};
