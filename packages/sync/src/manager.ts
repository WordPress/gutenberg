/**
 * External dependencies
 */
import * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * Internal dependencies
 */
import {
	CRDT_RECORD_MAP_KEY,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_MAP_SAVED_AT_KEY as SAVED_AT_KEY,
	CRDT_STATE_MAP_SAVED_BY_KEY as SAVED_BY_KEY,
	LOCAL_SYNC_MANAGER_ORIGIN,
} from './config';
import { logPerformanceTiming, passThru } from './performance';
import { getProviderCreators } from './providers';
import type {
	CollectionHandlers,
	CreatePersistedCRDTDocOptions,
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
	getPersistedCrdtDocBaseRecordSnapshot,
	getPersistedCrdtDocRecordSnapshot,
	getPersistedCrdtDocVersion,
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
	remoteKeyVersions: Map< string, number >;
	reconcilingRemoteKeys: Set< string >;
	syncConfig: SyncConfig;
	unload: () => void;
	ydoc: CRDTDoc;
}

const CRDT_DOC_META_HAS_PROVIDER_SYNCED_REMOTE_STATE =
	'hasProviderSyncedRemoteState';

function areUint8ArraysEqual( a: Uint8Array, b: Uint8Array ): boolean {
	if ( a.length !== b.length ) {
		return false;
	}

	return a.every( ( value, index ) => value === b[ index ] );
}

function getPersistableCrdtDocState( ydoc: CRDTDoc ) {
	const state = ydoc.getMap( CRDT_STATE_MAP_KEY ).toJSON() as Record<
		string,
		unknown
	>;

	delete state[ SAVED_AT_KEY ];
	delete state[ SAVED_BY_KEY ];

	return {
		record: ydoc.getMap( CRDT_RECORD_MAP_KEY ).toJSON(),
		state,
	};
}

function hasPersistableCrdtDocStateChanged(
	ydoc: CRDTDoc,
	basePersistedCRDTDoc: string | null | undefined
): boolean {
	if ( ! basePersistedCRDTDoc ) {
		return true;
	}

	const baseDoc = deserializeCrdtDoc( basePersistedCRDTDoc );
	if ( ! baseDoc ) {
		return true;
	}

	try {
		return ! fastDeepEqual(
			getPersistableCrdtDocState( ydoc ),
			getPersistableCrdtDocState( baseDoc )
		);
	} finally {
		baseDoc.destroy();
	}
}

interface ApplyPersistedCrdtDocOptions {
	shouldPersist?: boolean;
}

function getComparableSnapshotValue( value: unknown ): unknown {
	if (
		'object' === typeof value &&
		null !== value &&
		! Array.isArray( value ) &&
		'raw' in value
	) {
		return ( value as { raw?: unknown } ).raw;
	}

	return value;
}

function filterStaleRecordSnapshotInvalidations(
	invalidations: ObjectData,
	record: ObjectData,
	recordSnapshot: ObjectData | null,
	baseRecordSnapshot: ObjectData | null
): ObjectData {
	if ( ! recordSnapshot ) {
		return invalidations;
	}

	return Object.fromEntries(
		Object.entries( invalidations ).filter( ( [ key ] ) => {
			if (
				! Object.prototype.hasOwnProperty.call( recordSnapshot, key )
			) {
				return true;
			}

			const recordValue = getComparableSnapshotValue( record[ key ] );
			const snapshotValue = getComparableSnapshotValue(
				recordSnapshot[ key ]
			);

			if ( fastDeepEqual( recordValue, snapshotValue ) ) {
				return true;
			}

			if (
				! baseRecordSnapshot ||
				! Object.prototype.hasOwnProperty.call(
					baseRecordSnapshot,
					key
				)
			) {
				return true;
			}

			const baseSnapshotValue = getComparableSnapshotValue(
				baseRecordSnapshot[ key ]
			);

			// If the persisted snapshot did not change this field, a divergent
			// record value can be a stale entity value from the same save cycle.
			// Do not let it overwrite the persisted CRDT document.
			if ( fastDeepEqual( snapshotValue, baseSnapshotValue ) ) {
				return false;
			}

			return ! fastDeepEqual( recordValue, baseSnapshotValue );
		} )
	);
}

