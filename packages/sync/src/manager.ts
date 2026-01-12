/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import {
	CRDT_DOC_VERSION,
	CRDT_RECORD_MAP_KEY as RECORD_KEY,
	LOCAL_SYNC_MANAGER_ORIGIN,
	CRDT_RECORD_METADATA_MAP_KEY as RECORD_METADATA_KEY,
	CRDT_RECORD_METADATA_SAVED_AT_KEY as SAVED_AT_KEY,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_VERSION_KEY,
} from './config';
import { createPersistedCRDTDoc, getPersistedCrdtDoc } from './persistence';
import { getProviderCreators } from './providers';
import type {
	CollectionHandlers,
	CRDTDoc,
	EntityID,
	ObjectID,
	ObjectData,
	ObjectType,
	ProviderCreator,
	RecordHandlers,
	SyncConfig,
	SyncManager,
	SyncUndoManager,
} from './types';
import { createUndoManager } from './undo-manager';
import { createYjsDoc, markEntityAsSaved } from './utils';
import { createAwareness } from './awareness/awareness-manager';

interface CollectionState {
	handlers: CollectionHandlers;
	syncConfig: SyncConfig;
	unload: () => void;
	ydoc: CRDTDoc;
}

interface EntityState {
	handlers: RecordHandlers;
	objectId: ObjectID;
	objectType: ObjectType;
	syncConfig: SyncConfig;
	unload: () => void;
	ydoc: CRDTDoc;
}

/**
 * The sync manager orchestrates the lifecycle of syncing entity records. It
 * creates Yjs documents, connects to providers, creates awareness instances,
 * and coordinates with the `core-data` store.
 */
