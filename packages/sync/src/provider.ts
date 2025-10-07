/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import {
	CRDT_RECORD_MAP_KEY as RECORD_KEY,
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
	discard: () => void;
	handlers: RecordHandlers;
	objectId: ObjectID;
	objectType: ObjectType;
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
	 * @param {ObjectType}     objectType Object type.
	 * @param {ObjectID}       objectId   Object ID.
	 * @param {ObjectData}     record     Entity record representing this object type.
	 * @param {RecordHandlers} handlers   Handlers for updating and fetching the record.
	 */
	public async bootstrap(
		syncConfig: SyncConfig,
		objectType: ObjectType,
		objectId: ObjectID,
		record: ObjectData,
		handlers: RecordHandlers
	): Promise< void > {
		if ( 0 === this.connectionCreators.length ) {
			return; // No connection creators, so syncing is disabled.
		}

		const entityId = this.getEntityId( objectType, objectId );

		if ( this.entityStates.has( entityId ) ) {
			return; // Already bootstrapped.
		}

		const ydoc = createYjsDoc( { objectType } );
		const recordMap = ydoc.getMap( RECORD_KEY );

		// Clean up connections and in-memory state when the entity is discarded.
		const onDiscard = (): void => {
			connections.forEach( ( result ) => result.destroy() );
			recordMap.unobserveDeep( onRecordUpdate );
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

		const entityState: EntityState = {
			discard: onDiscard,
			handlers,
			objectId,
			objectType,
			syncConfig,
			ydoc,
		};

		this.entityStates.set( entityId, entityState );

		const connections = await this.connect( entityState );

		// Attach observers.
		recordMap.observeDeep( onRecordUpdate );

		ydoc.transact( () => {
			syncConfig.applyChangesToCRDTDoc( ydoc, record );
		}, LOCAL_SYNC_PROVIDER_ORIGIN );
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
					entityState.objectType,
					entityState.ydoc
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
	 * @param {ObjectType}            objectType Object type.
	 * @param {ObjectID}              objectId   Object ID.
	 * @param {Partial< ObjectData >} changes    Updates to make.
	 * @param {string}                origin     The source of change.
	 */
	public updateCRDTDoc(
		syncConfig: SyncConfig,
		objectType: ObjectType,
		objectId: ObjectID,
		changes: Partial< ObjectData >,
		origin: string
	): void {
		const entityId = this.getEntityId( objectType, objectId );
		const ydoc = this.entityStates.get( entityId )?.ydoc;

		ydoc?.transact( () => {
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

		// Determine which synced properties have actually changed by comparing
		// them against the current entity record.
		const changes = syncConfig.getChangesFromCRDTDoc( ydoc );

		// This is a good spot to debug to see which changes are being synced. Note
		// that `blocks` will always appear in the changes, but will only result
		// in an update to the store if the blocks have changed.

		handlers.editRecord( changes );
	}
}
