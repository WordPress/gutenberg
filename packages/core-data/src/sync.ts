import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import { dispatch, resolveSelect, select } from '@wordpress/data';
import {
	privateApis as syncPrivateApis,
	type ConnectionStatus,
	type ObjectID,
	type SyncConfig,
	type SyncManager,
	type Y,
} from '@wordpress/sync';
import {
	registerEntitySyncManager,
	type EntitySyncBeforeSaveContext,
	type EntitySyncCollectionHandlers,
	type EntitySyncEditOptions,
	type EntitySyncManager,
	type EntitySyncRecord,
	type EntitySyncRecordHandlers,
	type EntitySyncRecordId,
} from './entity-sync';
import { DEFAULT_ENTITY_KEY } from './entities';
import { unlock } from './lock-unlock';
import { STORE_NAME } from './name';
import type { AnyFunction } from './types';
import {
	getRawValue,
	POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
} from './utils/crdt';
import { restoreSelection, getSelectionHistory } from './utils/crdt-selection';
import { saveCRDTDoc } from './utils/save-crdt-doc';

const {
	ConnectionErrorCode,
	createSyncManager,
	Delta,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
	retrySyncConnection,
} = unlock( syncPrivateApis );

export {
	ConnectionErrorCode,
	Delta,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
	retrySyncConnection,
};

/**
 * Key under which an autosave records the CRDT snapshot describing its
 * content. Used both as the REST autosave request parameter and as the key in
 * the local (sessionStorage) autosave backup.
 *
 * This string must match CRDT_SNAPSHOT_PARAM in
 * Gutenberg_REST_Autosaves_Controller on the PHP side.
 */
export const CRDT_AUTOSAVE_SNAPSHOT_KEY = 'crdt_snapshot';

let syncManager: SyncManager;

export function getSyncManager(): SyncManager | undefined {
	if ( syncManager ) {
		return syncManager;
	}

	if ( ! globalThis.window?.__experimentalEnableRealTimeCollaboration ) {
		return undefined;
	}

	syncManager = createSyncManager();

	return syncManager;
}

/**
 * Return whether a sync manager has already been created. Use this when you
 * only want to interact with an existing sync manager (e.g. to tear it down),
 * without `getSyncManager()` bootstrapping one if none exists.
 */
export function hasSyncManager(): boolean {
	return Boolean( syncManager );
}

/**
 * Encode a synced entity's current CRDT state as a snapshot. Returns undefined
 * when the entity is not being synced.
 *
 * @param {string}        kind     Entity kind.
 * @param {string}        name     Entity name.
 * @param {string|number} recordId Record ID.
 * @return {string|undefined} Base64-encoded snapshot.
 */
export function getEntitySnapshot(
	kind: string,
	name: string,
	recordId: string | number
): string | undefined {
	if ( ! hasSyncManager() ) {
		return undefined;
	}

	return getSyncManager()?.getEntitySnapshot(
		`${ kind }/${ name }`,
		`${ recordId }`
	);
}

/**
 * Determine whether a synced entity's CRDT document contains everything the
 * given snapshot describes. Returns false when the entity is not being synced
 * or the snapshot cannot be decoded, so callers fail open.
 *
 * @param {string}        kind            Entity kind.
 * @param {string}        name            Entity name.
 * @param {string|number} recordId        Record ID.
 * @param {string}        encodedSnapshot Base64-encoded snapshot.
 * @return {boolean} Whether the document contains the snapshotted state.
 */
export function entityContainsSnapshot(
	kind: string,
	name: string,
	recordId: string | number,
	encodedSnapshot: string
): boolean {
	if ( ! hasSyncManager() ) {
		return false;
	}

	return (
		getSyncManager()?.entityContainsSnapshot(
			`${ kind }/${ name }`,
			`${ recordId }`,
			encodedSnapshot
		) ?? false
	);
}