export function createSyncManager(): SyncManager {
	const collectionStates: Map< ObjectType, CollectionState > = new Map();
	const entityStates: Map< EntityID, EntityState > = new Map();

	/**
	 * A "sync-aware" undo manager for all synced entities. It is lazily created
	 * when the first entity is loaded.
	 *
	 * IMPORTANT: In Gutenberg, the undo manager is effectively global and manages
	 * undo/redo state for all entities. If the default WPUndoManager is used,
	 * changes to entities are recorded in the `editEntityRecord` action:
	 *
	 * https://github.com/WordPress/gutenberg/blob/b63451e26e3c91b6bb291a2f9994722e3850417e/packages/core-data/src/actions.js#L428-L442
	 *
	 * In contrast, the `SyncUndoManager` only manages undo/redo for entities that
	 * **are being synced by this sync manager**. The `addRecord` method is still
	 * called in the code linked above, but it is a no-op. Yjs automatically tracks
	 * changes to entities via the associated CRDT doc:
	 *
	 * https://github.com/WordPress/gutenberg/blob/b63451e26e3c91b6bb291a2f9994722e3850417e/packages/sync/src/undo-manager.ts#L42-L48
	 *
	 * This means that if at least one entity is being synced, then undo/redo
	 * operations will be **restricted to synced entities only.**
	 *
	 * We could improve the `SyncUndoManager` to also track non-synced entities by
	 * delegating to a secondary `WPUndoManager`, but this would add complexity
	 * since we would need to maintain two separate undo/redo stacks and ensure
	 * that they retain ordering and integrity.
	 *
	 * However, we also anticipate that most entities being edited in Gutenberg
	 * will be synced entities (e.g. posts, pages, templates, template parts,
	 * etc.), so this limitation may be temporary.
	 */
	let undoManager: SyncUndoManager | undefined;

	/**
	 * Load an entity for syncing and manage its lifecycle.
	 *
	 * @param {SyncConfig}     syncConfig Sync configuration for the object type.
	 * @param {ObjectType}     objectType Object type.
	 * @param {ObjectID}       objectId   Object ID.
	 * @param {ObjectData}     record     Entity record representing this object type.
	 * @param {RecordHandlers} handlers   Handlers for updating and fetching the record.
	 */
	async function loadEntity(
		syncConfig: SyncConfig,
		objectType: ObjectType,
		objectId: ObjectID,
		record: ObjectData,
		handlers: RecordHandlers
	): Promise< void > {
		const providerCreators = getProviderCreators();

		if ( 0 === providerCreators.length ) {
			return; // No provider creators, so syncing is effectively disabled.
		}

		const entityId = getEntityId( objectType, objectId );

		if ( entityStates.has( entityId ) ) {
			return; // Already bootstrapped.
		}

		const ydoc = createYjsDoc( { objectType } );
		const recordMap = ydoc.getMap( RECORD_KEY );
		const recordMetaMap = ydoc.getMap( RECORD_METADATA_KEY );
		const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
		const now = Date.now();

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			providerResults.forEach( ( result ) => result.destroy() );
			recordMap.unobserveDeep( onRecordUpdate );
			recordMetaMap.unobserve( onRecordMetaUpdate );
			stateMap.unobserve( onStateUpdate );
			ydoc.destroy();
			entityStates.delete( entityId );
		};

		// When the CRDT document is updated by an UndoManager or a connection (not
		// a local origin), update the local store.
		const onRecordUpdate = (
			_events: Y.YEvent< any >[],
			transaction: Y.Transaction
		): void => {
			if (
				transaction.local &&
				! ( transaction.origin instanceof Y.UndoManager )
			) {
				return;
			}

			void updateEntityRecord( objectType, objectId );
		};

		const onRecordMetaUpdate = (
			event: Y.YMapEvent< unknown >,
			transaction: Y.Transaction
		) => {
			if ( transaction.local ) {
				return;
			}

			event.keysChanged.forEach( ( key ) => {
				switch ( key ) {
					case SAVED_AT_KEY:
						const newValue = recordMetaMap.get( SAVED_AT_KEY );
						if ( 'number' === typeof newValue && newValue > now ) {
							// Another peer has saved the record. Refetch it so that we have
							// a correct understanding of our own unsaved edits.
							void handlers.refetchRecord().catch( () => {} );
						}
						break;
				}
			} );
		};

		// Lazily create the undo manager when the first entity is loaded.
		if ( ! undoManager ) {
			undoManager = createUndoManager();
		}

		const { addUndoMeta, restoreUndoMeta } = handlers;
		undoManager.addToScope( recordMap, {
			addUndoMeta,
			restoreUndoMeta,
		} );

		const entityState: EntityState = {
			handlers,
			objectId,
			objectType,
			syncConfig,
			unload,
			ydoc,
		};

		entityStates.set( entityId, entityState );

		// Create awareness for the given entity and its Yjs document.
		const awareness = await createAwareness( objectType, objectId, ydoc );

		// Create providers for the given entity and its Yjs document.
		const providerResults = await Promise.all(
			providerCreators.map( ( create ) =>
				create( objectType, objectId, ydoc, awareness )
			)
		);

		// Attach observers.
		recordMap.observeDeep( onRecordUpdate );
		recordMetaMap.observe( onRecordMetaUpdate );

		const onStateUpdate = createVersionObserver(
			ydoc,
			( currentVersion, remoteVersion ) => {
				/* eslint-disable-next-line no-console */
				console.log(
					`Disconnecting due to version mismatch (local: ${ currentVersion }, remote: ${ remoteVersion })`
				);

				providerResults.forEach( ( result ) => result.destroy() );
			}
		);
		stateMap.observe( onStateUpdate );

		// Get and apply the persisted CRDT document, if it exists.
		applyPersistedCrdtDoc( objectType, objectId, record );

		// Announce our CRDT version to the network
		setupVersionAnnouncement( ydoc );
	}

	/**
	 * Load a collection for syncing and manage its lifecycle.
	 *
	 * @param {SyncConfig}         syncConfig Sync configuration for the object type.
	 * @param {ObjectType}         objectType Object type.
	 * @param {CollectionHandlers} handlers   Handlers for updating the collection.
	 */
	async function loadCollection(
		syncConfig: SyncConfig,
		objectType: ObjectType,
		handlers: CollectionHandlers
	): Promise< void > {
		const providerCreators: ProviderCreator[] = getProviderCreators();

		if ( 0 === providerCreators.length ) {
			return; // No provider creators, so syncing is effectively disabled.
		}

		if ( collectionStates.has( objectType ) ) {
			return; // Already loaded.
		}

		const ydoc = createYjsDoc( { collection: true, objectType } );
		const recordMetaMap = ydoc.getMap( RECORD_METADATA_KEY );
		const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
		const now = Date.now();

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			providerResults.forEach( ( result ) => result.destroy() );
			recordMetaMap.unobserve( onRecordMetaUpdate );
			stateMap.unobserve( onStateUpdate );
			ydoc.destroy();
			collectionStates.delete( objectType );
		};

		const onRecordMetaUpdate = (
			event: Y.YMapEvent< unknown >,
			transaction: Y.Transaction
		) => {
			if ( transaction.local ) {
				return;
			}

			event.keysChanged.forEach( ( key ) => {
				switch ( key ) {
					case SAVED_AT_KEY:
						const newValue = recordMetaMap.get( SAVED_AT_KEY );
						if ( 'number' === typeof newValue && newValue > now ) {
							// Another peer has mutated the collection. Refetch it so that we
							// obtain the updated records.
							void handlers.refetchRecords().catch( () => {} );
						}
						break;
				}
			} );
		};

		const collectionState: CollectionState = {
			handlers,
			syncConfig,
			unload,
			ydoc,
		};

		collectionStates.set( objectType, collectionState );

		// Create providers for the given entity and its Yjs document.
		const providerResults = await Promise.all(
			providerCreators.map( ( create ) => {
				return create( objectType, null, ydoc );
			} )
		);

		// Attach observers.
		recordMetaMap.observe( onRecordMetaUpdate );

		const onStateUpdate = createVersionObserver(
			ydoc,
			( currentVersion, remoteVersion ) => {
				// Disconnect providers when outdated client is detected
				/* eslint-disable-next-line no-console */
				console.log(
					`Disconnecting due to version mismatch (local: ${ currentVersion }, remote: ${ remoteVersion })`
				);

				providerResults.forEach( ( result ) => result.destroy() );
			}
		);
		stateMap.observe( onStateUpdate );

		// Announce our CRDT version to the network
		setupVersionAnnouncement( ydoc );
	}

	/**
	 * Unload an entity, stop syncing, destroy its in-memory state, and trigger an
	 * update of the collection.
	 *
	 * @param {ObjectType} objectType Object type to discard.
	 * @param {ObjectID}   objectId   Object ID to discard, or null for collections.
	 */
	function unloadEntity( objectType: ObjectType, objectId: ObjectID ): void {
		entityStates.get( getEntityId( objectType, objectId ) )?.unload();
		updateCRDTDoc( objectType, null, {}, origin, true /* isSave */ );
	}

	/**
	 * Get the entity ID for the given object type and object ID.
	 *
	 * @param {ObjectType}    objectType Object type.
	 * @param {ObjectID|null} objectId   Object ID.
	 */
	function getEntityId(
		objectType: ObjectType,
		objectId: ObjectID | null
	): EntityID {
		return `${ objectType }_${ objectId }`;
	}

	/**
	 * Load and inspect the persisted CRDT document. If supported and it exists,
	 * compare it against the current entity record. If there are differences,
	 * apply the changes from the entity record.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 * @param {ObjectData} record     Entity record representing this object type.
	 */
	function applyPersistedCrdtDoc(
		objectType: ObjectType,
		objectId: ObjectID,
		record: ObjectData
	): void {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState ) {
			return;
		}

		const {
			handlers,
			syncConfig: {
				applyChangesToCRDTDoc,
				getChangesFromCRDTDoc,
				supports,
			},
			ydoc: targetDoc,
		} = entityState;

		if ( ! supports?.crdtPersistence ) {
			// Apply the current record as changes.
			targetDoc.transact( () => {
				applyChangesToCRDTDoc( targetDoc, record );
			}, LOCAL_SYNC_MANAGER_ORIGIN );
			return;
		}

		// Get the persisted CRDT document, if it exists.
		const tempDoc = getPersistedCrdtDoc( record );

		if ( ! tempDoc ) {
			// Apply the current record as changes and trigger a save, which will
			// persist the CRDT document. (The entity should call `createEntityMeta`
			// via its pre-persist hook.)
			targetDoc.transact( () => {
				applyChangesToCRDTDoc( targetDoc, record );
				handlers.saveRecord();
			}, LOCAL_SYNC_MANAGER_ORIGIN );
			return;
		}

		// Check the version of the persisted document
		const tempStateMap = tempDoc.getMap( CRDT_STATE_MAP_KEY );
		const persistedVersion = tempStateMap.get( CRDT_STATE_VERSION_KEY ) as
			| number
			| undefined;

		// If we're at a lower version than persisted, this client is outdated.
		if (
			persistedVersion !== undefined &&
			persistedVersion > CRDT_DOC_VERSION
		) {
			/* eslint-disable-next-line no-console */
			console.error(
				`Cannot load persisted document: local version (${ CRDT_DOC_VERSION }) is older than persisted version (${ persistedVersion }). Please refresh the page.`
			);
			tempDoc.destroy();

			// Unload the entity (this will destroy providers and clean up)
			entityState.unload();

			return;
		}

		// If we're at a later version than persisted, trash the persisted doc
		// and save our version.
		if (
			persistedVersion !== undefined &&
			persistedVersion < CRDT_DOC_VERSION
		) {
			tempDoc.destroy();

			// Apply the current record as changes and trigger a save
			applyChangesToCRDTDoc( targetDoc, record );
			handlers.saveRecord();
			return;
		}

		// Apply the persisted document to the current document as a single update.
		// This is done even if the persisted document has been invalidated. This
		// prevents a newly joining peer (or refreshing user) from re-initializing
		// the CRDT document (the "initialization problem").
		//
		// IMPORTANT: Do not wrap this in a transaction with the local origin. It
		// effectively advances the state vector for the current client, which causes
		// Yjs to think that another client is using this client ID.
		const update = Y.encodeStateAsUpdateV2( tempDoc );
		Y.applyUpdateV2( targetDoc, update );

		// Compute the differences between the persisted doc and the current
		// record. This can happen when:
		//
		// 1. The server makes updates on save that mutate the entity. Example: On
		//    initial save, the server adds the "Uncategorized" category to the
		//    post.
		// 2. An "out-of-band" update occurs. Example: a WP-CLI command or direct
		//    database update mutates the entity.
		// 3. Unsaved changes are synced from a peer _before_ this code runs. We
		//    can't control when (or if) remote changes are synced, so this is a
		//    race condition.
		const invalidations = getChangesFromCRDTDoc( tempDoc, record );
		const invalidatedKeys = Object.keys( invalidations );

		// Destroy the temporary document to prevent leaks.
		tempDoc.destroy();

		if ( 0 === invalidatedKeys.length ) {
			// The persisted CRDT document is valid. There are no updates to apply.
			return;
		}

		// Use the invalidated keys to get the updated values from the entity.
		const changes = invalidatedKeys.reduce(
			( acc, key ) =>
				Object.assign( acc, {
					[ key ]: record[ key ],
				} ),
			{}
		);

		// Apply the changes and trigger a save, which will persist the CRDT
		// document. (The entity should call `createEntityMeta` via its pre-persist
		// hook.)
		targetDoc.transact( () => {
			applyChangesToCRDTDoc( targetDoc, changes );
			handlers.saveRecord();
		}, LOCAL_SYNC_MANAGER_ORIGIN );
	}

	/**
	 * Update CRDT document with changes from the local store.
	 *
	 * @param {ObjectType}            objectType Object type.
	 * @param {ObjectID}              objectId   Object ID.
	 * @param {Partial< ObjectData >} changes    Updates to make.
	 * @param {string}                origin     The source of change.
	 * @param {boolean}               isSave     Whether this update is part of a save operation.
	 */
	function updateCRDTDoc(
		objectType: ObjectType,
		objectId: ObjectID | null,
		changes: Partial< ObjectData >,
		origin: string,
		isSave: boolean = false
	): void {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );
		const collectionState = collectionStates.get( objectType );

		if ( entityState ) {
			const { syncConfig, ydoc } = entityState;
			ydoc.transact( () => {
				syncConfig.applyChangesToCRDTDoc( ydoc, changes );

				if ( isSave ) {
					markEntityAsSaved( ydoc );
				}
			}, origin );
		}

		if ( collectionState && isSave ) {
			collectionState.ydoc.transact( () => {
				markEntityAsSaved( collectionState.ydoc );
			}, origin );
		}
	}

	/**
	 * Update the entity record in the local store with changes from the CRDT
	 * document.
	 *
	 * @param {ObjectType} objectType Object type of record to update.
	 * @param {ObjectID}   objectId   Object ID of record to update.
	 */
	async function updateEntityRecord(
		objectType: ObjectType,
		objectId: ObjectID
	): Promise< void > {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState ) {
			return;
		}

		const { handlers, syncConfig, ydoc } = entityState;

		// Determine which synced properties have actually changed by comparing
		// them against the current edited entity record.
		const changes = syncConfig.getChangesFromCRDTDoc(
			ydoc,
			await handlers.getEditedRecord()
		);

		if ( 0 === Object.keys( changes ).length ) {
			return;
		}

		// This is a good spot to debug to see which changes are being synced. Note
		// that `blocks` will always appear in the changes, but will only result
		// in an update to the store if the blocks have changed.

		handlers.editRecord( changes );
	}

	/**
	 * Create object meta to persist the CRDT document in the entity record.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 */
	function createEntityMeta(
		objectType: ObjectType,
		objectId: ObjectID
	): Record< string, string > {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState?.syncConfig.supports?.crdtPersistence ) {
			return {};
		}

		return createPersistedCRDTDoc( entityState.ydoc );
	}

	return {
		createMeta: createEntityMeta,
		load: loadEntity,
		loadCollection,
		// Use getter to ensure we always return the current value of `undoManager`.
		get undoManager(): SyncUndoManager | undefined {
			return undoManager;
		},
		unload: unloadEntity,
		update: updateCRDTDoc,
	};
}

