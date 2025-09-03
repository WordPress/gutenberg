/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import { CRDT_DOC_VERSION } from './config';
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
	destroy: () => void;
	lastPersistedAt: number;
	ydoc: CRDTDoc;
}

const CRDT_STATE_MAP_KEY = 'state';
const CRDT_STATE_PERSISTED_AT_KEY = 'persistedAt';

export class SyncProvider {
	private connectLocal: ConnectDoc | null;
	private connectRemote: ConnectDoc | null;

	/**
	 * CAUTION: We currently store a single UndoManager instance under these
	 * assumptions:
	 *
	 * 1. Only entities loaded by the block editor support an undo manager.
	 * 2. Only one such entity is loaded at a time.
	 * 3. The entity's SyncConfig has `supportsUndo` set to true.
	 *
	 * If these assumptions fail, we will need to refactor the selectors provided
	 * by `@wordpress/core-data` (e.g., `getUndoManager`) to support multiple
	 * UndoManager instances by requiring the entity type and ID as parameters.
	 */
	private undoManager: UndoManager | null = null;

	protected configs: Map< ObjectType, SyncConfig > = new Map();
	protected connections: Map< EntityID, ConnectDocResult[] > = new Map();
	protected entityStates: Map< EntityID, EntityState > = new Map();

	/**
	 * Constructor.
	 *
	 * @param {ConnectDoc | null} connectLocal  Connect the document to a local database.
	 * @param {ConnectDoc | null} connectRemote Connect the document to a remote sync connection.
	 */
	public constructor(
		connectLocal: ConnectDoc | null,
		connectRemote: ConnectDoc | null
	) {
		this.connectLocal = connectLocal;
		this.connectRemote = connectRemote;
	}

	/**
	 * Connect to a document.
	 *
	 * @param {ObjectID}   objectId   Object ID to connect.
	 * @param {ObjectType} objectType Object type to connect.
	 * @param {CRDTDoc}    ydoc       Yjs document for the object.
	 */
	private async connect(
		objectId: ObjectID,
		objectType: ObjectType,
		ydoc: CRDTDoc
	): Promise< ConnectDocResult[] > {
		return (
			await Promise.all( [
				this.connectLocal?.( objectId, objectType, ydoc ),
				this.connectRemote?.( objectId, objectType, ydoc ),
			] )
		).filter( ( result ): result is ConnectDocResult => Boolean( result ) );
	}