// Post meta is applied to the CRDT one subkey at a time, so compare the save
// response at the same granularity to avoid carrying stale sibling values.
function getServerMutatedMetaFields(
	updatedMeta: EntitySyncRecord | undefined,
	persistedMeta: EntitySyncRecord | undefined,
	syncedMeta: EntitySyncRecord | undefined
): EntitySyncRecord {
	const baseline = { ...persistedMeta, ...syncedMeta };

	return Object.fromEntries(
		Object.entries( updatedMeta ?? {} ).filter( ( [ key, value ] ) => {
			if ( key === POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ) {
				// The persisted CRDT snapshot may change on save and is
				// intentionally excluded from CRDT meta synchronization, so it
				// is not a server mutation.
				return false;
			}

			return ! fastDeepEqual( value, baseline[ key ] );
		} )
	);
}

/**
 * The fields of a save response that differ from what the client sent (or
 * held before the save): the changes the server made on its own, which the
 * shared document must learn about.
 *
 * @param updatedRecord   The save response.
 * @param persistedRecord The record before the save.
 * @param syncedChanges   The edits that were sent.
 * @return The server-mutated fields.
 */
export function getServerMutatedFields(
	updatedRecord: EntitySyncRecord,
	persistedRecord: EntitySyncRecord,
	syncedChanges: EntitySyncRecord
): EntitySyncRecord {
	return Object.fromEntries(
		Object.entries( updatedRecord ).flatMap( ( [ key, value ] ) => {
			if ( key === 'meta' ) {
				const serverMutatedMeta = getServerMutatedMetaFields(
					value as EntitySyncRecord | undefined,
					persistedRecord.meta as EntitySyncRecord | undefined,
					syncedChanges.meta as EntitySyncRecord | undefined
				);

				return Object.keys( serverMutatedMeta ).length
					? [ [ key, serverMutatedMeta ] ]
					: [];
			}

			const baseline =
				key in syncedChanges
					? syncedChanges[ key ]
					: persistedRecord[ key ];

			// The save response nests raw attributes as `{ raw, rendered }`
			// while the baseline holds raw strings; compare raw values so the
			// shape difference does not read as a server mutation.
			const wasServerMutated = ! fastDeepEqual(
				getRawValue( value ) ?? value,
				getRawValue( baseline ) ?? baseline
			);

			return wasServerMutated ? [ [ key, value ] ] : [];
		} )
	);
}

/**
 * How the adapter reaches the core-data store: the registry-bound
 * `select`/`dispatch`/`resolveSelect`. Defaults to the default registry.
 */
export interface CoreDataAccess {
	select: AnyFunction;
	dispatch: AnyFunction;
	resolveSelect: AnyFunction;
}

const defaultDataAccess: CoreDataAccess = { select, dispatch, resolveSelect };

// The `@wordpress/sync` manager templates ids into room names, so a record
// id passes through as core-data holds it (a number for posts).
function toObjectId( recordId: EntitySyncRecordId ): ObjectID {
	return recordId as ObjectID;
}

/**
 * The entity sync manager that adapts core-data's entity sync interface
 * (`entity-sync.ts`) to the `@wordpress/sync` manager, so the real-time
 * collaboration experiment keeps working exactly as before through the
 * interface. Registered at load time when the experiment is on.
 *
 * @param data How to reach the core-data store; defaults to the default
 *             registry.
 * @return The manager to register.
 */