/**
 * Creates a version observer function that monitors the CRDT state map for
 * version changes. The observer invokes the callback if the remote version is
 * higher than the current client's version, which indicates that the client is
 * using an outdated version of the plugin/package.
 *
 * Exported for testing purposes.
 *
 * @param {CRDTDoc}  ydoc               The Yjs document to observe.
 * @param {Function} onOutdatedCallback Callback to invoke when an outdated client is detected.
 * @return {Function} The observer function.
 */
export function createVersionObserver(
	ydoc: CRDTDoc,
	onOutdatedCallback: (
		currentVersion: number,
		remoteVersion: number
	) => void
) {
	return ( event: Y.YMapEvent< unknown >, transaction: Y.Transaction ) => {
		if ( transaction.local ) {
			return;
		}

		const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );

		event.keysChanged.forEach( ( key ) => {
			switch ( key ) {
				case CRDT_STATE_VERSION_KEY:
					const remoteVersion = stateMap.get(
						CRDT_STATE_VERSION_KEY
					) as number | undefined;

					if (
						remoteVersion !== undefined &&
						remoteVersion > CRDT_DOC_VERSION
					) {
						onOutdatedCallback( CRDT_DOC_VERSION, remoteVersion );
					}
					break;
			}
		} );
	};
}

/**
 * Set up version announcement for a ydoc. This waits for the first remote
 * update (indicating sync has started) before announcing our version, with
 * a fallback timeout in case we're the only client.
 *
 * Exported for testing purposes.
 *
 * @param {CRDTDoc} ydoc The Yjs document to announce version for.
 */
export function setupVersionAnnouncement( ydoc: CRDTDoc ): void {
	let versionAnnounced = false;

	const announceVersion = () => {
		if ( ! versionAnnounced ) {
			versionAnnounced = true;

			ydoc.transact( () => {
				const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
				const currentMax = stateMap.get( CRDT_STATE_VERSION_KEY ) as
					| number
					| undefined;

				if (
					currentMax === undefined ||
					CRDT_DOC_VERSION > currentMax
				) {
					stateMap.set( CRDT_STATE_VERSION_KEY, CRDT_DOC_VERSION );
				}
			} );

			ydoc.off( 'update', onFirstUpdate );
		}
	};

	const onFirstUpdate = ( _update: Uint8Array, origin: any ) => {
		if ( origin ) {
			announceVersion();
		}
	};

	ydoc.on( 'update', onFirstUpdate );

	setTimeout( announceVersion, 1000 );
}
