/**
 * External dependencies
 */
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import {
	CRDT_DOC_VERSION,
	CRDT_RECORD_MAP_KEY as RECORD_KEY,
	CRDT_STATE_MAP_KEY as STATE_KEY,
	CRDT_STATE_PERSISTED_AT_KEY as PERSISTED_AT_KEY,
	CRDT_STATE_PERSISTED_BY_KEY as PERSISTED_BY_KEY,
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
import { UndoManager } from './undo-manager';
import { createYjsDoc } from './utils';

interface EntityState {
	awareness?: Awareness;
	discard: () => void;
	handlers: RecordHandlers;
	objectId: ObjectID;
	syncConfig: SyncConfig;
	ydoc: CRDTDoc;
}

export class SyncProvider {
	private connectionCreators: ConnectDoc[];
	private undoManager: UndoManager;

	protected entityStates: Map< EntityID, EntityState > = new Map();

	/**
	 * Constructor.
	 *
	 * @param {ConnectDoc[]} connectionCreators Functions that create Yjs connection providers.
	 */
	public constructor( connectionCreators: ConnectDoc[] = [] ) {
		this.connectionCreators = connectionCreators;
		this.undoManager = UndoManager.create();
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
		const now = Date.now();
		const objectId = syncConfig.getObjectId( rawRecord );
		const objectType = syncConfig.objectType;
		const ydoc = createYjsDoc( { objectType } );
		const entityId = this.getEntityId( objectType, objectId );

		const recordMap = ydoc.getMap( RECORD_KEY );
		const stateMap = ydoc.getMap( STATE_KEY );

		// Clean up connections and in-memory state when the entity is discarded.
		const onDiscard = (): void => {
			connections.forEach( ( result ) => result.destroy() );
			recordMap.unobserveDeep( onRecordUpdate );
			stateMap.unobserve( onStateUpdate );

			if ( syncConfig.supports?.undo ) {
				this.undoManager.untrackDoc( ydoc );
			}

			ydoc.destroy();
			this.entityStates.delete( entityId );
		};

		// When the CRDT document is updated by the UndoManager or a connection (not
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

		if ( syncConfig.supports?.undo ) {
			this.undoManager.trackDoc( ydoc );
			this.undoManager.addToScope( recordMap );
		}

		this.entityStates.set( entityId, entityState );

		const connections = await this.connect( entityState );

		// Attach observers.
		recordMap.observeDeep( onRecordUpdate );
		stateMap.observe( onStateUpdate );

		// Get the initial document state.
		const initialDoc = await this.getInitialCRDTDoc(
			syncConfig,
			rawRecord
		);

		// Apply the initial document to the current document as a singular update.
		if ( initialDoc ) {
			ydoc.transact( () => {
				Y.applyUpdate( ydoc, Y.encodeStateAsUpdate( initialDoc ) );
			}, LOCAL_SYNC_PROVIDER_ORIGIN );
		}

		if ( ! initialDoc || true === initialDoc?.meta?.get( 'invalidated' ) ) {
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

			// TODO: This new state should be persisted to the entity record. This
			// will result in a "dirty" record, but if the user does not save the
			// record, then content can be duplicated as other users join the session
			// or refresh.
			//
			// If we have high confidence in our hash validation / invalidation, then
			// we could persist the updated record automatically. Or we could use
			// awareness states to let the user know that the content has changed on
			// the server and prompt them to save.
			handlers.editRecord( {
				meta: {
					...( rawRecord.meta as object ),
					...( await this.createEntityMeta( syncConfig, rawRecord ) ),
				},
			} );
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
	 * Get the CRDTDoc that represents the initial state of the object data. Custom
	 * sync providers can override this method to provide a custom initial state.
	 *
	 * @param {SyncConfig} syncConfig Sync configuration for the object type.
	 * @param {ObjectData} rawRecord  Initial data to apply to the document.
	 */
	private async getInitialCRDTDoc(
		syncConfig: SyncConfig,
		rawRecord: ObjectData
	): Promise< CRDTDoc | null > {
		// Load the persisted document from previous sessions.
		const persistedDoc = await this.getPersistedCRDTDoc(
			syncConfig,
			rawRecord
		);

		// If it exists and matches the current version, apply it as the base state
		// of the initial document.
		if ( ! persistedDoc ) {
			return null;
		}

		const stateMap = persistedDoc.getMap( STATE_KEY );

		if ( CRDT_DOC_VERSION !== stateMap.get( 'version' ) ) {
			// TODO: Implement version migration. We have not yet incremented the
			// version number, so there is nothing to implement yet.
			persistedDoc.meta?.set( 'invalidated', true );
		}

		return persistedDoc;
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */

	/**
	 * Create meta for the entity, e.g., to persist the CRDT doc against the
	 * entity. Custom sync providers can override this method to provide their
	 * implementation.
	 *
	 * @param {SyncConfig} _syncConfig Sync configuration for the object type.
	 * @param {ObjectData} _rawRecord  Raw record representing this object type.
	 * @return {Promise< Record< string, any > >} Entity meta.
	 */
	public async createEntityMeta(
		_syncConfig: SyncConfig,
		_rawRecord: ObjectData
	): Promise< Record< string, any > > {
		return Promise.resolve( {} );
	}

	/**
	 * Get the persisted CRDT document from the object data, e.g., from meta.
	 * Custom sync providers can override this method to provide their
	 * implementation.
	 *
	 * There are 5 possible states:
	 *
	 * 1. No persisted document exists: return null. A new document will be created
	 *    from the current entity record.
	 *
	 * 2. A persisted document exists with a different version: return it. The
	 *    version mismatch will be detected and the document will be migrated.
	 *
	 * 3. A persisted document exists, but its content no longer matches the
	 *    current entity record (i.e., the entity record was updated outside of
	 *    the block editor): return it, but mark it as invalidated. The document
	 *    will be used as the base document and the current entity record will be
	 *    applied as an update.
	 *
	 *    - Mark it as invalidated by setting `invalidated=true` on its meta map.
	 *
	 * 4. A persisted document exists, but the entity record has been restored
	 *    from a revision. This is a special case of #3, but is handled
	 *    identically.
	 *
	 * 5. A persisted document exists: return it. It will be used as the initial
	 *    document.
	 *
	 * @param {SyncConfig} _syncConfig Sync configuration for the object type.
	 * @param {ObjectData} _rawRecord  Record representing this object type.
	 * @return {Promise< CRDTDoc | null >} The persisted CRDT document, or null if none exists.
	 */
	protected async getPersistedCRDTDoc(
		_syncConfig: SyncConfig,
		_rawRecord: ObjectData
	): Promise< CRDTDoc | null > {
		return Promise.resolve( null );
	}

	/* eslint-enable @typescript-eslint/no-unused-vars */

	/**
	 * Get the undo manager.
	 *
	 * @return {UndoManager | null} The undo manager, or null if unsupported.
	 */
	public getUndoManager(): UndoManager | null {
		return this.undoManager ?? null;
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

	/**
	 * Update the last persisted timestamp in the CRDT document state map. This is
	 * used by peers as a signal that they need to refetch the persisted entity.
	 *
	 * @param {SyncConfig} syncConfig Sync configuration for the object type.
	 * @param {ObjectData} rawRecord  Raw record representing this object type.
	 */
	public updateLastPersistedDate(
		syncConfig: SyncConfig,
		rawRecord: ObjectData
	): void {
		const objectId = syncConfig.getObjectId( rawRecord );
		const objectType = syncConfig.objectType;
		const entityId = this.getEntityId( objectType, objectId );
		const entityState = this.entityStates.get( entityId );

		if ( ! entityState ) {
			return;
		}

		const ydoc = entityState.ydoc;

		ydoc.transact( () => {
			const stateMap = ydoc.getMap( STATE_KEY );
			stateMap.set( PERSISTED_AT_KEY, Date.now() );
			stateMap.set( PERSISTED_BY_KEY, ydoc.clientID );
		}, LOCAL_SYNC_PROVIDER_ORIGIN );
	}
}
