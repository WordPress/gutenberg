/**
 * External dependencies
 */
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import {
	CRDT_RECORD_MAP_KEY as RECORD_KEY,
	CRDT_STATE_MAP_KEY as STATE_KEY,
	CRDT_STATE_PERSISTED_AT_KEY as PERSISTED_AT_KEY,
	CRDT_STATE_RESTORED_AT_KEY as RESTORED_AT_KEY,
	CRDT_STATE_RESTORED_BY_KEY as RESTORED_BY_KEY,
	LOCAL_SYNC_PROVIDER_ORIGIN,
} from './config';
import type {
	ConnectDoc,
	ConnectDocResult,
	CRDTDoc,
	EntityID,
	ObjectID,
	ObjectData,
	ObjectType,
	SyncConfig,
	RecordHandlers,
} from './types';
import { createYjsDoc } from './utils';

interface EntityState {
	awareness?: Awareness;
	discard: () => void;
	handlers: RecordHandlers;
	objectId: ObjectID;
	syncConfig: SyncConfig;
	ydoc: CRDTDoc;
}

/**
 * SyncProvider manages the lifecycle of syncing entity records. It establishes
 * connections, creates the awareness instance, and coordinates with the local
 * store.
 */
export class SyncProvider {
	private connectionCreators: ConnectDoc[];

	protected entityStates: Map< EntityID, EntityState > = new Map();

	/**
	 * Constructor.
	 *
	 * @param {ConnectDoc[]} connectionCreators Functions that create Yjs connection providers.
	 */
	public constructor( connectionCreators: ConnectDoc[] = [] ) {
		this.connectionCreators = connectionCreators;
	}

	/**
	 * Bootstrap an entity for syncing and manage its lifecycle.
	 *
	 * @param {SyncConfig}     syncConfig Sync configuration for the object type.
	 * @param {ObjectData}     rawRecord  Raw entity record representing this object type.
	 * @param {RecordHandlers} handlers   Handlers for updating and fetching the record.
	 */
	public async bootstrap(
		syncConfig: SyncConfig,
		rawRecord: ObjectData,
		handlers: RecordHandlers
	): Promise< void > {
		if ( 0 === this.connectionCreators.length ) {
			return; // No connection creators, so syncing is disabled.
		}

		const objectId = syncConfig.getObjectId( rawRecord );
		const objectType = syncConfig.objectType;
		const entityId = this.getEntityId( objectType, objectId );

		if ( this.entityStates.has( entityId ) ) {
			return; // Already bootstrapped.
		}

		const now = Date.now();
		const ydoc = createYjsDoc( { objectType } );
		const recordMap = ydoc.getMap( RECORD_KEY );
		const stateMap = ydoc.getMap( STATE_KEY );

		// Clean up connections and in-memory state when the entity is discarded.
		const onDiscard = (): void => {
			connections.forEach( ( result ) => result.destroy() );
			recordMap.unobserveDeep( onRecordUpdate );
			stateMap.unobserve( onStateUpdate );
			ydoc.destroy();
			this.entityStates.delete( entityId );
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

			void this.updateEntityRecord( objectType, objectId );
		};

		const onStateUpdate = (
			event: Y.YMapEvent< unknown >,
			transaction: Y.Transaction
		) => {
			if ( transaction.local ) {
				return;
			}

			if ( ! event.keysChanged.has( PERSISTED_AT_KEY ) ) {
				return;
			}

			const newValue = stateMap.get( PERSISTED_AT_KEY );
			if ( 'number' === typeof newValue && newValue > now ) {
				handlers.refetchPersistedRecord();
			}
		};

		const entityState: EntityState = {
			discard: onDiscard,
			handlers,
			objectId,
			syncConfig,
			ydoc,
		};

		if ( syncConfig.supports?.awareness ) {
			entityState.awareness = new Awareness( ydoc );
		}

		this.entityStates.set( entityId, entityState );

		const connections = await this.connect( entityState );

		// Attach observers.
		recordMap.observeDeep( onRecordUpdate );
		stateMap.observe( onStateUpdate );

		// Get the initial document state.
		const initialDoc = null; // TODO
		const initialDocIsInvalid = false;

		// Apply the initial document to the current document as a singular update.
		if ( initialDoc ) {
			ydoc.transact( () => {
				Y.applyUpdate( ydoc, Y.encodeStateAsUpdate( initialDoc ) );
			}, LOCAL_SYNC_PROVIDER_ORIGIN );
		}

		// Otherwise, apply changes from the current entity record to the document.
		if ( ! initialDoc || initialDocIsInvalid ) {
			ydoc.transact( () => {
				syncConfig.applyChangesToCRDTDoc(
					ydoc,
					syncConfig.getInitialObjectData( rawRecord ),
					rawRecord,
					LOCAL_SYNC_PROVIDER_ORIGIN
				);

				// Only mark as restored if we loaded an initial document.
				if ( initialDoc ) {
					stateMap.set( RESTORED_AT_KEY, Date.now() );
					stateMap.set( RESTORED_BY_KEY, ydoc.clientID );
				}
			}, LOCAL_SYNC_PROVIDER_ORIGIN );

			// If the entity supports CRDT persistence and the initial document was
			// invalidated, save the record to persist the updated document. This
			// prevents a newly joining peer (or refreshing user) from re-initializing
			// the CRDT document (the "initialization problem").
			if ( initialDocIsInvalid && syncConfig.supports?.crdtPersistence ) {
				// TODO: Not every entity has an ID. We need a better way to mark the
				// edited record as dirty.
				handlers.editRecord( { id: rawRecord.id } );
				handlers.saveRecord();
			}
		}
	}