function hasPersistedRecordSnapshotChanged(
	basePersistedCRDTDoc: string | null | undefined,
	options: CreatePersistedCRDTDocOptions
): boolean {
	if ( ! basePersistedCRDTDoc ) {
		return false;
	}

	if (
		'baseRecordSnapshot' in options &&
		! fastDeepEqual(
			getPersistedCrdtDocBaseRecordSnapshot( basePersistedCRDTDoc ),
			options.baseRecordSnapshot ?? null
		)
	) {
		return true;
	}

	return (
		'recordSnapshot' in options &&
		! fastDeepEqual(
			getPersistedCrdtDocRecordSnapshot( basePersistedCRDTDoc ),
			options.recordSnapshot ?? null
		)
	);
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

function getTopLevelRecordKeysFromEvents(
	events: Y.YEvent< any >[]
): string[] {
	const keys = new Set< string >();

	for ( const event of events ) {
		const [ key ] = event.path;
		if ( 'string' === typeof key ) {
			keys.add( key );
			continue;
		}

		if ( event instanceof Y.YMapEvent ) {
			event.keysChanged.forEach( ( changedKey ) =>
				keys.add( changedKey )
			);
		}
	}

	return [ ...keys ];
}

function getScheduledRemoteKeyVersions(
	entityState: EntityState | undefined,
	changes: Partial< ObjectData >
): Map< string, number > {
	const versions = new Map< string, number >();

	if ( ! entityState ) {
		return versions;
	}

	Object.keys( changes ).forEach( ( key ) => {
		versions.set( key, entityState.remoteKeyVersions.get( key ) ?? 0 );
	} );

	return versions;
}

function isUnchangedBaseRecordValue(
	key: string,
	value: unknown,
	options: SyncManagerUpdateOptions
): boolean {
	if ( ! options.baseRecord || key === 'blocks' ) {
		return false;
	}

	if ( ! Object.prototype.hasOwnProperty.call( options.baseRecord, key ) ) {
		return false;
	}

	return fastDeepEqual(
		getComparableSnapshotValue( options.baseRecord[ key ] ),
		getComparableSnapshotValue( value )
	);
}

function isStaleSaveReconciliationValue(
	key: string,
	value: unknown,
	ydoc: CRDTDoc,
	options: SyncManagerUpdateOptions
): boolean {
	if ( ! options.isSave || key === 'blocks' ) {
		return false;
	}

	const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
	if ( ! recordMap.has( key ) ) {
		return false;
	}

	return ! fastDeepEqual(
		getComparableSnapshotValue( recordMap.get( key ) ),
		getComparableSnapshotValue( value )
	);
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
			onUndoStackChange: debugWrap( handlers.onUndoStackChange ),
			onStatusChange: debugWrap( handlers.onStatusChange ),
			persistCRDTDoc: debugWrap( handlers.persistCRDTDoc ),
			refetchRecord: debugWrap( handlers.refetchRecord ),
			restoreUndoMeta: debugWrap( handlers.restoreUndoMeta ),
		};

		const ydoc = createYjsDoc( { objectType } );
		const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
		const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
		const now = Date.now();
		let providerResults: ProviderCreatorResult[] = [];
		let hasObserversAttached = false;
		let isEntityUnloaded = false;
		let isObservingProviderBootstrapRemoteState = true;
		const markProviderSyncedRemoteState = (
			transaction: Y.Transaction
		): void => {
			if ( transaction.local ) {
				return;
			}

			ydoc.meta?.set(
				CRDT_DOC_META_HAS_PROVIDER_SYNCED_REMOTE_STATE,
				true
			);
		};
		const stopObservingProviderBootstrapRemoteState = (): void => {
			if ( ! isObservingProviderBootstrapRemoteState ) {
				return;
			}

			ydoc.off( 'afterTransaction', markProviderSyncedRemoteState );
			isObservingProviderBootstrapRemoteState = false;
		};

		ydoc.on( 'afterTransaction', markProviderSyncedRemoteState );

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			log( 'loadEntity', 'unloading', entityId );
			isEntityUnloaded = true;
			stopObservingProviderBootstrapRemoteState();
			providerResults.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			if ( hasObserversAttached ) {
				recordMap.unobserveDeep( onRecordUpdate );
				stateMap.unobserve( onStateMapUpdate );
			}
			ydoc.destroy();
			entityStates.delete( entityId );
		};

		// If the sync config supports awareness, create it.
		const awareness = syncConfig.createAwareness?.( ydoc, objectId );

		// When the CRDT document is updated by an UndoManager or a connection (not
		// a local origin), update the local store.
		const onRecordUpdate = (
			events: Y.YEvent< any >[],
			transaction: Y.Transaction
		): void => {
			if (
				transaction.local &&
				! ( transaction.origin instanceof Y.UndoManager )
			) {
				return;
			}

			const remoteChangedKeys = transaction.local
				? []
				: getTopLevelRecordKeysFromEvents( events );

			const currentEntityState = entityStates.get( entityId );
			if ( currentEntityState ) {
				remoteChangedKeys.forEach( ( key ) => {
					currentEntityState.remoteKeyVersions.set(
						key,
						( currentEntityState.remoteKeyVersions.get( key ) ??
							0 ) + 1
					);
					currentEntityState.reconcilingRemoteKeys.add( key );
				} );
			}

			void internal.updateEntityRecord(
				objectType,
				objectId,
				remoteChangedKeys
			);
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

		const { addUndoMeta, onUndoStackChange, restoreUndoMeta } = handlers;
		undoManager.addToScope( recordMap, {
			addUndoMeta,
			onUndoStackChange,
			restoreUndoMeta,
		} );

		const entityState: EntityState = {
			awareness,
			handlers,
			objectId,
			objectType,
			remoteKeyVersions: new Map(),
			reconcilingRemoteKeys: new Set(),
			syncConfig,
			unload,
			ydoc,
		};

		entityStates.set( entityId, entityState );

		// Create providers for the given entity and its Yjs document.
		log( 'loadEntity', 'connecting', entityId );
		providerResults = await Promise.all(
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

		if ( isEntityUnloaded ) {
			log( 'loadEntity', 'unloaded during connect, aborting', entityId );
			providerResults.forEach( ( result ) => result.destroy() );
			return;
		}

		// Give providers one event loop turn to flush bootstrap updates that can
		// be queued immediately after their initial sync signal. Otherwise, stale
		// persisted state may be applied before remote peer state is observed.
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		if ( isEntityUnloaded ) {
			log(
				'loadEntity',
				'unloaded after bootstrap wait, aborting',
				entityId
			);
			return;
		}

		try {
			// Initialize the Yjs document with the necessary CRDT state.
			initializeYjsDoc( ydoc );

			// Get and apply the persisted CRDT document, if it exists. Observers are
			// attached after this load-time CRDT initialization so local hydration
			// does not trigger a redundant CRDT-to-store update.
			internal.applyPersistedCrdtDoc( objectType, objectId, record );

			// Attach observers.
			recordMap.observeDeep( onRecordUpdate );
			stateMap.observe( onStateMapUpdate );
			hasObserversAttached = true;

			// Reflect CRDT-normalized runtime values, such as hidden table row
			// identities, back into the local edited record after it exists in the
			// store.
			await internal.hydrateRecordFromCrdtDoc( objectType, objectId );
		} finally {
			stopObservingProviderBootstrapRemoteState();
		}
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

		const ydoc = createYjsDoc( { collection: true, objectType } );
		const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
		const now = Date.now();
		let providerResults: ProviderCreatorResult[] = [];
		let hasObserversAttached = false;
		let isCollectionUnloaded = false;

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			log( 'loadCollection', 'unloading', entityId );
			isCollectionUnloaded = true;
			providerResults.forEach( ( result ) => result.destroy() );
			handlers.onStatusChange( null );
			if ( hasObserversAttached ) {
				stateMap.unobserve( onStateMapUpdate );
			}
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

		// Create providers for the given entity and its Yjs document.
		log( 'loadCollection', 'connecting', entityId );
		providerResults = await Promise.all(
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

		if ( isCollectionUnloaded ) {
			log(
				'loadCollection',
				'unloaded during connect, aborting',
				entityId
			);
			providerResults.forEach( ( result ) => result.destroy() );
			return;
		}

		// Attach observers.
		stateMap.observe( onStateMapUpdate );
		hasObserversAttached = true;

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
		updateCRDTDoc( objectType, null, {}, origin, { isSave: true } );
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
	 * @param {Object}     options    Options for applying the persisted CRDT document.
	 */
	function _applyPersistedCrdtDoc(
		objectType: ObjectType,
		objectId: ObjectID,
		record: ObjectData,
		options: ApplyPersistedCrdtDocOptions = {}
	): void {
		const { shouldPersist = true } = options;
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

		if (
			targetDoc.meta?.get(
				CRDT_DOC_META_HAS_PROVIDER_SYNCED_REMOTE_STATE
			)
		) {
			log(
				'applyPersistedCrdtDoc',
				'provider already applied remote state',
				entityId
			);
			void internal.updateEntityRecord( objectType, objectId );
			return;
		}

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
				if ( shouldPersist ) {
					handlers.persistCRDTDoc();
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
		const recordSnapshot = getPersistedCrdtDocRecordSnapshot( serialized );
		const baseRecordSnapshot =
			getPersistedCrdtDocBaseRecordSnapshot( serialized );
		const invalidations = filterStaleRecordSnapshotInvalidations(
			getChangesFromCRDTDoc( tempDoc, record ),
			record,
			recordSnapshot,
			baseRecordSnapshot
		);
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
			if ( shouldPersist ) {
				handlers.persistCRDTDoc();
			}
		}, LOCAL_SYNC_MANAGER_ORIGIN );
	}

	/**
	 * Hydrate the local edited record from the live CRDT document after load-time
	 * initialization. Some synced fields normalize runtime-only data into the CRDT
	 * document, such as hidden table row identity symbols, without changing the
	 * serialized entity content.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 */
	async function hydrateRecordFromCrdtDoc(
		objectType: ObjectType,
		objectId: ObjectID
	): Promise< void > {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState ) {
			log( 'hydrateRecordFromCrdtDoc', 'no entity state', entityId );
			return;
		}

		const { handlers, syncConfig, ydoc } = entityState;
		const changes = syncConfig.getChangesFromCRDTDoc(
			ydoc,
			await handlers.getEditedRecord()
		);
		const changedKeys = Object.keys( changes );

		if ( 0 === changedKeys.length ) {
			return;
		}

		log( 'hydrateRecordFromCrdtDoc', 'changes', entityId, {
			changedKeys,
		} );
		handlers.editRecord( changes, {
			undoIgnore: true,
			__unstableSkipSyncUpdate: true,
		} );
	}

	/**
	 * Update CRDT document with changes from the local store.
	 *
	 * @param {ObjectType}               objectType                 Object type.
	 * @param {ObjectID}                 objectId                   Object ID.
	 * @param {Partial< ObjectData >}    changes                    Updates to make.
	 * @param {string}                   origin                     The source of change.
	 * @param {SyncManagerUpdateOptions} options                    Optional flags for the update.
	 * @param {boolean}                  options.isSave             Whether this update is part of a save operation. Defaults to false.
	 * @param {boolean}                  options.isNewUndoLevel     Whether to create a new undo level for this change. Defaults to false.
	 * @param {Map< string, number >}    scheduledRemoteKeyVersions Remote key versions captured when the local update was scheduled.
	 */
	function updateCRDTDoc(
		objectType: ObjectType,
		objectId: ObjectID | null,
		changes: Partial< ObjectData >,
		origin: string,
		options: SyncManagerUpdateOptions = {},
		scheduledRemoteKeyVersions?: Map< string, number >
	): void {
		const { isSave = false, isNewUndoLevel = false } = options;
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( entityState ) {
			const { syncConfig, ydoc } = entityState;
			const remoteKeyVersionsAtUpdate =
				scheduledRemoteKeyVersions ??
				getScheduledRemoteKeyVersions( entityState, changes );
			let changesToApply = changes;

			if ( entityState.reconcilingRemoteKeys.size > 0 ) {
				changesToApply = Object.fromEntries(
					Object.entries( changes ).filter( ( [ key, value ] ) => {
						if ( key === 'blocks' ) {
							return true;
						}

						if ( ! entityState.reconcilingRemoteKeys.has( key ) ) {
							return true;
						}

						if (
							isStaleSaveReconciliationValue(
								key,
								value,
								ydoc,
								options
							)
						) {
							return false;
						}

						if (
							isUnchangedBaseRecordValue( key, value, options )
						) {
							return false;
						}

						return (
							( entityState.remoteKeyVersions.get( key ) ??
								0 ) ===
							( remoteKeyVersionsAtUpdate.get( key ) ?? 0 )
						);
					} )
				);

				if ( 0 === Object.keys( changesToApply ).length && ! isSave ) {
					return;
				}
			}

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
					changedKeys: Object.keys( changesToApply ),
				} );
				if ( options.baseRecord ) {
					syncConfig.applyChangesToCRDTDoc( ydoc, changesToApply, {
						baseRecord: options.baseRecord,
						...( isSave ? { isSave } : {} ),
					} );
				} else {
					syncConfig.applyChangesToCRDTDoc( ydoc, changesToApply );
				}

				if ( isSave ) {
					markEntityAsSaved( ydoc );
				}
			}, origin );
		}

		const collectionState = collectionStates.get( objectType );
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
	 * @param {ObjectType} objectType        Object type of record to update.
	 * @param {ObjectID}   objectId          Object ID of record to update.
	 * @param {string[]}   preReconciledKeys Keys being reconciled before this update.
	 */
	async function _updateEntityRecord(
		objectType: ObjectType,
		objectId: ObjectID,
		preReconciledKeys: string[] = []
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
			preReconciledKeys.forEach( ( key ) =>
				entityState.reconcilingRemoteKeys.delete( key )
			);
			return;
		}

		log( 'updateEntityRecord', 'changes', entityId, {
			changedKeys,
		} );
		const keysToReconcile = [
			...new Set( [ ...preReconciledKeys, ...changedKeys ] ),
		];
		keysToReconcile.forEach( ( key ) =>
			entityState.reconcilingRemoteKeys.add( key )
		);
		handlers.editRecord( changes, { __unstableSkipSyncUpdate: true } );
		void clearReconciledRemoteKeys( entityState, keysToReconcile );
	}

	async function clearReconciledRemoteKeys(
		entityState: EntityState,
		keys: string[],
		attempt = 0
	): Promise< void > {
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		const changes = entityState.syncConfig.getChangesFromCRDTDoc(
			entityState.ydoc,
			await entityState.handlers.getEditedRecord()
		);

		for ( const key of keys ) {
			if ( ! Object.prototype.hasOwnProperty.call( changes, key ) ) {
				entityState.reconcilingRemoteKeys.delete( key );
			}
		}

		if (
			keys.some( ( key ) =>
				entityState.reconcilingRemoteKeys.has( key )
			) &&
			attempt < 5
		) {
			return clearReconciledRemoteKeys( entityState, keys, attempt + 1 );
		}

		keys.forEach( ( key ) =>
			entityState.reconcilingRemoteKeys.delete( key )
		);
	}

	/**
	 * Create object meta to persist the CRDT document in the entity record.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 * @param {Object}     options    Options for creating the persisted document.
	 */
	async function createPersistedCRDTDoc(
		objectType: ObjectType,
		objectId: ObjectID,
		options: CreatePersistedCRDTDocOptions = {}
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

		if (
			! hasPersistableCrdtDocStateChanged(
				entityState.ydoc,
				options.basePersistedCRDTDoc
			) &&
			! hasPersistedRecordSnapshotChanged(
				options.basePersistedCRDTDoc,
				options
			)
		) {
			return options.basePersistedCRDTDoc ?? null;
		}

		return serializeCrdtDoc( entityState.ydoc, {
			baseVersion: getPersistedCrdtDocVersion(
				options.basePersistedCRDTDoc
			),
			baseRecordSnapshot: options.baseRecordSnapshot,
			recordSnapshot: options.recordSnapshot,
		} );
	}

	async function applyPersistedCRDTDoc(
		objectType: ObjectType,
		objectId: ObjectID,
		record: ObjectData
	): Promise< boolean > {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );
		const previousStateVector = entityState?.ydoc
			? Y.encodeStateVector( entityState.ydoc )
			: null;

		internal.applyPersistedCrdtDoc( objectType, objectId, record, {
			shouldPersist: false,
		} );
		await internal.updateEntityRecord( objectType, objectId );

		// Applying a persisted document can schedule local store updates. Yield so
		// callers that immediately inspect the document see the completed merge.
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		const nextStateVector = entityState?.ydoc
			? Y.encodeStateVector( entityState.ydoc )
			: null;

		return !! (
			previousStateVector &&
			nextStateVector &&
			! areUint8ArraysEqual( previousStateVector, nextStateVector )
		);
	}

	async function hydrateRecordFromPersistedCRDTDoc(
		objectType: ObjectType,
		objectId: ObjectID,
		record: ObjectData
	): Promise< boolean > {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );
		const previousStateVector = entityState?.ydoc
			? Y.encodeStateVector( entityState.ydoc )
			: null;

		if ( ! entityState ) {
			log(
				'hydrateRecordFromPersistedCRDTDoc',
				'no entity state',
				entityId
			);
			return false;
		}

		const serialized =
			entityState.syncConfig.getPersistedCRDTDoc?.( record );
		const tempDoc = serialized ? deserializeCrdtDoc( serialized ) : null;

		if ( tempDoc ) {
			const recordSnapshot =
				getPersistedCrdtDocRecordSnapshot( serialized );
			const baseRecordSnapshot =
				getPersistedCrdtDocBaseRecordSnapshot( serialized );
			const invalidations = recordSnapshot
				? filterStaleRecordSnapshotInvalidations(
						entityState.syncConfig.getChangesFromCRDTDoc(
							tempDoc,
							record
						),
						record,
						recordSnapshot,
						baseRecordSnapshot
				  )
				: {};
			const invalidatedKeys = Object.keys( invalidations );

			if ( invalidatedKeys.length ) {
				const changes = invalidatedKeys.reduce< ObjectData >(
					( acc, key ) =>
						Object.assign( acc, {
							[ key ]: record[ key ],
						} ),
					{}
				);
				if (
					invalidatedKeys.includes( 'blocks' ) &&
					! ( 'content' in changes ) &&
					Object.prototype.hasOwnProperty.call( record, 'content' )
				) {
					changes.content = record.content;
				}
				entityState.ydoc.transact( () => {
					entityState.syncConfig.applyChangesToCRDTDoc(
						entityState.ydoc,
						changes
					);
				}, LOCAL_SYNC_MANAGER_ORIGIN );
			} else {
				const update = Y.encodeStateAsUpdateV2( tempDoc );
				Y.applyUpdateV2( entityState.ydoc, update );
			}
			tempDoc.destroy();
		} else {
			log(
				'hydrateRecordFromPersistedCRDTDoc',
				'no persisted doc',
				entityId
			);
		}

		await internal.hydrateRecordFromCrdtDoc( objectType, objectId );

		// Hydration can schedule local store updates. Yield so callers that
		// immediately inspect the record see the completed merge.
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		const nextStateVector = Y.encodeStateVector( entityState.ydoc );

		return !! (
			previousStateVector &&
			! areUint8ArraysEqual( previousStateVector, nextStateVector )
		);
	}

	function getCRDTRecordData(
		objectType: ObjectType,
		objectId: ObjectID
	): ObjectData | undefined {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		return entityState?.ydoc.getMap( CRDT_RECORD_MAP_KEY ).toJSON() as
			| ObjectData
			| undefined;
	}

	// Collect internal functions so that they can be wrapped before calling.
	const internal = {
		applyPersistedCrdtDoc: debugWrap( _applyPersistedCrdtDoc ),
		hydrateRecordFromCrdtDoc: debugWrap( hydrateRecordFromCrdtDoc ),
		updateEntityRecord: debugWrap( _updateEntityRecord ),
	};

	// Wrap and return the public API.
	return {
		applyPersistedCRDTDoc: debugWrap( applyPersistedCRDTDoc ),
		createPersistedCRDTDoc: debugWrap( createPersistedCRDTDoc ),
		hydrateRecordFromPersistedCRDTDoc: debugWrap(
			hydrateRecordFromPersistedCRDTDoc
		),
		getCRDTRecordData: debugWrap( getCRDTRecordData ),
		getAwareness,
		load: debugWrap( loadEntity ),
		loadCollection: debugWrap( loadCollection ),
		// Use getter to ensure we always return the current value of `undoManager`.
		get undoManager(): SyncUndoManager | undefined {
			return undoManager;
		},
		unload: debugWrap( unloadEntity ),
		unloadAll: debugWrap( unloadAll ),
		update: debugWrap( updateCRDTDoc ),
	};
}
