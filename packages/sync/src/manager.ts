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
import { getProviderCreators } from './providers';
import type {
	CRDTDoc,
	EntityID,
	ObjectID,
	ObjectData,
	ObjectType,
	ProviderCreator,
	RecordHandlers,
	SyncConfig,
	SyncManager,
} from './types';
import { createYjsDoc } from './utils';

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
		const providerCreators: ProviderCreator[] = getProviderCreators();

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

		const entityState: EntityState = {
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
			providerCreators.map( ( create ) =>
				create( objectType, objectId, ydoc )
			)
		);

		// Attach observers.
		recordMap.observeDeep( onRecordUpdate );

		ydoc.transact( () => {
			syncConfig.applyChangesToCRDTDoc( ydoc, record );
		}, LOCAL_SYNC_MANAGER_ORIGIN );
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

		// This is a good spot to debug to see which changes are being synced. Note
		// that `blocks` will always appear in the changes, but will only result
		// in an update to the store if the blocks have changed.

		handlers.editRecord( changes );
	}

	return {
		load: loadEntity,
		unload: unloadEntity,
		update: updateCRDTDoc,
	};
}
