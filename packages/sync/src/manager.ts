/**
 * External dependencies
 */
import * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import {
	CRDT_RECORD_MAP_KEY as RECORD_KEY,
	LOCAL_SYNC_MANAGER_ORIGIN,
	CRDT_RECORD_METADATA_MAP_KEY as RECORD_METADATA_KEY,
	CRDT_RECORD_METADATA_SAVED_AT_KEY as SAVED_AT_KEY,
} from './config';
import {
	logPerformanceTiming,
	passThru,
	yieldToEventLoop,
} from './performance';
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
	SyncManagerUpdateOptions,
	SyncUndoManager,
} from './types';
import { createUndoManager } from './undo-manager';
import { createYjsDoc, markEntityAsSaved } from './utils';

interface CollectionState {
	awareness?: Awareness;
	handlers: CollectionHandlers;
	syncConfig: SyncConfig;
	unload: () => void;
	ydoc: CRDTDoc;
}

interface EntityState {
	awareness?: Awareness;
	handlers: RecordHandlers;
	objectId: ObjectID;
	objectType: ObjectType;
	syncConfig: SyncConfig;
	unload: () => void;
	ydoc: CRDTDoc;
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
 * The sync manager orchestrates the lifecycle of syncing entity records. It
 * creates Yjs documents, connects to providers, creates awareness instances,
 * and coordinates with the `core-data` store.
 *
 * @param debug Whether to enable performance and debug logging.
 */
export function createSyncManager( debug = false ): SyncManager {
	const debugWrap = debug ? logPerformanceTiming : passThru;
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

		handlers = {
			addUndoMeta: debugWrap( handlers.addUndoMeta ),
			editRecord: debugWrap( handlers.editRecord ),
			getEditedRecord: debugWrap( handlers.getEditedRecord ),
			onStatusChange: debugWrap( handlers.onStatusChange ),
			refetchRecord: debugWrap( handlers.refetchRecord ),
			restoreUndoMeta: debugWrap( handlers.restoreUndoMeta ),
			saveRecord: debugWrap( handlers.saveRecord ),
		};

		const ydoc = createYjsDoc( { objectType } );
		const recordMap = ydoc.getMap( RECORD_KEY );
		const recordMetaMap = ydoc.getMap( RECORD_METADATA_KEY );
		const now = Date.now();

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			providerResults.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			recordMap.unobserveDeep( onRecordUpdate );
			recordMetaMap.unobserve( onRecordMetaUpdate );
			ydoc.destroy();
			entityStates.delete( entityId );
		};

		// If the sync config supports awareness, create it.
		const awareness = syncConfig.createAwareness?.( ydoc, objectId );

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

			void internal.updateEntityRecord( objectType, objectId );
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
			awareness,
			handlers,
			objectId,
			objectType,
			syncConfig,
			unload,
			ydoc,
		};

		entityStates.set( entityId, entityState );

		// Create providers for the given entity and its Yjs document.
		const providerResults = await Promise.all(
			providerCreators.map( async ( create ) => {
				const provider = await create( {
					objectType,
					objectId,
					ydoc,
					awareness,
				} );

				// Attach status listener after provider creation.
				provider.on( 'status', handlers.onStatusChange );

				return provider;
			} )
		);

		// Attach observers.
		recordMap.observeDeep( onRecordUpdate );
		recordMetaMap.observe( onRecordMetaUpdate );

		// Get and apply the persisted CRDT document, if it exists.
		internal.applyPersistedCrdtDoc( objectType, objectId, record );
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
		const now = Date.now();

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			providerResults.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			recordMetaMap.unobserve( onRecordMetaUpdate );
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

		// If the sync config supports awareness, create it.
		const awareness = syncConfig.createAwareness?.( ydoc );

		const collectionState: CollectionState = {
			awareness,
			handlers,
			syncConfig,
			unload,
			ydoc,
		};

		collectionStates.set( objectType, collectionState );

		// Create providers for the given entity and its Yjs document.
		const providerResults = await Promise.all(
			providerCreators.map( async ( create ) => {
				const provider = await create( {
					awareness,
					objectType,
					objectId: null,
					ydoc,
				} );

				// Attach status listener after provider creation.
				provider.on( 'status', handlers.onStatusChange );

				return provider;
			} )
		);

		// Attach observers.
		recordMetaMap.observe( onRecordMetaUpdate );
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
		updateCRDTDoc( objectType, null, {}, origin, { isSave: true } );
	}

	/**
	 * Get the awareness instance for the given object type and object ID, if supported.
	 *
	 * @template {Awareness} State
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 * @return {State | undefined} The awareness instance, or undefined if not supported.
	 */
	function getAwareness< State extends Awareness >(
		objectType: ObjectType,
		objectId: ObjectID
	): State | undefined {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState || ! entityState.awareness ) {
			return undefined;
		}

		return entityState.awareness as State;
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
	function _applyPersistedCrdtDoc(
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

				if ( 'auto-draft' !== record.status ) {
					handlers.saveRecord();
				}
			}, LOCAL_SYNC_MANAGER_ORIGIN );
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
	 * @param {ObjectType}               objectType             Object type.
	 * @param {ObjectID}                 objectId               Object ID.
	 * @param {Partial< ObjectData >}    changes                Updates to make.
	 * @param {string}                   origin                 The source of change.
	 * @param {SyncManagerUpdateOptions} options                Optional flags for the update.
	 * @param {boolean}                  options.isSave         Whether this update is part of a save operation. Defaults to false.
	 * @param {boolean}                  options.isNewUndoLevel Whether to create a new undo level for this change. Defaults to false.
	 */
	function updateCRDTDoc(
		objectType: ObjectType,
		objectId: ObjectID | null,
		changes: Partial< ObjectData >,
		origin: string,
		options: SyncManagerUpdateOptions = {}
	): void {
		const { isSave = false, isNewUndoLevel = false } = options;
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );
		const collectionState = collectionStates.get( objectType );

		if ( entityState ) {
			const { syncConfig, ydoc } = entityState;

			// If this is change should create a new undo level, tell the undo
			// manager to stop capturing and create a new undo group.
			// We can't do this in the undo manager itself, because addRecord() is
			// called after the CRDT changes have been applied, and we want to
			// ensure that the undo set is created before the changes are applied.
			if ( isNewUndoLevel && undoManager ) {
				undoManager.stopCapturing?.();
			}

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
	async function _updateEntityRecord(
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

	// Collect internal functions so that they can be wrapped before calling.
	const internal = {
		applyPersistedCrdtDoc: debugWrap( _applyPersistedCrdtDoc ),
		updateEntityRecord: debugWrap( _updateEntityRecord ),
	};

	// Wrap and return the public API.
	return {
		createMeta: debugWrap( createEntityMeta ),
		getAwareness,
		load: debugWrap( loadEntity ),
		loadCollection: debugWrap( loadCollection ),
		// Use getter to ensure we always return the current value of `undoManager`.
		get undoManager(): SyncUndoManager | undefined {
			return undoManager;
		},
		unload: debugWrap( unloadEntity ),
		update: debugWrap( yieldToEventLoop( updateCRDTDoc ) ),
	};
}
