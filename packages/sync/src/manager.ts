/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import {
	CRDT_RECORD_MAP_KEY as RECORD_KEY,
	LOCAL_SYNC_MANAGER_ORIGIN,
} from './config';
import { createPersistedCRDTDoc, getPersistedCrdtDoc } from './persistence';
import { getProviderCreators } from './providers';
import type {
	CRDTDoc,
	EntityID,
	ObjectID,
	ObjectData,
	ObjectType,
	RecordHandlers,
	SyncConfig,
	SyncManager,
	SyncUndoManager,
} from './types';
import { createUndoManager } from './undo-manager';
import { createYjsDoc } from './utils';
import { createAwareness } from './awareness/awareness-manager';

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

		// Clean up providers and in-memory state when the entity is unloaded.
		const unload = (): void => {
			providerResults.forEach( ( result ) => result.destroy() );
			recordMap.unobserveDeep( onRecordUpdate );
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

		// Lazily create the undo manager when the first entity is loaded.
		if ( ! undoManager ) {
			undoManager = createUndoManager();
		}
		undoManager.addToScope( recordMap );

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

		// Get and apply the persisted CRDT document, if it exists.
		const isInvalid = applyPersistedCrdtDoc( syncConfig, ydoc, record );

		// If there is no persisted document or if it has been invalidated by out-of-
		// band updates, apply changes from the current entity record to the CRDT
		// document. This ensures that the CRDT document reflects the latest state of
		// the entity record.
		if ( isInvalid ) {
			ydoc.transact( () => {
				syncConfig.applyChangesToCRDTDoc( ydoc, record );
			}, LOCAL_SYNC_MANAGER_ORIGIN );

			const meta = createEntityMeta( objectType, objectId );
			handlers.editRecord( { meta } );
			handlers.saveRecord();
		}
	}

	/**
	 * Unload an entity, stop syncing, and destroy its in-memory state.
	 *
	 * @param {ObjectType} objectType Object type to discard.
	 * @param {ObjectID}   objectId   Object ID to discard.
	 */
	function unloadEntity( objectType: ObjectType, objectId: ObjectID ): void {
		entityStates.get( getEntityId( objectType, objectId ) )?.unload();
	}

	/**
	 * Get the entity ID for the given object type and object ID.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 */
	function getEntityId(
		objectType: ObjectType,
		objectId: ObjectID
	): EntityID {
		return `${ objectType }_${ objectId }`;
	}

	/**
	 * Apply a persisted CRDT document to the current document, if it exists.
	 * Return true if the document exists and is valid, otherwise false. Returning
	 * a boolean allows us to destroy the temporary document and prevent it from
	 * leaking out.
	 *
	 * @param {SyncConfig} syncConfig Sync configuration for the object type.
	 * @param {CRDTDoc}    targetDoc  Target CRDT doc.
	 * @param {ObjectData} record     Entity record representing this object type.
	 * @return {boolean} Whether the persisted document is non-existent or invalid.
	 */
	function applyPersistedCrdtDoc(
		syncConfig: SyncConfig,
		targetDoc: CRDTDoc,
		record: ObjectData
	): boolean {
		if ( ! syncConfig.supports?.crdtPersistence ) {
			return true;
		}

		// Get the persisted CRDT document, if it exists.
		const tempDoc = getPersistedCrdtDoc( record );

		if ( ! tempDoc ) {
			return true;
		}

		// Apply the persisted document to the current document as a singular update.
		// This is done even if the persisted document has been invalidated. This
		// prevents a newly joining peer (or refreshing user) from re-initializing
		// the CRDT document (the "initialization problem").
		const update = Y.encodeStateAsUpdateV2( tempDoc );
		targetDoc.transact( () => {
			Y.applyUpdateV2( targetDoc, update );
		}, LOCAL_SYNC_MANAGER_ORIGIN );

		// Check if the persisted doc has been invalidated by out-of-band updates
		// (e.g., a WP CLI command or direct database update) by determining if the
		// persisted document introduces any changes that are not present in the
		// current record. If it has been invalidated, then we return true as a
		// signal that we need to apply the entity record to the target document.
		const changes = syncConfig.getChangesFromCRDTDoc( tempDoc, record );

		// Destroy the temporary document to prevent leaks.
		tempDoc.destroy();

		return Object.keys( changes ).length > 0;
	}

	/**
	 * Update CRDT document with changes from the local store.
	 *
	 * @param {ObjectType}            objectType Object type.
	 * @param {ObjectID}              objectId   Object ID.
	 * @param {Partial< ObjectData >} changes    Updates to make.
	 * @param {string}                origin     The source of change.
	 */
	function updateCRDTDoc(
		objectType: ObjectType,
		objectId: ObjectID,
		changes: Partial< ObjectData >,
		origin: string
	): void {
		const entityId = getEntityId( objectType, objectId );
		const entityState = entityStates.get( entityId );

		if ( ! entityState ) {
			return;
		}

		const { syncConfig, ydoc } = entityState;

		ydoc.transact( () => {
			syncConfig.applyChangesToCRDTDoc( ydoc, changes );
		}, origin );
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
		// Use getter to ensure we always return the current value of `undoManager`.
		get undoManager(): SyncUndoManager | undefined {
			return undoManager;
		},
		unload: unloadEntity,
		update: updateCRDTDoc,
	};
}
