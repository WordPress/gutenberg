/**
 * External dependencies
 */
import * as Y from '@y/y';
import type { Awareness } from '@y/protocols/awareness';

/**
 * Internal dependencies
 */
import {
	CRDT_RECORD_MAP_KEY,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_MAP_SAVED_AT_KEY as SAVED_AT_KEY,
	LOCAL_EDITOR_PASSTHROUGH_ORIGIN,
	LOCAL_SYNC_MANAGER_ORIGIN,
} from './config';
import { logPerformanceTiming, passThru } from './performance';
import { getProviderCreators } from './providers';
import {
	createSuggestionManager,
	type SuggestionManager as SuggestionManagerType,
} from './suggestion-manager';
import type {
	CollectionHandlers,
	CRDTDoc,
	EntityID,
	ObjectID,
	ObjectData,
	ObjectType,
	MapEvent,
	ProviderCreator,
	RecordHandlers,
	SuggestionMode,
	SyncConfig,
	SyncManager,
	SyncManagerUpdateOptions,
	SyncUndoManager,
} from './types';
import { createUndoManager } from './undo-manager';
import {
	createYjsDoc,
	deserializeCrdtDoc,
	initializeYjsDoc,
	markEntityAsSaved,
	serializeCrdtDoc,
} from './utils';

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
	const suggestionMgr: SuggestionManagerType = createSuggestionManager();

	// A flushable deferred queue for CRDT document updates. Each call to
	// the public `update` method enqueues the write and schedules a flush
	// via setTimeout(0). `flushPendingUpdates` can be called synchronously
	// (e.g. before a suggestion-mode switch) to execute all pending writes
	// immediately, ensuring they run under the correct suggestion mode.
	let pendingUpdates: Array< () => void > = [];
	let updateTimer: ReturnType< typeof setTimeout > | null = null;

	function flushPendingUpdates(): void {
		if ( updateTimer !== null ) {
			clearTimeout( updateTimer );
			updateTimer = null;
		}
		const updates = pendingUpdates;
		pendingUpdates = [];
		for ( const update of updates ) {
			update();
		}
	}

	function deferredUpdateCRDTDoc(
		...args: Parameters< typeof updateCRDTDoc >
	): void {
		pendingUpdates.push( () => {
			updateCRDTDoc( ...args );
		} );
		if ( updateTimer === null ) {
			updateTimer = setTimeout( flushPendingUpdates, 0 );
		}
	}

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
	 * Log debug messages if debugging is enabled.
	 *
	 * @param component The component or context related to the log message
	 * @param message   The debug message
	 * @param entityId  The entity ID related to the log message
	 * @param context   Additional debug context
	 */
	function log(
		component: string,
		message: string,
		entityId: string,
		context: object = {}
	): void {
		if ( ! debug ) {
			return;
		}

		// eslint-disable-next-line no-console
		console.log( `[SyncManager][${ component }]: ${ message }`, {
			...context,
			entityId,
		} );
	}

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
		const entityId = getEntityId( objectType, objectId );

		if ( 0 === providerCreators.length ) {
			log( 'loadEntity', 'no providers, skipping', entityId );
			return; // No provider creators, so syncing is effectively disabled.
		}

		if ( entityStates.has( entityId ) ) {
			log( 'loadEntity', 'already loaded', entityId );
			return; // Already bootstrapped.
		}

		log( 'loadEntity', 'loading', entityId );

		handlers = {
			addUndoMeta: debugWrap( handlers.addUndoMeta ),
			editRecord: debugWrap( handlers.editRecord ),
			getEditedRecord: debugWrap( handlers.getEditedRecord ),
			onStatusChange: debugWrap( handlers.onStatusChange ),
			persistCRDTDoc: debugWrap( handlers.persistCRDTDoc ),
			publishDecorations: handlers.publishDecorations,
			refetchRecord: debugWrap( handlers.refetchRecord ),
			restoreUndoMeta: debugWrap( handlers.restoreUndoMeta ),
		};

		const ydoc = createYjsDoc( { objectType } );
		const recordMap = ydoc.get( CRDT_RECORD_MAP_KEY );
		const stateMap = ydoc.get( CRDT_STATE_MAP_KEY );
		const now = Date.now();

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			log( 'loadEntity', 'unloading', entityId );
			if ( readBackTimer !== null ) {
				clearTimeout( readBackTimer );
			}
			providerResults.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			recordMap.unobserveDeep( onRecordUpdate );
			stateMap.unobserve( onStateMapUpdate );
			ydoc.destroy();
			entityStates.delete( entityId );
		};

		// If the sync config supports awareness, create it.
		const awareness = syncConfig.createAwareness?.( ydoc, objectId );

		// When the CRDT document is updated by an UndoManager or a connection
		// (not a local origin), update the local store. When suggestion
		// tracking is active (in either editing or suggesting mode), local
		// changes also need a read-back so the editor can display
		// suggestion markup and keep decoration positions correct. A
		// re-entrancy guard prevents infinite cycles: the read-back sends
		// blocks with deletion text to the editor, whose write-back strips
		// it (via mergeRichTextUpdate / stripSuggestionMarkup), producing
		// a CRDT no-op.
		//
		// In suggesting mode the read-back is debounced to avoid cursor
		// jumps during rapid typing. Without debouncing, each keystroke
		// triggers a full blocks update with suggestion markup, which can
		// cause the editor to re-render and lose cursor position.
		// In editing mode the read-back is immediate but only refreshes
		// decorations (no editRecord dispatch).
		let isLocalSuggestionReadBack = false;
		let readBackTimer: ReturnType< typeof setTimeout > | null = null;

		const onRecordUpdate = (
			_event: MapEvent,
			transaction: Y.Transaction
		): void => {
			if (
				transaction.local &&
				! ( transaction.origin instanceof Y.UndoManager )
			) {
				if (
					suggestionMgr.hasEntity( entityId ) &&
					! isLocalSuggestionReadBack
				) {
					const mode = suggestionMgr.getMode( entityId );

					if ( mode === 'suggesting' ) {
						// Debounce: wait for typing to pause before
						// sending suggestion-marked blocks back to
						// the editor.
						if ( readBackTimer !== null ) {
							clearTimeout( readBackTimer );
						}
						readBackTimer = setTimeout( () => {
							readBackTimer = null;
							isLocalSuggestionReadBack = true;
							void internal
								.updateEntityRecord( objectType, objectId )
								.finally( () => {
									isLocalSuggestionReadBack = false;
								} );
						}, 150 );
					} else {
						// In editing mode, refresh decorations
						// immediately without dispatching editRecord
						// (blocks from nextDoc are always treated as
						// "changed", which would cause duplication).
						isLocalSuggestionReadBack = true;
						void internal
							.updateEntityRecord( objectType, objectId, {
								decorationsOnly: true,
							} )
							.finally( () => {
								isLocalSuggestionReadBack = false;
							} );
					}
				}
				return;
			}

			void internal.updateEntityRecord( objectType, objectId );
		};

		const onStateMapUpdate = (
			event: MapEvent,
			transaction: Y.Transaction
		) => {
			if ( transaction.local ) {
				return;
			}

			event.keysChanged.forEach( ( key: string ) => {
				switch ( key ) {
					case SAVED_AT_KEY:
						const newValue = stateMap.getAttr( SAVED_AT_KEY );
						if ( 'number' === typeof newValue && newValue > now ) {
							// Another peer has saved the record. Refetch it so that we have
							// a correct understanding of our own unsaved edits.
							log( 'loadEntity', 'refetching record', entityId );
							void handlers.refetchRecord().catch( () => {} );
						}
						break;
				}
			} );
		};

		// Lazily create the undo manager when the first entity is loaded.
		// Pass the suggestion manager's suspend function so undo/redo bypasses
		// suggestion mode (changes flow directly to currentDoc). The per-doc
		// UndoManager map is forwarded so suspend can add the UndoManager
		// origins to AM's suggestionOrigins.
		if ( ! undoManager ) {
			undoManager = createUndoManager( ( undoManagerDocs ) =>
				suggestionMgr.suspendSuggestionMode( undoManagerDocs )
			);
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
		log( 'loadEntity', 'connecting', entityId );
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
		stateMap.observe( onStateMapUpdate );

		// Initialize the Yjs document with the necessary CRDT state.
		initializeYjsDoc( ydoc );

		// Get and apply the persisted CRDT document, if it exists.
		internal.applyPersistedCrdtDoc( objectType, objectId, record );

		// Initialize suggestion tracking (creates nextDoc + DiffAttributionManager).
		// The nextDoc is synced via a separate :suggestions room.
		log( 'loadEntity', 'initializing suggestions', entityId );
		const nextDoc = await suggestionMgr.initEntity(
			entityId,
			objectType,
			objectId,
			ydoc
		);

		// Add nextDoc's record map to the undo scope. The editor writes to
		// nextDoc (not currentDoc), so undo must track changes there.
		// The AM propagation to currentDoc uses its own origin (not in
		// trackedOrigins) so the currentDoc's UndoManager won't double-capture.
		const nextRecordMap = nextDoc.get( CRDT_RECORD_MAP_KEY );
		undoManager.addToScope( nextRecordMap, {
			addUndoMeta,
			restoreUndoMeta,
		} );

		// Observe the nextDoc's record map for remote suggestion changes.
		// When a peer sends a suggestion, the nextDoc updates and we need
		// to refresh the local editor state.
		nextRecordMap.observeDeep( onRecordUpdate );
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
		const entityId = getEntityId( objectType, null );

		if ( 0 === providerCreators.length ) {
			log( 'loadCollection', 'no providers, skipping', entityId );
			return; // No provider creators, so syncing is effectively disabled.
		}

		if ( collectionStates.has( objectType ) ) {
			log( 'loadCollection', 'already loaded', entityId );
			return; // Already loaded.
		}

		log( 'loadCollection', 'loading', entityId );

		const ydoc = createYjsDoc( { collection: true, objectType } );
		const stateMap = ydoc.get( CRDT_STATE_MAP_KEY );
		const now = Date.now();

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			log( 'loadCollection', 'unloading', entityId );
			providerResults.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			stateMap.unobserve( onStateMapUpdate );
			ydoc.destroy();
			collectionStates.delete( objectType );
		};

		const onStateMapUpdate = (
			event: MapEvent,
			transaction: Y.Transaction
		) => {
			if ( transaction.local ) {
				return;
			}

			event.keysChanged.forEach( ( key ) => {
				switch ( key ) {
					case SAVED_AT_KEY:
						const newValue = stateMap.getAttr( SAVED_AT_KEY );
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
		log( 'loadCollection', 'connecting', entityId );
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
		stateMap.observe( onStateMapUpdate );

		// Initialize the Yjs document with the necessary CRDT state.
		initializeYjsDoc( ydoc );
	}

	/**
	 * Unload an entity, stop syncing, destroy its in-memory state, and trigger an
	 * update of the collection.
	 *
	 * @param {ObjectType} objectType Object type to discard.
	 * @param {ObjectID}   objectId   Object ID to discard, or null for collections.
	 */
	function unloadEntity( objectType: ObjectType, objectId: ObjectID ): void {
		const entityId = getEntityId( objectType, objectId );
		log( 'unloadEntity', 'unloading', entityId );
		suggestionMgr.destroyEntity( entityId );
		entityStates.get( entityId )?.unload();
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
			log( 'applyPersistedCrdtDoc', 'no entity state', entityId );
			return;
		}

		const {
			handlers,
			syncConfig: {
				applyChangesToCRDTDoc,
				getChangesFromCRDTDoc,
				getPersistedCRDTDoc,
			},
			ydoc: targetDoc,
		} = entityState;

		// Get the persisted CRDT document, if it exists.
		const serialized = getPersistedCRDTDoc?.( record );
		const tempDoc = serialized ? deserializeCrdtDoc( serialized ) : null;

		if ( ! tempDoc ) {
			log( 'applyPersistedCrdtDoc', 'no persisted doc', entityId );
			// Apply the current record as changes and request that the CRDT doc be
			// persisted with the entity. The persisted CRDT doc can be created by
			// calling `syncManager.createPersistedCRDTDoc`.
			targetDoc.transact( () => {
				applyChangesToCRDTDoc( targetDoc, record );
				handlers.persistCRDTDoc();
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
			log( 'applyPersistedCrdtDoc', 'valid persisted doc', entityId );
			// The persisted CRDT document is valid. There are no updates to apply.
			return;
		}

		log( 'applyPersistedCrdtDoc', 'invalidated keys', entityId, {
			invalidatedKeys,
		} );

		// Use the invalidated keys to get the updated values from the entity.
		const changes = invalidatedKeys.reduce(
			( acc, key ) =>
				Object.assign( acc, {
					[ key ]: record[ key ],
				} ),
			{}
		);

		// Apply the changes and request that the updated CRDT doc be persisted with
		// the entity. The persisted CRDT doc can be created by calling
		// `syncManager.createPersistedCRDTDoc`.
		targetDoc.transact( () => {
			applyChangesToCRDTDoc( targetDoc, changes );
			handlers.persistCRDTDoc();
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

			// Determine if we should write to the nextDoc (suggestion doc)
			// instead of the currentDoc. When suggestion tracking is active,
			// the editor always writes to nextDoc. The DiffAttributionManager
			// controls whether changes propagate to currentDoc.
			const nextDoc = suggestionMgr.getNextDoc( entityId );
			const targetDoc = nextDoc ?? ydoc;

			// If this is change should create a new undo level, tell the undo
			// manager to stop capturing and create a new undo group.
			// We can't do this in the undo manager itself, because addRecord() is
			// called after the CRDT changes have been applied, and we want to
			// ensure that the undo set is created before the changes are applied.
			if ( isNewUndoLevel && undoManager ) {
				undoManager.stopCapturing?.();
			}

			const mode = suggestionMgr.getMode( entityId );

			if ( nextDoc && mode === 'suggesting' ) {
				// In suggesting mode, split changes: blocks use the editor
				// origin (blocked by AM) while non-blocks use the passthrough
				// origin (allowed through AM).
				const blocksKeys = new Set( [ 'blocks', 'content' ] );
				const blocksChanges: Partial< ObjectData > = {};
				const otherChanges: Partial< ObjectData > = {};

				for ( const [ key, value ] of Object.entries( changes ) ) {
					if ( blocksKeys.has( key ) ) {
						blocksChanges[ key ] = value;
					} else {
						otherChanges[ key ] = value;
					}
				}

				// Apply non-blocks changes with passthrough origin (always flows through).
				if ( Object.keys( otherChanges ).length > 0 ) {
					targetDoc.transact( () => {
						log(
							'updateCRDTDoc',
							'applying passthrough changes',
							entityId,
							{
								changedKeys: Object.keys( otherChanges ),
							}
						);
						syncConfig.applyChangesToCRDTDoc(
							targetDoc,
							otherChanges
						);
					}, LOCAL_EDITOR_PASSTHROUGH_ORIGIN );
				}

				// Apply blocks changes with editor origin (blocked by AM in suggesting mode).
				if ( Object.keys( blocksChanges ).length > 0 ) {
					targetDoc.transact( () => {
						log(
							'updateCRDTDoc',
							'applying suggestion changes',
							entityId,
							{
								changedKeys: Object.keys( blocksChanges ),
							}
						);
						syncConfig.applyChangesToCRDTDoc(
							targetDoc,
							blocksChanges
						);
					}, origin );
				}

				// Save is applied to the currentDoc (the canonical version).
				if ( isSave ) {
					ydoc.transact( () => {
						markEntityAsSaved( ydoc );
					}, origin );
				}
			} else {
				// In editing mode or without suggestion tracking: apply all at once.
				targetDoc.transact( () => {
					log( 'updateCRDTDoc', 'applying changes', entityId, {
						changedKeys: Object.keys( changes ),
					} );
					syncConfig.applyChangesToCRDTDoc( targetDoc, changes );

					if ( isSave ) {
						markEntityAsSaved( targetDoc );
					}
				}, origin );

				// If writing to nextDoc in editing mode, also mark currentDoc as saved.
				if ( isSave && nextDoc && targetDoc !== ydoc ) {
					ydoc.transact( () => {
						markEntityAsSaved( ydoc );
					}, origin );
				}
			}
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
	 * @param {ObjectType} objectType              Object type of record to update.
	 * @param {ObjectID}   objectId                Object ID of record to update.
	 * @param {Object}     options                 Optional flags for the update.
	 * @param {boolean}    options.decorationsOnly If true, only update suggestion decorations without editing the record. Defaults to false.
	 */
	async function _updateEntityRecord(
		objectType: ObjectType,
		objectId: ObjectID,
		{ decorationsOnly = false }: { decorationsOnly?: boolean } = {}
	): Promise< void > {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState ) {
			log( 'updateEntityRecord', 'no entity state', entityId );
			return;
		}

		const { handlers, syncConfig, ydoc } = entityState;

		// When suggestion tracking is active, read from nextDoc (which
		// includes pending suggestions) instead of currentDoc.
		const nextDoc = suggestionMgr.getNextDoc( entityId );
		const readDoc = nextDoc ?? ydoc;

		// Pass the DiffAttributionManager so the sync config can generate
		// suggestion markup for rich-text attributes.
		const am = suggestionMgr.getAttributionManager( entityId );

		// Determine which synced properties have actually changed by comparing
		// them against the current edited entity record.
		const editedRecord = await handlers.getEditedRecord();

		// Flush any pending CRDT writes that may have been enqueued
		// during the async getEditedRecord() call. Without this, the
		// CRDT doc may be missing recently typed characters, causing
		// the read-back to overwrite them with stale content.
		flushPendingUpdates();

		const changes = syncConfig.getChangesFromCRDTDoc(
			readDoc,
			editedRecord,
			am
		);

		// Extract suggestion decoration ranges (attached by
		// getPostChangesFromCRDTDoc) and publish them to the view-layer
		// decoration store. These ranges are NOT entity data — they drive
		// the suggestion-insert and suggestion-delete format types'
		// view-layer highlighting.
		const decorations = ( changes as any ).__suggestionDecorations;
		if ( decorations !== undefined ) {
			delete ( changes as any ).__suggestionDecorations;
			handlers.publishDecorations?.( decorations );
		}

		// In decorations-only mode (editing-mode local read-back), skip
		// editRecord. The editor's blocks are authoritative and dispatching
		// CRDT blocks would cause a re-render loop because the blocks
		// comparison always returns true for non-persisted docs.
		if ( decorationsOnly ) {
			return;
		}

		const changedKeys = Object.keys( changes );

		if ( 0 === changedKeys.length ) {
			return;
		}

		log( 'updateEntityRecord', 'changes', entityId, {
			changedKeys,
		} );
		handlers.editRecord( changes );
	}

	/**
	 * Create object meta to persist the CRDT document in the entity record.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 */
	async function createPersistedCRDTDoc(
		objectType: ObjectType,
		objectId: ObjectID
	): Promise< string | null > {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState?.ydoc ) {
			return null;
		}

		// Y.Doc updates are deferred via yieldToEventLoop. Await a promise that
		// resolves on the next tick of the event loop so pending updates are flushed
		// before we serialize the document.
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		return serializeCrdtDoc( entityState.ydoc );
	}

	// Collect internal functions so that they can be wrapped before calling.
	const internal = {
		applyPersistedCrdtDoc: debugWrap( _applyPersistedCrdtDoc ),
		updateEntityRecord: debugWrap( _updateEntityRecord ),
	};

	// Suggestion mode API methods.
	function setSuggestionMode(
		objectType: ObjectType,
		objectId: ObjectID,
		mode: SuggestionMode
	): void {
		// Flush any pending CRDT writes so they execute under their
		// original suggestion mode. Without this, a write initiated in
		// editing mode could be deferred past the mode switch and
		// incorrectly treated as a suggestion.
		flushPendingUpdates();

		const entityId = getEntityId( objectType, objectId );
		suggestionMgr.setMode( entityId, mode );

		// Refresh decorations so existing suggestions remain visible
		// regardless of which mode we switched to.
		void internal.updateEntityRecord( objectType, objectId );
	}

	function getSuggestionMode(
		objectType: ObjectType,
		objectId: ObjectID
	): SuggestionMode {
		const entityId = getEntityId( objectType, objectId );
		return suggestionMgr.getMode( entityId );
	}

	// Wrap and return the public API.
	return {
		createPersistedCRDTDoc: debugWrap( createPersistedCRDTDoc ),
		getAwareness,
		getSuggestionMode,
		load: debugWrap( loadEntity ),
		loadCollection: debugWrap( loadCollection ),
		setSuggestionMode,
		// Use getter to ensure we always return the current value of `undoManager`.
		get undoManager(): SyncUndoManager | undefined {
			return undoManager;
		},
		unload: debugWrap( unloadEntity ),
		update: debugWrap( deferredUpdateCRDTDoc ),
	};
}
