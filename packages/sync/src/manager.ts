/**
 * External dependencies
 */
import * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import {
	CRDT_RECORD_MAP_KEY,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_MAP_SAVED_AT_KEY as SAVED_AT_KEY,
	LOCAL_SYNC_MANAGER_ORIGIN,
} from './config';
import {
	logPerformanceTiming,
	passThru,
	yieldToEventLoop,
} from './performance';
import { createPresenceDetector } from './presence-detector';
import { getProviderCreators } from './providers';
import type {
	CollectionHandlers,
	CRDTDoc,
	EntityID,
	ObjectID,
	ObjectData,
	ObjectType,
	ProviderCreator,
	ProviderCreatorResult,
	RecordHandlers,
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
	providerResults?: ProviderCreatorResult[];
	syncConfig: SyncConfig;
	unload: () => void;
	ydoc: CRDTDoc;
}

/**
 * Default debounce delay before downgrading from full sync back to
 * presence-only mode after all collaborators leave. This avoids flapping
 * on brief disconnects (e.g. page reloads, network blips).
 */
const DEFAULT_DOWNGRADE_DEBOUNCE_MS = 30_000;

interface SyncManagerOptions {
	debug?: boolean;
	downgradeDebounceMs?: number;
}

interface EntityState {
	awareness?: Awareness;
	awarenessHandler?: ( changes: {
		added: number[];
		removed: number[];
		updated: number[];
	} ) => void;
	downgradeTimeoutId?: ReturnType< typeof setTimeout >;
	handlers: RecordHandlers;
	objectId: ObjectID;
	objectType: ObjectType;
	presenceDetector?: { destroy: () => void } | null;
	providerResults?: ProviderCreatorResult[];
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
 * @param optionsOrDebug Options object or boolean for backwards-compatible debug flag.
 */
export function createSyncManager(
	optionsOrDebug: SyncManagerOptions | boolean = false
): SyncManager {
	const managerOptions: SyncManagerOptions =
		typeof optionsOrDebug === 'boolean'
			? { debug: optionsOrDebug }
			: optionsOrDebug;
	const debug = managerOptions.debug ?? false;
	const downgradeDebounceMs =
		managerOptions.downgradeDebounceMs ?? DEFAULT_DOWNGRADE_DEBOUNCE_MS;
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
	 * Connect providers for an entity that was loaded in deferred mode.
	 *
	 * This is called by the presence detector when another collaborator is
	 * detected, upgrading the entity from local-only editing to full sync.
	 *
	 * @param {EntityID}          entityId         Entity identifier.
	 * @param {ProviderCreator[]} providerCreators Provider creator functions.
	 */
	async function connectProviders(
		entityId: EntityID,
		providerCreators: ProviderCreator[]
	): Promise< void > {
		const entityState = entityStates.get( entityId );
		if ( ! entityState || entityState.providerResults ) {
			return; // Already connected or entity was unloaded.
		}

		const { awareness, handlers, objectId, objectType, ydoc } = entityState;

		log( 'connectProviders', 'upgrading to full sync', entityId );

		// Track providers as they are created so we can clean up partial
		// results if a later provider rejects.
		const created: ProviderCreatorResult[] = [];
		let providerResults: ProviderCreatorResult[];

		try {
			providerResults = await Promise.all(
				providerCreators.map( async ( create ) => {
					const provider = await create( {
						objectType,
						objectId,
						ydoc,
						awareness,
					} );

					created.push( provider );

					// Attach status listener after provider creation.
					provider.on( 'status', handlers.onStatusChange );

					return provider;
				} )
			);
		} catch ( error ) {
			// Destroy any providers that were successfully created before
			// the failure so they are not leaked.
			created.forEach( ( provider ) => provider.destroy() );
			throw error;
		}

		// Store provider results so they can be cleaned up on unload.
		entityState.providerResults = providerResults;

		// Start monitoring awareness for collaborator departures so we can
		// downgrade back to presence-only mode when everyone leaves.
		if ( awareness && entityState.syncConfig.checkPresence ) {
			startAwarenessMonitor( entityId, providerCreators );
		}

		// Also connect any deferred collections that were waiting for an
		// entity to detect collaboration.
		await connectAllDeferredCollections();
	}

	/**
	 * Restart presence detection for an entity without requiring existing
	 * provider results. This is safe to call after a failed connection
	 * attempt (where providerResults was never assigned) as well as after
	 * a successful disconnection.
	 *
	 * @param {EntityID}          entityId         Entity identifier.
	 * @param {ProviderCreator[]} providerCreators Provider creators for reconnection.
	 */
	function restartPresenceDetection(
		entityId: EntityID,
		providerCreators: ProviderCreator[]
	): void {
		const entityState = entityStates.get( entityId );
		if ( ! entityState ) {
			return;
		}

		const { awareness, syncConfig, ydoc } = entityState;

		if ( awareness && syncConfig.checkPresence ) {
			const { objectType, objectId } = entityState;
			const room = `${ objectType }:${ objectId }`;

			entityState.presenceDetector = createPresenceDetector( {
				room,
				clientId: ydoc.clientID,
				awareness,
				checkPresence: syncConfig.checkPresence,
				onCollaboratorDetected: () => {
					log(
						'restartPresenceDetection',
						'collaborator re-detected, reconnecting',
						entityId
					);
					entityState.presenceDetector = null;
					connectProviders( entityId, providerCreators ).catch(
						() => {
							log(
								'restartPresenceDetection',
								'reconnection failed, restarting presence detection',
								entityId
							);
							if (
								entityStates.has( entityId ) &&
								! entityState.providerResults &&
								! entityState.presenceDetector
							) {
								restartPresenceDetection(
									entityId,
									providerCreators
								);
							}
						}
					);
				},
			} );
		}
	}

	/**
	 * Disconnect full sync providers for an entity and revert to
	 * presence-only polling. The YDoc stays intact — the user keeps
	 * editing locally.
	 *
	 * @param {EntityID}          entityId         Entity identifier.
	 * @param {ProviderCreator[]} providerCreators Provider creators for reconnection.
	 */
	function disconnectProviders(
		entityId: EntityID,
		providerCreators: ProviderCreator[]
	): void {
		const entityState = entityStates.get( entityId );
		if ( ! entityState || ! entityState.providerResults ) {
			return;
		}

		log( 'disconnectProviders', 'downgrading to presence-only', entityId );

		// Remove awareness monitor before destroying providers.
		stopAwarenessMonitor( entityId );

		// Destroy all providers.
		entityState.providerResults.forEach( ( result ) => result.destroy() );
		entityState.providerResults = undefined;

		// Reset connection status.
		entityState.handlers.onStatusChange( null );

		// Restart presence detection if the config supports it.
		restartPresenceDetection( entityId, providerCreators );

		// If no entities remain fully synced, also disconnect collections.
		if ( ! isAnyEntityFullySynced() ) {
			disconnectAllCollections();
		}
	}

	/**
	 * Start monitoring awareness changes to detect when all collaborators
	 * have left. After a debounce period, downgrades to presence-only mode.
	 *
	 * @param {EntityID}          entityId         Entity identifier.
	 * @param {ProviderCreator[]} providerCreators Provider creators for reconnection.
	 */
	function startAwarenessMonitor(
		entityId: EntityID,
		providerCreators: ProviderCreator[]
	): void {
		const entityState = entityStates.get( entityId );
		if ( ! entityState?.awareness ) {
			return;
		}

		const { awareness, ydoc } = entityState;
		const localClientId = ydoc.clientID;

		const handler = ( changes: {
			added: number[];
			removed: number[];
			updated: number[];
		} ) => {
			// Only re-evaluate when clients join or leave, not on
			// cursor/state updates which fire frequently during editing.
			if ( changes.added.length === 0 && changes.removed.length === 0 ) {
				return;
			}

			const states = awareness.getStates();
			const hasRemoteClients = Array.from( states.keys() ).some(
				( id ) => id !== localClientId
			);

			if ( ! hasRemoteClients ) {
				// All collaborators gone — start the downgrade debounce.
				if ( ! entityState.downgradeTimeoutId ) {
					log(
						'awarenessMonitor',
						'no remote clients, starting downgrade timer',
						entityId
					);
					entityState.downgradeTimeoutId = setTimeout( () => {
						entityState.downgradeTimeoutId = undefined;
						disconnectProviders( entityId, providerCreators );
					}, downgradeDebounceMs );
				}
			} else if ( entityState.downgradeTimeoutId ) {
				// A remote client reappeared — cancel the downgrade.
				log(
					'awarenessMonitor',
					'remote client returned, cancelling downgrade',
					entityId
				);
				clearTimeout( entityState.downgradeTimeoutId );
				entityState.downgradeTimeoutId = undefined;
			}
		};

		entityState.awarenessHandler = handler;
		awareness.on( 'change', handler );

		// Evaluate immediately after subscribing to catch collaborators
		// that left during the async provider creation window. Without
		// this, a removed event that fired before the handler was
		// registered would be missed, leaving the session stuck in
		// full-sync mode permanently.
		const currentStates = awareness.getStates();
		const hasRemoteClientsNow = Array.from( currentStates.keys() ).some(
			( id ) => id !== localClientId
		);
		if ( ! hasRemoteClientsNow && ! entityState.downgradeTimeoutId ) {
			log(
				'awarenessMonitor',
				'no remote clients on initial check, starting downgrade timer',
				entityId
			);
			entityState.downgradeTimeoutId = setTimeout( () => {
				entityState.downgradeTimeoutId = undefined;
				disconnectProviders( entityId, providerCreators );
			}, downgradeDebounceMs );
		}
	}

	/**
	 * Stop monitoring awareness changes for an entity.
	 *
	 * @param {EntityID} entityId Entity identifier.
	 */
	function stopAwarenessMonitor( entityId: EntityID ): void {
		const entityState = entityStates.get( entityId );
		if ( ! entityState ) {
			return;
		}

		if ( entityState.awarenessHandler && entityState.awareness ) {
			entityState.awareness.off( 'change', entityState.awarenessHandler );
			entityState.awarenessHandler = undefined;
		}

		if ( entityState.downgradeTimeoutId ) {
			clearTimeout( entityState.downgradeTimeoutId );
			entityState.downgradeTimeoutId = undefined;
		}
	}

	/**
	 * Check whether any loaded entity currently has full sync providers
	 * connected. Used to determine whether deferred collections should
	 * connect or disconnect.
	 */
	function isAnyEntityFullySynced(): boolean {
		for ( const state of entityStates.values() ) {
			if ( state.providerResults ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Connect providers for a single deferred collection.
	 *
	 * @param {ObjectType}        objectType       The collection's object type.
	 * @param {ProviderCreator[]} providerCreators Provider creator functions.
	 */
	async function connectCollectionProviders(
		objectType: ObjectType,
		providerCreators: ProviderCreator[]
	): Promise< void > {
		const collectionState = collectionStates.get( objectType );
		if ( ! collectionState || collectionState.providerResults ) {
			return; // Already connected or not loaded.
		}

		const entityId = getEntityId( objectType, null );
		log( 'connectCollectionProviders', 'connecting', entityId );

		const { awareness, handlers, ydoc } = collectionState;

		const providerResults = await Promise.all(
			providerCreators.map( async ( create ) => {
				const provider = await create( {
					awareness,
					objectType,
					objectId: null,
					ydoc,
				} );
				provider.on( 'status', handlers.onStatusChange );
				return provider;
			} )
		);

		collectionState.providerResults = providerResults;
	}

	/**
	 * Connect all deferred collections. Called when any entity detects a
	 * collaborator and upgrades to full sync.
	 */
	async function connectAllDeferredCollections(): Promise< void > {
		const providerCreators = getProviderCreators();
		const promises: Promise< void >[] = [];

		for ( const [ objectType, state ] of collectionStates ) {
			if ( ! state.providerResults ) {
				promises.push(
					connectCollectionProviders( objectType, providerCreators )
				);
			}
		}

		await Promise.all( promises );
	}

	/**
	 * Disconnect all connected collections. Called when all entities
	 * downgrade back to presence-only mode.
	 */
	function disconnectAllCollections(): void {
		for ( const [ objectType, state ] of collectionStates ) {
			if ( state.providerResults ) {
				const entityId = getEntityId( objectType, null );
				log( 'disconnectAllCollections', 'disconnecting', entityId );
				state.providerResults.forEach( ( result ) => result.destroy() );
				state.providerResults = undefined;
				state.handlers.onStatusChange( null );
			}
		}
	}

	/**
	 * Load an entity for syncing and manage its lifecycle.
	 *
	 * When lazy connection is enabled (default), the entity starts in
	 * local-only mode: the YDoc and UndoManager are initialized immediately,
	 * but sync providers are not connected. A lightweight presence detector
	 * polls at a low frequency to check for other editors. When a collaborator
	 * is detected, the full sync connection is established.
	 *
	 * This optimization saves resources for the common case of a single user
	 * editing: no HTTP polling requests (or WebSocket connections) are made
	 * until collaboration is actually needed.
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

		log( 'loadEntity', 'loading (deferred connection)', entityId );

		handlers = {
			addUndoMeta: debugWrap( handlers.addUndoMeta ),
			editRecord: debugWrap( handlers.editRecord ),
			getEditedRecord: debugWrap( handlers.getEditedRecord ),
			onStatusChange: debugWrap( handlers.onStatusChange ),
			persistCRDTDoc: debugWrap( handlers.persistCRDTDoc ),
			refetchRecord: debugWrap( handlers.refetchRecord ),
			restoreUndoMeta: debugWrap( handlers.restoreUndoMeta ),
		};

		const ydoc = createYjsDoc( { objectType } );
		const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
		const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
		const now = Date.now();

		// If the sync config supports awareness, create it.
		const awareness = syncConfig.createAwareness?.( ydoc, objectId );

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			log( 'loadEntity', 'unloading', entityId );
			const state = entityStates.get( entityId );
			state?.presenceDetector?.destroy();
			stopAwarenessMonitor( entityId );
			state?.providerResults?.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			recordMap.unobserveDeep( onRecordUpdate );
			stateMap.unobserve( onStateMapUpdate );
			ydoc.destroy();
			entityStates.delete( entityId );

			// If no entities remain fully synced, disconnect collections.
			if ( ! isAnyEntityFullySynced() ) {
				disconnectAllCollections();
			}
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

			void internal.updateEntityRecord( objectType, objectId );
		};

		const onStateMapUpdate = (
			event: Y.YMapEvent< unknown >,
			transaction: Y.Transaction
		) => {
			if ( transaction.local ) {
				return;
			}

			event.keysChanged.forEach( ( key ) => {
				switch ( key ) {
					case SAVED_AT_KEY:
						const newValue = stateMap.get( SAVED_AT_KEY );
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

		// Store entity state BEFORE creating the presence detector so that
		// connectProviders can find it if the callback fires quickly.
		entityStates.set( entityId, entityState );

		// Start presence detection to discover other editors.
		// The presence detector polls at a low frequency (~10s) and only
		// sends awareness state (no document updates). When another editor
		// is found, it triggers the full provider connection.
		if ( awareness && syncConfig.checkPresence ) {
			const room = `${ objectType }:${ objectId }`;
			entityState.presenceDetector = createPresenceDetector( {
				room,
				clientId: ydoc.clientID,
				awareness,
				checkPresence: syncConfig.checkPresence,
				onCollaboratorDetected: () => {
					log(
						'loadEntity',
						'collaborator detected via presence, connecting providers',
						entityId
					);
					entityState.presenceDetector = null;
					connectProviders( entityId, providerCreators ).catch(
						() => {
							log(
								'loadEntity',
								'provider connection failed, restarting presence detection',
								entityId
							);
							if (
								entityStates.has( entityId ) &&
								! entityState.providerResults &&
								! entityState.presenceDetector
							) {
								restartPresenceDetection(
									entityId,
									providerCreators
								);
							}
						}
					);
				},
			} );
		} else {
			// No awareness or no checkPresence callback — connect providers
			// immediately since we have no way to detect other users.
			log(
				'loadEntity',
				'no awareness or checkPresence, connecting immediately',
				entityId
			);
			await connectProviders( entityId, providerCreators );
		}

		// Attach observers.
		recordMap.observeDeep( onRecordUpdate );
		stateMap.observe( onStateMapUpdate );

		// Initialize the Yjs document with the necessary CRDT state.
		initializeYjsDoc( ydoc );

		// Get and apply the persisted CRDT document, if it exists.
		internal.applyPersistedCrdtDoc( objectType, objectId, record );
	}

	/**
	 * Load a collection for syncing and manage its lifecycle.
	 *
	 * Like `loadEntity`, collections defer provider connection when presence
	 * detection is available. Collections don't have a per-entity `objectId`
	 * to scope presence detection to, so they piggyback on entity-level
	 * presence detection: when ANY entity detects a collaborator, all
	 * deferred collections also connect via `connectAllDeferredCollections`.
	 *
	 * This is important because with WebSocket-based providers, each
	 * collection connection consumes a WebSocket — wasteful when editing
	 * solo. For HTTP polling, it also avoids unnecessary poll requests.
	 *
	 * When all entities downgrade back to presence-only mode (all
	 * collaborators leave), collections also disconnect.
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
		const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
		const now = Date.now();

		// Clean up providers and in-memory state when the collection is unloaded.
		const unload = (): void => {
			log( 'loadCollection', 'unloading', entityId );
			const state = collectionStates.get( objectType );
			state?.providerResults?.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			stateMap.unobserve( onStateMapUpdate );
			ydoc.destroy();
			collectionStates.delete( objectType );
		};

		const onStateMapUpdate = (
			event: Y.YMapEvent< unknown >,
			transaction: Y.Transaction
		) => {
			if ( transaction.local ) {
				return;
			}

			event.keysChanged.forEach( ( key ) => {
				switch ( key ) {
					case SAVED_AT_KEY:
						const newValue = stateMap.get( SAVED_AT_KEY );
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

		// Defer collection provider connection when presence detection is
		// available. Collections piggyback on entity-level presence: when
		// ANY entity detects a collaborator, connectAllDeferredCollections()
		// is called from connectProviders().
		if ( syncConfig.checkPresence ) {
			if ( isAnyEntityFullySynced() ) {
				// An entity is already collaborating — connect now.
				log(
					'loadCollection',
					'entity already synced, connecting',
					entityId
				);
				await connectCollectionProviders(
					objectType,
					providerCreators
				);
			} else {
				log(
					'loadCollection',
					'deferring until entity collaboration detected',
					entityId
				);
			}
		} else {
			// No checkPresence — connect immediately (legacy behavior).
			log( 'loadCollection', 'connecting immediately', entityId );
			await connectCollectionProviders( objectType, providerCreators );
		}

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
		entityStates.get( entityId )?.unload();
		updateCRDTDoc( objectType, null, {}, LOCAL_SYNC_MANAGER_ORIGIN, {
			isSave: true,
		} );
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

			// If this is change should create a new undo level, tell the undo
			// manager to stop capturing and create a new undo group.
			// We can't do this in the undo manager itself, because addRecord() is
			// called after the CRDT changes have been applied, and we want to
			// ensure that the undo set is created before the changes are applied.
			if ( isNewUndoLevel && undoManager ) {
				undoManager.stopCapturing?.();
			}

			ydoc.transact( () => {
				log( 'updateCRDTDoc', 'applying changes', entityId, {
					changedKeys: Object.keys( changes ),
				} );
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
			log( 'updateEntityRecord', 'no entity state', entityId );
			return;
		}

		const { handlers, syncConfig, ydoc } = entityState;

		// Determine which synced properties have actually changed by comparing
		// them against the current edited entity record.
		const changes = syncConfig.getChangesFromCRDTDoc(
			ydoc,
			await handlers.getEditedRecord()
		);

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

	// Wrap and return the public API.
	return {
		createPersistedCRDTDoc: debugWrap( createPersistedCRDTDoc ),
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
