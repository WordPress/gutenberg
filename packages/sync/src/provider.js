/**
 * External dependencies
 */
// @ts-ignore
import * as Y from 'yjs';

/** @typedef {import('./types').ObjectType} ObjectType */
/** @typedef {import('./types').ObjectID} ObjectID */
/** @typedef {import('./types').ObjectConfig} ObjectConfig */
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

		const update = () => {
			const data = config[ objectType ].fromCRDTDoc( doc );
			handleChanges( data );
		};
		doc.on( 'update', update );

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
			doc.off( 'update', update );
		};
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
		discard,
	};
};