	/**
	 * Bootstrap an entity for syncing and manage its lifecycle.
	 *
	 * @param {SyncConfig}     syncConfig Sync configuration for the object type.
	 * @param {ObjectData}     record     Record representing this object type.
	 * @param {RecordHandlers} handlers   Handlers for updating and fetching the record.
	 */
	public async bootstrap(
		syncConfig: SyncConfig,
		record: ObjectData,
		handlers: RecordHandlers
	): Promise< void > {
		const objectId = syncConfig.getObjectId( record );
		const objectType = syncConfig.objectType;
		const ydoc = createYjsDoc( objectType );
		const connections = await this.connect( objectId, objectType, ydoc );
		const entityId = this.getEntityId( objectType, objectId );

		const onDestroy = (): void => {
			connections.forEach( ( result ) => result.destroy() );
			ydoc.off( 'update', onUpdate );
			ydoc.destroy();
			this.entityStates.delete( entityId );
		};

		const onUpdate = ( _update: Uint8Array, origin: string ): void => {
			if ( origin !== 'gutenberg' ) {
				void this.updateEntityRecord( syncConfig, handlers );
			}
		};

		if ( syncConfig.supportsUndo ) {
			this.undoManager = new UndoManager( ydoc );
		}

		this.configs.set( objectType, syncConfig );
		this.connections.set( entityId, connections );
		this.setEntityState( objectType, objectId, {
			destroy: onDestroy,
			lastPersistedAt: Date.now(),
			ydoc,
		} );

		// Get the initial document state.
		const initialDoc = await this.getInitialCRDTDoc( syncConfig, record );

		ydoc.on( 'update', onUpdate );

		// Apply the initial document to the current document as a singular update.
		Y.transact(
			ydoc,
			() => {
				Y.applyUpdate( ydoc, Y.encodeStateAsUpdate( initialDoc ) );
			},
			'syncProvider.bootstrap',
			false
		);
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
	 * Get the entity state for the given object type and object ID.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 */
	protected getEntityState(
		objectType: ObjectType,
		objectId: ObjectID
	): EntityState | null {
		return (
			this.entityStates.get( this.getEntityId( objectType, objectId ) ) ??
			null
		);
	}

	/**
	 * Set the entity state for the given object type and object ID.
	 *
	 * @param {ObjectType}             objectType Object type.
	 * @param {ObjectID}               objectId   Object ID.
	 * @param {Partial< EntityState >} state      Partial entity state to set.
	 */
	private setEntityState(
		objectType: ObjectType,
		objectId: ObjectID,
		state: EntityState
	): void {
		const entityId = this.getEntityId( objectType, objectId );
		this.entityStates.set( entityId, state );
	}

	/**
	 * Get the CRDTDoc that represents the initial state of the object data. Custom
	 * sync providers can override this method to provide a custom initial state.
	 *
	 * @param {SyncConfig} syncConfig Sync configuration for the object type.
	 * @param {ObjectData} record     Initial data to apply to the document.
	 */
	private async getInitialCRDTDoc(
		syncConfig: SyncConfig,
		record: ObjectData
	): Promise< CRDTDoc > {
		// Load the persisted document from previous sessions.
		const persistedDoc = await this.getPersistedCRDTDoc(
			syncConfig,
			record,
			CRDT_DOC_VERSION
		);

		// If it exists and matches the current version, apply it as the base state
		// of the initial document.
		if (
			persistedDoc &&
			CRDT_DOC_VERSION === persistedDoc.meta?.get( 'version' )
		) {
			return persistedDoc;
		}

		// Otherwise, use the current record.
		const initialData = syncConfig.getInitialObjectData( record );

		// IMPORTANT: We use a new Yjs document so that the initial state can be
		// applied to the "real" Yjs document as a singular update. Therefore, we
		// don't need to wrap the changes in a transaction.
		const initialStateDoc = createYjsDoc( syncConfig.objectType );

		syncConfig.applyChangesToCRDTDoc(
			initialStateDoc,
			initialData,
			record,
			'syncProvider.getInitialCRDTDoc'
		);

		return initialStateDoc;
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */

	/**
	 * Create meta for the entity, e.g., to persist the CRDT doc against the
	 * entity. Custom sync providers can override this method to provide their
	 * implementation.
	 *
	 * @param {SyncConfig}            _syncConfig Sync configuration for the object type.
	 * @param {ObjectData}            _record     Record representing this object type.
	 * @param {Partial< ObjectData >} _changes    Updates to make.
	 * @return {Promise< Record< string, any > >} Entity meta.
	 */
	public async createEntityMeta(
		_syncConfig: SyncConfig,
		_record: ObjectData,
		_changes: Partial< ObjectData >
	): Promise< Record< string, any > > {
		return Promise.resolve( {} );
	}

	/**
	 * Get the persisted CRDT document from the object data, e.g., from meta.
	 * Custom sync providers can override this method to provide their
	 * implementation.
	 *
	 * @param {SyncConfig} _syncConfig      Sync configuration for the object type.
	 * @param {ObjectData} _record          Record representing this object type.
	 * @param {number}     _expectedVersion Expected version of persisted CRDT document.
	 * @return {Promise< CRDTDoc | null >} The persisted CRDT document, or null if none exists.
	 */
	protected async getPersistedCRDTDoc(
		_syncConfig: SyncConfig,
		_record: ObjectData,
		_expectedVersion: number
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
		return this.undoManager;
	}

	public markEntityAsPersisted(
		syncConfig: SyncConfig,
		record: ObjectData
	): void {
		const objectId = syncConfig.getObjectId( record );
		const objectType = syncConfig.objectType;
		const ydoc = this.getEntityState( objectType, objectId )?.ydoc;

		ydoc?.getMap( 'state' ).set( CRDT_STATE_PERSISTED_AT_KEY, Date.now() );
	}

	/**
	 * Update CRDT document with changes from the local store.
	 *
	 * @param {ObjectType}            objectType Object type to load.
	 * @param {ObjectData}            record     Record to load.
	 * @param {Partial< ObjectData >} changes    Updates to make.
	 * @param {string}                origin     The source of change.
	 */
	public updateCRDTDoc(
		objectType: ObjectType,
		record: ObjectData,
		changes: Partial< ObjectData >,
		origin: string
	): void {
		const syncConfig = this.configs.get( objectType );
		const objectId = syncConfig?.getObjectId( record );

		if ( ! syncConfig || ! objectId ) {
			return;
		}

		const ydoc = this.getEntityState( objectType, objectId )?.ydoc;

		ydoc?.transact( () => {
			syncConfig.applyChangesToCRDTDoc( ydoc, changes, record, origin );
		}, origin );
	}

	private async updateEntityRecord(
		syncConfig: SyncConfig,
		handlers: RecordHandlers
	): Promise< void > {
		const currentRecord = await handlers.getEditedRecord();

		const objectId = syncConfig.getObjectId( currentRecord );
		const objectType = syncConfig.objectType;

		const entityState = this.getEntityState( objectType, objectId );

		if ( ! entityState ) {
			return;
		}

		const { lastPersistedAt, ydoc } = entityState;

		// Determine which synced properties have actually changed by comparing
		// them against the current entity record.
		const changes = syncConfig.getChangesFromCRDTDoc( ydoc, currentRecord );

		// This is a good spot to debug to see which changes are being synced. Note
		// that `blocks` will always appear in the changes, but will only result
		// in an update to the store if the blocks have changed.

		handlers.editRecord( changes );

		// Determine if we should refetch the persisted entity record from the
		// REST API because another client has persisted changes.
		const ystateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
		const persistedAt =
			( ystateMap.get( CRDT_STATE_PERSISTED_AT_KEY ) as number ) ?? 0;
		if ( persistedAt > lastPersistedAt ) {
			entityState.lastPersistedAt = persistedAt;
			this.setEntityState( objectType, objectId, entityState );
			void handlers.refetchPersistedRecord();
		}
	}

	/**
	 * Stop updating a document and discard it.
	 *
	 * @param {ObjectType} objectType Object type to discard.
	 * @param {ObjectID}   objectId   Object ID to discard.
	 */
	public discard( objectType: ObjectType, objectId: ObjectID ): void {
		this.getEntityState( objectType, objectId )?.destroy();
	}
}
