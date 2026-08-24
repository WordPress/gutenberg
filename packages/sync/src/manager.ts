import type { Awareness } from 'y-protocols/awareness';
import type {
	EngineCollection,
	EngineEntity,
	SyncEngine,
} from './engines/engine';
import { logPerformanceTiming, passThru } from './performance';
import { getProviderCreators } from './providers';
import type {
	CollectionHandlers,
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

interface CollectionState {
	awareness?: Awareness;
	core: EngineCollection;
	handlers: CollectionHandlers;
	providers: ProviderCreatorResult[];
	syncConfig: SyncConfig;
	unload: () => void;
}

interface EntityState {
	awareness?: Awareness;
	core: EngineEntity;
	handlers: RecordHandlers;
	objectId: ObjectID;
	objectType: ObjectType;
	providers: ProviderCreatorResult[];
	syncConfig: SyncConfig;
	unload: () => void;
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
 * connects to providers, wires their session codecs, and coordinates with the
 * `core-data` store. It is engine-neutral: the injected {@link SyncEngine}
 * owns the document model (the Yjs relay, the intent log, …); the manager owns
 * negotiation, provider wiring, lifecycle, and the deferred-update policy.
 *
 * @param engine        The engine that owns per-entity/collection document meaning.
 * @param options       Manager options.
 * @param options.debug Whether to enable performance and debug logging.
 */
export function createSyncManager(
	engine: SyncEngine,
	{ debug = false }: { debug?: boolean } = {}
): SyncManager {
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
	 * called in the code linked above, but it is a no-op. The engine-provided
	 * undo manager tracks changes itself (e.g. the Yjs engine observes its CRDT
	 * doc).
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

		if ( false === syncConfig.shouldSync?.( objectType, objectId ) ) {
			log( 'loadEntity', 'shouldSync false, skipping', entityId );
			return; // Sync config indicates that this entity should not be synced.
		}

		log( 'loadEntity', 'loading', entityId );

		handlers = {
			addUndoMeta: debugWrap( handlers.addUndoMeta ),
			editRecord: debugWrap( handlers.editRecord ),
			getEditedRecord: debugWrap( handlers.getEditedRecord ),
			onStatusChange: debugWrap( handlers.onStatusChange ),
			persistCRDTDoc: debugWrap( handlers.persistCRDTDoc ),
			refetchRecord: debugWrap( handlers.refetchRecord ),
			restoreUndoMeta: debugWrap( handlers.restoreUndoMeta ),

			onUndoStackChange: handlers.onUndoStackChange
				? debugWrap( handlers.onUndoStackChange )
				: undefined,
		};

		const core = engine.createEntity( {
			syncConfig,
			objectType,
			objectId,
		} );
		const awareness = core.awareness;

		// Track whether unload ran (possibly while we were awaiting provider
		// creation), so the post-await code can destroy any providers that
		// were created after unload and bail out.
		let isEntityUnloaded = false;

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			log( 'loadEntity', 'unloading', entityId );
			isEntityUnloaded = true;
			providerResults?.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			core.destroy();
			entityStates.delete( entityId );
		};

		// Lazily create the undo manager when the first entity is loaded. Undo
		// is engine-specific (see SyncEngine.createUndoManager), so the engine
		// owns it; an engine without collaborative undo leaves it undefined.
		if ( ! undoManager ) {
			undoManager = engine.createUndoManager?.();
		}

		if ( undoManager ) {
			const { addUndoMeta, onUndoStackChange, restoreUndoMeta } =
				handlers;
			core.addToUndoScope( undoManager, {
				addUndoMeta,
				restoreUndoMeta,
				onUndoStackChange,
			} );
		}

		// Declare with let before using it in unload closure.
		// eslint-disable-next-line prefer-const
		let providerResults: ProviderCreatorResult[];

		const entityState: EntityState = {
			awareness,
			core,
			handlers,
			objectId,
			objectType,
			providers: [],
			syncConfig,
			unload,
		};

		entityStates.set( entityId, entityState );

		// Create providers for the given entity. Each provider receives its
		// own engine session codec, so transports never handle engine
		// internals directly.
		log( 'loadEntity', 'connecting', entityId );
		providerResults = await Promise.all(
			providerCreators.map( async ( create ) => {
				const provider = await create( {
					objectType,
					objectId,
					session: core.createSession(),
				} );

				// Attach listeners after provider creation.
				provider.on( 'status', handlers.onStatusChange );

				return provider;
			} )
		);

		// If unload() or unloadAll() ran while we were awaiting provider
		// creation, destroy the just-created providers and bail out before
		// attempting to use the connection
		if ( isEntityUnloaded ) {
			log( 'loadEntity', 'unloaded during connect, aborting', entityId );
			providerResults.forEach( ( result ) => result.destroy() );
			return;
		}

		// Expose the live providers so the manager's retry() can reach them.
		entityState.providers = providerResults;

		// Seed the document from the persisted record. Observers are attached
		// AFTER hydration so it does not dispatch a redundant editRecord whose
		// blocks already match the editor's parsed content.
		core.hydrate( record, () => handlers.persistCRDTDoc() );

		// Attach observers for remote-driven changes and peer saves.
		core.observe( {
			onRemoteChange: () =>
				void internal.updateEntityRecord( objectType, objectId ),
			onPeerSave: () => {
				log( 'loadEntity', 'refetching record', entityId );
				void handlers.refetchRecord().catch( () => {} );
			},
		} );
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

		if ( false === syncConfig.shouldSync?.( objectType, null ) ) {
			log( 'loadCollection', 'shouldSync false, skipping', entityId );
			return; // Sync config indicates that this entity should not be synced.
		}

		log( 'loadCollection', 'loading', entityId );

		const core = engine.createCollection( { syncConfig, objectType } );
		const awareness = core.awareness;

		// Track whether unload ran (possibly while we were awaiting provider
		// creation), so the post-await code can destroy any providers that
		// were created after unload and bail out.
		let isCollectionUnloaded = false;

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			log( 'loadCollection', 'unloading', entityId );
			isCollectionUnloaded = true;
			providerResults?.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			core.destroy();
			collectionStates.delete( objectType );
		};

		// Declare with let before using it in unload closure.
		// eslint-disable-next-line prefer-const
		let providerResults: ProviderCreatorResult[];

		const collectionState: CollectionState = {
			awareness,
			core,
			handlers,
			providers: [],
			syncConfig,
			unload,
		};

		collectionStates.set( objectType, collectionState );

		// Create providers for the given collection. Each provider receives
		// its own engine session codec, so transports never handle engine
		// internals directly.
		log( 'loadCollection', 'connecting', entityId );
		providerResults = await Promise.all(
			providerCreators.map( async ( create ) => {
				const provider = await create( {
					objectType,
					objectId: null,
					session: core.createSession(),
				} );

				// Attach status listener after provider creation.
				provider.on( 'status', handlers.onStatusChange );

				return provider;
			} )
		);

		// If unload() or unloadAll() ran while we were awaiting provider
		// creation, destroy the just-created providers and bail out before
		// attempting to use the connection
		if ( isCollectionUnloaded ) {
			log(
				'loadCollection',
				'unloaded during connect, aborting',
				entityId
			);
			providerResults.forEach( ( result ) => result.destroy() );
			return;
		}

		// Expose the live providers so the manager's retry() can reach them.
		collectionState.providers = providerResults;

		// Attach peer-save observation, then initialize the document.
		core.observe( {
			onPeerSave: () => void handlers.refetchRecords().catch( () => {} ),
		} );
		core.initialize();
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
		updateCRDTDoc( objectType, null, {}, origin, {
			isSave: true,
		} );
	}

	/**
	 * Unload all loaded entities, stopping all syncing.
	 */
	function unloadAll(): void {
		log( 'unloadAll', 'unloading all entities', 'all' );

		for ( const [ , entityState ] of [ ...entityStates ] ) {
			entityState.unload();
		}
		entityStates.clear();
		undoManager = undefined;

		for ( const [ , collectionState ] of [ ...collectionStates ] ) {
			collectionState.unload();
		}
		collectionStates.clear();
	}

	/**
	 * Retry the active connection(s) after a connection error. Best-effort:
	 * asks every live provider across all loaded entities and collections to
	 * retry (see `ProviderCreatorResult.retry`); transports without an explicit
	 * retry are skipped. Transport-agnostic — the manager does not know or care
	 * which transport is active.
	 */
	function retry(): void {
		log( 'retry', 'retrying all providers', 'all' );
		for ( const [ , entityState ] of entityStates ) {
			entityState.providers.forEach( ( provider ) => provider.retry?.() );
		}
		for ( const [ , collectionState ] of collectionStates ) {
			collectionState.providers.forEach(
				( provider ) => provider.retry?.()
			);
		}
	}

	/**
	 * Get the awareness instance for the given object type and object ID, if supported.
	 *
	 * @template {Awareness} State
	 * @param {ObjectType}    objectType Object type.
	 * @param {ObjectID|null} objectId   Object ID.
	 * @return {State | undefined} The awareness instance, or undefined if not supported.
	 */
	function getAwareness< State extends Awareness >(
		objectType: ObjectType,
		objectId: ObjectID | null
	): State | undefined {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState || ! entityState.awareness ) {
			return undefined;
		}

		return entityState.awareness as State;
	}

	/**
	 * Update CRDT document with changes from the local store.
	 *
	 * @param {ObjectType}               objectType             Object type.
	 * @param {ObjectID}                 objectId               Object ID.
	 * @param {Partial< ObjectData >}    changes                Updates to make.
	 * @param {string}                   origin                 The source of change.
	 * @param {SyncManagerUpdateOptions} options                Optional flags for the update.
	 * @param {boolean}                  options.isSave         Whether this update represents a user-facing entity save.
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
			const { core } = entityState;

			// If this change should create a new undo level, tell the undo
			// manager to stop capturing and create a new undo group.
			// We can't do this in the undo manager itself, because addRecord() is
			// called after the CRDT changes have been applied, and we want to
			// ensure that the undo set is created before the changes are applied.
			if ( isNewUndoLevel && undoManager ) {
				undoManager.stopCapturing?.();
			}

			log( 'updateCRDTDoc', 'applying changes', entityId, {
				changedKeys: Object.keys( changes ),
			} );
			core.applyLocalChanges( changes, origin, { isSave } );
		}

		if ( collectionState && isSave ) {
			collectionState.core.markSaved( origin );
		}
	}

	/*
	 * Local updates deferred off the typing hot path (#79964). They are held
	 * in a queue, rather than closed over in their timeouts, so that reads of
	 * the document (snapshots, persistence) can flush them synchronously
	 * instead of waiting out the scheduled timeout.
	 */
	const pendingCRDTDocUpdates: Array< Parameters< typeof updateCRDTDoc > > =
		[];

	function flushPendingCRDTDocUpdates(): void {
		while ( pendingCRDTDocUpdates.length > 0 ) {
			const args = pendingCRDTDocUpdates.shift();

			if ( args ) {
				updateCRDTDoc( ...args );
			}
		}
	}

	// Deferred variant of `updateCRDTDoc`; keeps work off the typing hot path.
	function deferUpdateCRDTDoc(
		...args: Parameters< typeof updateCRDTDoc >
	): void {
		pendingCRDTDocUpdates.push( args );
		setTimeout( flushPendingCRDTDocUpdates, 0 );
	}

	// Apply local changes to the CRDT doc, synchronously when a remote peer is
	// present so the change lands before a remote update can race it (#78756),
	// otherwise deferred off the typing hot path (#79964).
	function updateOrDefer(
		objectType: ObjectType,
		objectId: ObjectID | null,
		changes: Partial< ObjectData >,
		origin: string,
		options: SyncManagerUpdateOptions = {}
	): void {
		// `getStates()` counts the local client, so > 1 means a remote peer.
		const hasRemotePeers =
			( getAwareness( objectType, objectId )?.getStates().size ?? 0 ) > 1;

		if ( hasRemotePeers ) {
			// Apply any updates queued while editing alone first, so changes
			// are never applied out of order.
			flushPendingCRDTDocUpdates();
			updateCRDTDoc( objectType, objectId, changes, origin, options );
			return;
		}

		deferUpdateCRDTDoc( objectType, objectId, changes, origin, options );
	}

	/**
	 * Encode the current state of an entity's CRDT document as a snapshot.
	 *
	 * The result describes what the document holds right now without including
	 * any content. It is recorded alongside an autosave so another session can
	 * later verify its own document contains everything the autosave captured.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 * @return {string|undefined} Base64-encoded snapshot, or undefined when the
	 *                            entity is not loaded.
	 */
	function getEntitySnapshot(
		objectType: ObjectType,
		objectId: ObjectID
	): string | undefined {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState ) {
			log( 'getEntitySnapshot', 'no entity state', entityId );
			return undefined;
		}

		// Apply deferred updates so the snapshot reflects every change issued
		// before it, including changes made in the same tick.
		flushPendingCRDTDocUpdates();

		return entityState.core.encodeSnapshot();
	}

	/**
	 * Determine whether an entity's CRDT document contains everything a
	 * snapshot describes.
	 *
	 * Returns `false` when the entity is not loaded or the snapshot cannot be
	 * decoded, so callers fail open and surface the autosave.
	 *
	 * @param {ObjectType} objectType      Object type.
	 * @param {ObjectID}   objectId        Object ID.
	 * @param {string}     encodedSnapshot Base64-encoded snapshot.
	 * @return {boolean} Whether the document contains the snapshotted state.
	 */
	function entityContainsSnapshot(
		objectType: ObjectType,
		objectId: ObjectID,
		encodedSnapshot: string
	): boolean {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState ) {
			return false;
		}

		// Compare against the settled document, with no deferred updates
		// pending.
		flushPendingCRDTDocUpdates();

		return entityState.core.containsSnapshot( encodedSnapshot );
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

		const { core, handlers } = entityState;

		// Determine which synced properties have actually changed by comparing
		// them against the current edited entity record.
		const changes = core.getEditorChanges(
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

		if ( ! entityState ) {
			return null;
		}

		// Local updates may be deferred when editing alone. Apply them so
		// they are included in the serialized document.
		flushPendingCRDTDocUpdates();

		return entityState.core.serialize();
	}

	// Collect internal functions so that they can be wrapped before calling.
	const internal = {
		updateEntityRecord: debugWrap( _updateEntityRecord ),
	};

	// Wrap and return the public API.
	return {
		createPersistedCRDTDoc: debugWrap( createPersistedCRDTDoc ),
		entityContainsSnapshot: debugWrap( entityContainsSnapshot ),
		getAwareness,
		getEntitySnapshot: debugWrap( getEntitySnapshot ),
		load: debugWrap( loadEntity ),
		loadCollection: debugWrap( loadCollection ),
		// Use getter to ensure we always return the current value of `undoManager`.
		get undoManager(): SyncUndoManager | undefined {
			return undoManager;
		},
		unload: debugWrap( unloadEntity ),
		unloadAll: debugWrap( unloadAll ),
		update: debugWrap( updateOrDefer ),
		retry: debugWrap( retry ),
	};
}
