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
	protected connectLocal: ConnectDoc | null;
	protected connectRemote: ConnectDoc | null;

	protected configs: Map< ObjectType, SyncConfig > = new Map<
		ObjectType,
		SyncConfig
	>();

	protected entityStates: Map< string, EntityState > = new Map<
		string,
		EntityState
	>();

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
		const entityId = this.getEntityId( objectType, objectId );

		this.configs.set( objectType, syncConfig );

		const updateHandler: ( _update: Uint8Array, origin: string ) => void = (
			_update,
			origin
		): void => {
			if ( origin !== 'gutenberg' ) {
				const data = syncConfig.fromCRDTDoc( ydoc );
				handleChanges( data );
			}
		};

		ydoc.on( 'update', updateHandler );

		const connectLocalResult: ConnectDocResult | null =
			( await this.connectLocal?.( objectId, objectType, ydoc ) ) ?? null;
		const connectRemoteResult =
			( await this.connectRemote?.( objectId, objectType, ydoc ) ) ??
			null;

		const entityState: EntityState = {
			destroy: () => {
				connectLocalResult?.destroy?.();
				connectRemoteResult?.destroy?.();

				ydoc.off( 'update', updateHandler );
				ydoc.destroy();
				this.entityStates.delete( entityId );
			},
			ydoc,
		};

		this.entityStates.set( entityId, entityState );

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
	): string {
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
		const entityId = `${ objectType }_${ objectId }`;

		this.getEntityState( objectType, objectId )?.destroy();
		this.entityStates.delete( entityId );
	}
}
