/**
 * External dependencies
 */
import type * as Y from 'yjs';
import { ObservableV2 } from 'lib0/observable';
import { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import type {
	ProviderCreator,
	ProviderCreatorResult,
	SyncConnectionState,
	SyncConnectionStatus,
} from '../../types';
import { pollingManager } from './polling-manager';

export interface ProviderOptions {
	awareness?: Awareness;
	debug?: boolean;
	room: string;
	ydoc: Y.Doc;
}

/**
 * Event types for HttpPollingProvider.
 * ObservableV2 expects event handlers as functions.
 */
type HttpPollingEvents = {
	'sync-connection-status': ( data: SyncConnectionState ) => void;
};

/**
 * Yjs provider that uses HTTP polling for real-time synchronization. It manages
 * document updates and awareness states through a central sync server.
 */
class HttpPollingProvider extends ObservableV2< HttpPollingEvents > {
	protected awareness: Awareness;
	protected synced = false;

	public constructor( protected options: ProviderOptions ) {
		super();
		this.log( 'Initializing', { room: options.room } );

		this.awareness = options.awareness ?? new Awareness( options.ydoc );
		this.connect();
	}

	/**
	 * Connect to the endpoint and initialize sync.
	 */
	public connect(): void {
		this.log( 'Connecting' );

		pollingManager.registerRoom( {
			room: this.options.room,
			doc: this.options.ydoc,
			awareness: this.awareness,
			log: this.log,
			onSync: this.onSync,
			onStatusChange: this.onStatusChange,
		} );
	}

	/**
	 * Destroy the provider and cleanup resources.
	 */
	public destroy(): void {
		this.disconnect();
		super.destroy();
	}

	/**
	 * Disconnect the provider and allow reconnection later.
	 */
	public disconnect(): void {
		this.log( 'Disconnecting' );

		pollingManager.unregisterRoom( this.options.room );
		this.emitStatus( 'disconnected' );
	}

	/**
	 * Emit connection status.
	 *
	 * @param status The connection status
	 */
	protected emitStatus( status: SyncConnectionStatus ): void {
		const connectionState: SyncConnectionState = { status };
		// ObservableV2 expects arguments as an array
		this.emit( 'sync-connection-status', [ connectionState ] );
	}

	/**
	 * Log debug messages if debugging is enabled.
	 *
	 * @param message The debug message
	 * @param debug   Additional debug information
	 */
	protected log = ( message: string, debug: object = {} ): void => {
		if ( this.options.debug ) {
			// eslint-disable-next-line no-console
			console.log( `[${ this.constructor.name }]: ${ message }`, {
				room: this.options.room,
				...debug,
			} );
		}
	};

	/**
	 * Handle synchronization events from the polling manager.
	 *
	 * @param status The synchronization status
	 */
	protected onStatusChange = ( status: SyncConnectionStatus ): void => {
		this.log( 'Status changed', { status } );
		this.emitStatus( status );
	};

	protected onSync = (): void => {
		if ( ! this.synced ) {
			this.synced = true;
			this.log( 'Synced' );
		}
	};
}

/**
 * Create a provider creator function for the HttpPollingProvider
 */
export function createHttpPollingProvider(): ProviderCreator {
	return async ( {
		awareness,
		objectType,
		objectId,
		ydoc,
	} ): Promise< ProviderCreatorResult > => {
		// Generate room name from objectType and objectId
		const room = objectId ? `${ objectType }:${ objectId }` : objectType;
		const provider = new HttpPollingProvider( {
			awareness,
			// debug: true,
			room,
			ydoc,
		} );

		return {
			destroy: () => provider.destroy(),
			// Adapter: ObservableV2.on is compatible with ProviderOn
			// The callback receives data as the first parameter
			on: ( event, callback ) => {
				provider.on( event, callback );
			},
		};
	};
}
