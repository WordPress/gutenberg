/**
 * WordPress dependencies
 */

/**
 * External dependencies
 */
import type { Awareness } from 'y-protocols/awareness';
import { removeAwarenessStates as removeAwarenessStatesFromProtocol } from 'y-protocols/awareness';
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import type {
	AwarenessClientID,
	AwarenessEventListener,
	AwarenessStates,
	ConnectDoc,
	ConnectDocResult,
	ObjectID,
	ObjectData,
	ObjectType,
	SyncConfig,
	SyncProvider,
} from './types';

interface EntityState {
	awareness: Awareness | null;
	destroy: () => void;
	prevContentClientId: AwarenessClientID;
	ydoc: Y.Doc;
}

interface PendingAwarenessSetup {
	pendingListeners: [ string, AwarenessEventListener ][];
	pendingStateFields: Map< string, unknown >;
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

	const pendingAwarenessSetup: PendingAwarenessSetup = {
		pendingListeners: [],
		pendingStateFields: new Map< string, unknown >(),
	};

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
			awareness: connectRemoteResult?.awareness || null,
			destroy: () => {
				connectLocalResult?.destroy?.();
				connectRemoteResult?.destroy?.();

				ydoc.off( 'update', updateHandler );
				ydoc.destroy();
				entityStates.delete( entityId );
			},
			prevContentClientId: 0,
			ydoc,
		};

		entityStates.set( entityId, entityState );

		bootstrapAwareness( connectRemoteResult?.awareness ?? null );
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

	// Awareness handlers

	/**
	 * Add a listener for awareness events.
	 *
	 * @param {'update'|'change'}      eventType              Event type.
	 * @param {AwarenessEventListener} awarenessEventListener Awareness event listener.
	 */
	function addListener(
		eventType: 'update' | 'change',
		awarenessEventListener: AwarenessEventListener
	) {
		Array.from( entityStates.values() ).forEach( ( entityState ) => {
			entityState.awareness?.on( eventType, awarenessEventListener );
		} );

		pendingAwarenessSetup.pendingListeners.push( [
			eventType,
			awarenessEventListener,
		] );
	}

	function bootstrapAwareness( awareness: Awareness | null ) {
		if ( ! awareness ) {
			return;
		}

		pendingAwarenessSetup.pendingListeners.forEach(
			( [ eventType, listener ]: [ string, AwarenessEventListener ] ) => {
				awareness.on( eventType, listener );
			}
		);

		Array.from(
			pendingAwarenessSetup.pendingStateFields.entries()
		).forEach( ( [ field, value ]: [ string, unknown ] ) => {
			awareness.setLocalStateField( field, value );
		} );
	}

	/**
	 * Get the states of all awareness documents.
	 */
	function getStates(): AwarenessStates {
		return (
			Array.from( entityStates.values() )
				.find( ( entityState ) => entityState.awareness )
				?.awareness?.getStates() ?? new Map()
		);
	}

	/**
	 * Removes the states of all awareness documents.
	 */
	function removeStates(): void {
		Array.from( entityStates.values() ).forEach( ( entityState ) => {
			if ( entityState.awareness ) {
				removeAwarenessStatesFromProtocol(
					entityState.awareness,
					[ entityState.awareness.clientID ],
					'removeAwarenessStates'
				);
			}
		} );
	}

	/**
	 * Set a local state field on all awareness documents.
	 *
	 * @param {string} field Field name.
	 * @param {any}    value State value.
	 */
	function setLocalState( field: string, value: unknown ) {
		Array.from( entityStates.values() ).forEach( ( entityState ) => {
			entityState.awareness?.setLocalStateField( field, value );
		} );

		pendingAwarenessSetup.pendingStateFields.set( field, value );
	}

	return {
		bootstrap,
		configs,
		discard,
		update,

		awarenessManager: {
			addListener,
			getStates,
			removeStates,
			setLocalState,
		},
	};
};
