/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import { UndoManager } from './undo-manager';
import type {
	ConnectDoc,
	ConnectDocResult,
	CRDTDoc,
	EntityID,
	ObjectID,
	ObjectData,
	ObjectType,
	SyncConfig,
} from './types';

interface EntityState {
	destroy: () => void;
	ydoc: CRDTDoc;
}

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
	 * Fetch data from local database or remote source.
	 *
	 * @param {SyncConfig} syncConfig    Sync configuration for the object type.
	 * @param {ObjectData} record        Record representing this object type.
	 * @param {Function}   handleChanges Callback to call when data changes.
	 */
	public async bootstrap(
		syncConfig: SyncConfig,
		record: ObjectData,
		handleChanges: ( data: Partial< ObjectData > ) => void
	): Promise< void > {
		const ydoc = new Y.Doc( { meta: new Map() } );
		const objectId = syncConfig.getObjectId( record );
		const objectType = syncConfig.objectType;
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
				const data = syncConfig.fromCRDTDoc( ydoc );
				handleChanges( data );
			}
		};

		ydoc.on( 'update', onUpdate );

		if ( syncConfig.supportsUndo ) {
			this.undoManager = new UndoManager( ydoc );
		}

		this.configs.set( objectType, syncConfig );
		this.connections.set( entityId, connections );
		this.entityStates.set( entityId, {
			destroy: onDestroy,
			ydoc,
		} );

		// Get the initial data to be synced for this record.
		const initialCRDTDoc = await this.getInitialCRDTDoc(
			syncConfig,
			record
		);

		// Create the initial document, possible from persisted doc.
		Y.transact(
			ydoc,
			() => {
				// apply remote changes
				Y.applyUpdate( ydoc, Y.encodeStateAsUpdate( initialCRDTDoc ) );
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
	 * Get the CRDTDoc that represents the initial state of the object data. Custom
	 * sync providers can override this method to provide a custom initial state.
	 *
	 * @param {SyncConfig} syncConfig Sync configuration for the object type.
	 * @param {ObjectData} record     Initial data to apply to the document.
	 */
	protected async getInitialCRDTDoc(
		syncConfig: SyncConfig,
		record: ObjectData
	): Promise< CRDTDoc > {
		// IMPORTANT: We use a new Yjs document so that the initial state can be
		// applied to the "real" Yjs document as a singular update.
		const initialStateDoc = new Y.Doc( { meta: new Map() } );

		const initialData = syncConfig.getInitialObjectData( record );
		syncConfig.applyChangesToCRDTDoc(
			initialStateDoc,
			initialData,
			'syncProvider.getInitialCRDTDoc'
		);

		return initialStateDoc;
	}

	/**
	 * Get the undo manager.
	 *
	 * @return {UndoManager | null} The undo manager, or null if unsupported.
	 */
	public getUndoManager(): UndoManager | null {
		return this.undoManager;
	}

	/**
	 * Fetch data from local database or remote source.
	 *
	 * @param {ObjectType}            objectType Object type to load.
	 * @param {ObjectData}            record     Record to load.
	 * @param {Partial< ObjectData >} changes    Updates to make.
	 * @param {string}                origin     The source of change.
	 */
	public update(
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
			syncConfig.applyChangesToCRDTDoc( ydoc, changes, origin );
		}, origin );
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