export function createDefaultEntitySyncManager(
	data: CoreDataAccess = defaultDataAccess
): EntitySyncManager {
	const getSyncConfig = (
		kind: string,
		name: string
	): SyncConfig | undefined =>
		data.select( STORE_NAME ).getEntityConfig( kind, name )?.syncConfig;

	return {
		shouldSync( kind, name ) {
			return Boolean( getSyncManager() && getSyncConfig( kind, name ) );
		},

		load( kind, name, recordId, record, handlers ) {
			const syncConfig = getSyncConfig( kind, name );
			const manager = getSyncManager();

			if ( ! syncConfig || ! manager ) {
				return;
			}

			return manager.load(
				syncConfig,
				`${ kind }/${ name }`,
				toObjectId( recordId ),
				record,
				createRecordHandlers(
					data,
					kind,
					name,
					recordId,
					syncConfig,
					handlers
				)
			);
		},

		loadCollection( kind, name, handlers ) {
			const syncConfig = getSyncConfig( kind, name );
			const manager = getSyncManager();

			if ( ! syncConfig || ! manager ) {
				return;
			}

			return manager.loadCollection(
				syncConfig,
				`${ kind }/${ name }`,
				createCollectionHandlers( data, kind, name, handlers )
			);
		},

		update( kind, name, recordId, edits, options ) {
			if ( ! getSyncConfig( kind, name ) ) {
				return;
			}

			getSyncManager()?.update(
				`${ kind }/${ name }`,
				toObjectId( recordId ),
				edits,
				getEditOrigin( options ),
				{ isNewUndoLevel: isNewUndoLevel( options ) }
			);
		},

		beforeSave( kind, name, recordId, edits, context ) {
			if ( ! getSyncConfig( kind, name ) ) {
				return;
			}

			return beforeSave( kind, name, recordId, edits, context );
		},

		afterSave( kind, name, recordId, context ) {
			if ( ! getSyncConfig( kind, name ) ) {
				return;
			}

			const { savedRecord, persistedRecord, edits } = context;
			const syncChanges = persistedRecord
				? getServerMutatedFields( savedRecord, persistedRecord, edits )
				: savedRecord;

			// Use an untracked origin so that the save response does not
			// create undo levels.
			getSyncManager()?.update(
				`${ kind }/${ name }`,
				undefined === recordId ? null : toObjectId( recordId ),
				syncChanges,
				LOCAL_UNDO_IGNORED_ORIGIN,
				{ isSave: true }
			);
		},

		unload( kind, name, recordId ) {
			if ( ! getSyncConfig( kind, name ) ) {
				return;
			}

			getSyncManager()?.unload(
				`${ kind }/${ name }`,
				toObjectId( recordId )
			);
		},

		unloadAll() {
			if ( hasSyncManager() ) {
				getSyncManager()?.unloadAll();
			}
		},

		// A getter, so the value is read when core-data asks: the undo
		// manager only exists once a synced entity is loaded.
		get undoManager() {
			return getSyncManager()?.undoManager;
		},
	};
}

function getEditOrigin( options: EntitySyncEditOptions ): string {
	// Use an untracked origin for undoIgnore changes so the Yjs UndoManager
	// does not capture them as undo levels, while still syncing them to the
	// CRDT document and other peers.
	return options.undoIgnore ? LOCAL_UNDO_IGNORED_ORIGIN : LOCAL_EDITOR_ORIGIN;
}

function isNewUndoLevel( options: EntitySyncEditOptions ): boolean {
	// Transient changes (`isCached`) merge into the current undo level;
	// completed ones start a new level. `undoIgnore` never touches undo.
	return options.undoIgnore ? false : ! options.isCached;
}

async function beforeSave(
	kind: string,
	name: string,
	recordId: EntitySyncRecordId,
	edits: EntitySyncRecord,
	{ persistedRecord, isAutosave }: EntitySyncBeforeSaveContext
): Promise< EntitySyncRecord | void > {
	const manager = getSyncManager();

	if ( ! manager ) {
		return;
	}

	const objectType = `${ kind }/${ name }`;
	const objectId = toObjectId( recordId );

	// `saveEntityRecord` can be called directly, bypassing
	// `editEntityRecord`, so make sure its changes enter the CRDT first. An
	// autosave snapshots the document below, and a regular save creates the
	// persisted document from it, so both must see these changes.
	if ( persistedRecord ) {
		manager.update(
			objectType,
			objectId,
			edits,
			LOCAL_UNDO_IGNORED_ORIGIN
		);
	}

	if ( isAutosave ) {
		// Capture the CRDT snapshot in the same tick as the payload so it
		// describes exactly the content being autosaved.
		const snapshot = manager.getEntitySnapshot( objectType, objectId );

		return snapshot
			? { [ CRDT_AUTOSAVE_SNAPSHOT_KEY ]: snapshot }
			: undefined;
	}

	// Add meta for the persisted CRDT document during real post saves so the
	// saved post and CRDT snapshot are committed in the same request. We don't
	// want a post save to fail but a CRDT update to succeed or vice versa.
	// CRDT repair uses /wp-sync/v1/save to avoid post-save side effects.
	if ( 'postType' !== kind || ! persistedRecord ) {
		return;
	}

	const serializedDoc = await manager.createPersistedCRDTDoc(
		objectType,
		toObjectId( persistedRecord.id as EntitySyncRecordId )
	);

	if ( ! serializedDoc ) {
		return;
	}

	return {
		meta: {
			...( edits.meta as EntitySyncRecord | undefined ),
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: serializedDoc,
		},
	};
}

