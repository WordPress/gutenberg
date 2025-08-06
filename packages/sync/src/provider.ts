/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
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
	undoManager: Y.UndoManager;
	destroy: () => void;
	ydoc: CRDTDoc;
}

export class SyncProvider {
	private connectLocal: ConnectDoc | null;
	private connectRemote: ConnectDoc | null;

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
	 * @param {ObjectData} initialData   Initial data to apply to the document.
	 * @param {Function}   handleChanges Callback to call when data changes.
	 */
	public async bootstrap(
		syncConfig: SyncConfig,
		initialData: ObjectData,
		handleChanges: ( data: Partial< ObjectData > ) => void
	): Promise< void > {
		const ydoc = new Y.Doc( { meta: new Map() } );
		const objectId = syncConfig.getObjectId( initialData );
		const objectType = syncConfig.objectType;
		const connections = await this.connect( objectId, objectType, ydoc );
		const entityId = this.getEntityId( objectType, objectId );

		const undoManager = new Y.UndoManager( ydoc.getMap( 'document' ), {
			// Ensure we undo and redo one character at a time.
			captureTimeout: 0,
			// Ensure that we only scope the undo/redo to the current client, and Gutenberg origins.
			// ToDo: Keep an eye on this, as it needs to be battle tested.
			trackedOrigins: new Set( [ 'gutenberg', ydoc.clientID ] ),
			// This ensures that are able to improve the client specific undo/redo experience.
			// This reduces the bugs we see, but it doesn't eliminate them entirely.
			ignoreRemoteMapChanges: true,
		} );

		const onDestroy = (): void => {
			connections.forEach( ( result ) => result.destroy() );
			ydoc.off( 'update', onUpdate );
			ydoc.destroy();
			undoManager.destroy();
			this.entityStates.delete( entityId );
		};

		const onUpdate = ( _update: Uint8Array, origin: string ): void => {
			if ( origin !== 'gutenberg' ) {
				const data = syncConfig.fromCRDTDoc( ydoc );
				handleChanges( data );
			}
		};

		ydoc.on( 'update', onUpdate );

		this.configs.set( objectType, syncConfig );
		this.connections.set( entityId, connections );
		this.entityStates.set( entityId, {
			undoManager,
			ydoc,
			destroy: onDestroy,
		} );

		this.update( objectType, initialData, initialData, 'gutenberg' );
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
	 * Get the undo manager for the given object type and object ID.
	 *
	 * @param {ObjectType} objectType Object type.
	 * @param {ObjectID}   objectId   Object ID.
	 * @return {Y.UndoManager | null} The undo manager, or null if not found.
	 */
	public getUndoManager(
		objectType: ObjectType,
		objectId: ObjectID
	): Y.UndoManager | null {
		const entityState = this.getEntityState( objectType, objectId );
		return entityState ? entityState.undoManager : null;
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
		const objectId = this.configs.get( objectType )?.getObjectId( record );

		if ( ! objectId ) {
			return;
		}

		const entityState = this.getEntityState( objectType, objectId );

		entityState?.ydoc.transact( () => {
			this.configs
				.get( objectType )
				?.applyChangesToDoc( entityState.ydoc, changes );
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