	/**
	 * Establish connections for the given entity and its Yjs document.
	 *
	 * @param {EntityState} entityState State for the entity.
	 */
	private async connect(
		entityState: EntityState
	): Promise< ConnectDocResult[] > {
		return await Promise.all(
			this.connectionCreators?.map( ( create ) =>
				create(
					entityState.objectId,
					entityState.syncConfig.objectType,
					entityState.ydoc,
					entityState.awareness
				)
			)
		);
	}

	/**
	 * Stop syncing an entity and destroy its in-memory state.
	 *
	 * @param {ObjectType} objectType Object type to discard.
	 * @param {ObjectID}   objectId   Object ID to discard.
	 */
	public discard( objectType: ObjectType, objectId: ObjectID ): void {
		this.entityStates
			.get( this.getEntityId( objectType, objectId ) )
			?.discard();
	}

	/**
	 * Get the entity ID for the given object type and object ID.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 */
	protected getEntityId(
		objectType: ObjectType,
		objectId: ObjectID
	): EntityID {
		return `${ objectType }_${ objectId }`;
	}

	/**
	 * Update CRDT document with changes from the local store.
	 *
	 * @param {SyncConfig}            syncConfig Sync configuration for the object type.
	 * @param {ObjectData}            rawRecord  Raw record to load.
	 * @param {Partial< ObjectData >} changes    Updates to make.
	 * @param {string}                origin     The source of change.
	 */
	public updateCRDTDoc(
		syncConfig: SyncConfig,
		rawRecord: ObjectData,
		changes: Partial< ObjectData >,
		origin: string
	): void {
		const objectType = syncConfig.objectType;
		const objectId = syncConfig.getObjectId( rawRecord );
		const entityId = this.getEntityId( objectType, objectId );
		const ydoc = this.entityStates.get( entityId )?.ydoc;

		ydoc?.transact( () => {
			syncConfig.applyChangesToCRDTDoc(
				ydoc,
				changes,
				rawRecord,
				origin
			);
		}, origin );
	}

	/**
	 * Update the entity record in the local store with changes from the CRDT
	 * document.
	 *
	 * @param {ObjectType} objectType Object type of record to update.
	 * @param {ObjectID}   objectId   Object ID of record to update.
	 */
	private async updateEntityRecord(
		objectType: ObjectType,
		objectId: ObjectID
	): Promise< void > {
		const entityId = this.getEntityId( objectType, objectId );
		const entityState = this.entityStates.get( entityId );

		if ( ! entityState ) {
			return;
		}

		const { handlers, syncConfig, ydoc } = entityState;

		const currentRecord = await handlers.getEditedRecord();

		// Determine which synced properties have actually changed by comparing
		// them against the current entity record.
		const changes = syncConfig.getChangesFromCRDTDoc( ydoc, currentRecord );

		// This is a good spot to debug to see which changes are being synced. Note
		// that `blocks` will always appear in the changes, but will only result
		// in an update to the store if the blocks have changed.

		handlers.editRecord( changes );
	}
}
