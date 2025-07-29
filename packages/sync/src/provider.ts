/**
 * WordPress dependencies
 */

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
	ObjectID,
	ObjectData,
	ObjectType,
	SyncConfig,
	SyncProvider,
} from './types';

interface EntityState {
	destroy: () => void;
	ydoc: Y.Doc;
}

/**
 * Create a sync provider.
 *
 * @param {ConnectDoc | null} connectLocal  Connect the document to a local database.
 * @param {ConnectDoc | null} connectRemote Connect the document to a remote sync connection.
 * @return {SyncProvider} Sync provider.
 */
export const createSyncProvider = (
	connectLocal: ConnectDoc | null,
	connectRemote: ConnectDoc | null
): SyncProvider => {
	const configs: Map< ObjectType, SyncConfig > = new Map<
		ObjectType,
		SyncConfig
	>();
	const entityStates: Map< string, EntityState > = new Map<
		string,
		EntityState
	>();

	/**
	 * Fetch data from local database or remote source.
	 *
	 * @param {SyncConfig} syncConfig    Sync configuration for the object type.
	 * @param {ObjectData} initialData   Initial data to apply to the document.
	 * @param {Function}   handleChanges Callback to call when data changes.
	 */
	async function bootstrap(
		syncConfig: SyncConfig,
		initialData: ObjectData,
		handleChanges: ( data: Partial< ObjectData > ) => void
	): Promise< void > {
		const ydoc = new Y.Doc( { meta: new Map() } );
		const objectId = syncConfig.getObjectId( initialData );
		const objectType = syncConfig.objectType;
		const entityId = `${ objectType }_${ objectId }`;

		configs.set( objectType, syncConfig );

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
			( await connectLocal?.( objectId, objectType, ydoc ) ) ?? null;
		const connectRemoteResult =
			( await connectRemote?.( objectId, objectType, ydoc ) ) ?? null;

		const entityState: EntityState = {
			destroy: () => {
				connectLocalResult?.destroy?.();
				connectRemoteResult?.destroy?.();

				ydoc.off( 'update', updateHandler );
				ydoc.destroy();
				entityStates.delete( entityId );
			},
			ydoc,
		};

		entityStates.set( entityId, entityState );

		update( objectType, initialData, initialData, 'gutenberg' );
	}

	/**
	 * Fetch data from local database or remote source.
	 *
	 * @param {ObjectType}            objectType Object type to load.
	 * @param {ObjectData}            record     Record to load.
	 * @param {Partial< ObjectData >} changes    Updates to make.
	 * @param {string}                origin     The source of change.
	 */
	function update(
		objectType: ObjectType,
		record: ObjectData,
		changes: Partial< ObjectData >,
		origin: string
	) {
		const objectId = configs.get( objectType )?.getObjectId( record );
		const entityId = `${ objectType }_${ objectId }`;
		const entityState = entityStates.get( entityId );

		if ( ! entityState ) {
			throw new Error(
				`Entity ${ objectType }:${ objectId } not found `
			);
		}

		entityState.ydoc.transact( () => {
			configs
				.get( objectType )
				?.applyChangesToDoc( entityState.ydoc, changes );
		}, origin );
	}

	/**
	 * Stop updating a document and discard it.
	 *
	 * @param {ObjectType} objectType Object type to load.
	 * @param {ObjectID}   objectId   Object ID to load.
	 */
	function discard( objectType: ObjectType, objectId: ObjectID ) {
		const entityId = `${ objectType }_${ objectId }`;

		entityStates.get( entityId )?.destroy();
		entityStates.delete( entityId );
	}

	return {
		bootstrap,
		configs,
		discard,
		update,
	};
};