function createRecordHandlers(
	data: CoreDataAccess,
	kind: string,
	name: string,
	recordId: EntitySyncRecordId,
	syncConfig: SyncConfig,
	handlers: EntitySyncRecordHandlers
) {
	return {
		editRecord: handlers.editRecord,
		getEditedRecord: handlers.getEditedRecord,
		refetchRecord: handlers.refetchRecord,
		onUndoStackChange: handlers.onUndoStackChange,

		// Handle sync connection status changes.
		onStatusChange: ( status: ConnectionStatus | null ) => {
			unlock( data.dispatch( STORE_NAME ) ).setSyncConnectionStatus(
				kind,
				name,
				recordId,
				status
			);
		},

		// Persist the CRDT document.
		//
		// TODO: Currently, persisted CRDT documents are stored in post meta.
		// This effectively means that only post entities support CRDT
		// persistence. As we add support for syncing additional entity,
		// we'll need to revisit where persisted CRDT documents are stored.
		persistCRDTDoc: () => {
			if ( ! syncConfig.supportsPersistence ) {
				return;
			}

			return data
				.resolveSelect( STORE_NAME )
				.getEditedEntityRecord( kind, name, recordId )
				.then( async ( editedRecord: EntitySyncRecord ) => {
					// Don't persist the CRDT document if the record is still an
					// auto-draft or if the entity does not support meta.
					const { meta, status } = editedRecord;
					if ( 'auto-draft' === status || ! meta ) {
						return;
					}

					const entityConfig = data
						.select( STORE_NAME )
						.getEntityConfig( kind, name );
					const entityIdKey = entityConfig?.key || DEFAULT_ENTITY_KEY;
					const entityId = editedRecord[
						entityIdKey
					] as EntitySyncRecordId;

					await saveCRDTDoc(
						`${ kind }/${ name }`,
						toObjectId( entityId )
					);
				} );
		},

		addUndoMeta: ( ydoc: Y.Doc, meta: Map< string, any > ) => {
			const selectionHistory = getSelectionHistory( ydoc );

			if ( selectionHistory ) {
				meta.set( 'selectionHistory', selectionHistory );
			}
		},

		restoreUndoMeta: ( ydoc: Y.Doc, meta: Map< string, any > ) => {
			const selectionHistory = meta.get( 'selectionHistory' );

			if ( selectionHistory ) {
				// Because Yjs initiates an undo, we need to wait until the
				// content is restored before we can update the selection.
				// Use setTimeout() to wait until content is finished
				// updating, and then set the correct selection.
				setTimeout( () => {
					restoreSelection( selectionHistory, ydoc );
				}, 0 );
			}
		},
	};
}

function createCollectionHandlers(
	data: CoreDataAccess,
	kind: string,
	name: string,
	handlers: EntitySyncCollectionHandlers
) {
	return {
		refetchRecords: handlers.refetchRecords,
		onStatusChange: ( status: ConnectionStatus | null ) => {
			unlock( data.dispatch( STORE_NAME ) ).setSyncConnectionStatus(
				kind,
				name,
				null,
				status
			);
		},
	};
}

// The experiment flag is printed before this script loads, so the default
// manager can register as soon as the module evaluates. Without the flag,
// nothing is registered and core-data leaves entities alone.
if ( globalThis.window?.__experimentalEnableRealTimeCollaboration ) {
	registerEntitySyncManager( createDefaultEntitySyncManager() );
}
