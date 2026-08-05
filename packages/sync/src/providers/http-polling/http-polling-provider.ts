/**
 * External dependencies
 */
import { ObservableV2 } from 'lib0/observable';

/**
 * Internal dependencies
 */
import type {
	ConnectionStatus,
	EngineSessionCodec,
	ProviderCreator,
	ProviderCreatorResult,
} from '../../types';
import { pollingManager } from './polling-manager';

export interface ProviderOptions {
	debug?: boolean;
	room: string;
	session: EngineSessionCodec;
}

/**
 * Event types for HttpPollingProvider. ObservableV2 expects event handlers as
 * functions. `status` mirrors the generic `ProviderEventMap`.
 */
type HttpPollingEvents = {
	status: ( status: ConnectionStatus ) => void;
};

/**
 * Sync provider that uses HTTP polling for real-time synchronization. It moves
 * typed updates and awareness states between a central sync server and the
 * engine session codec, without interpreting either.
 */
class HttpPollingProvider extends ObservableV2< HttpPollingEvents > {
	protected status: ConnectionStatus[ 'status' ] = 'disconnected';

	public constructor( protected options: ProviderOptions ) {
		super();
		this.log( 'Initializing', { room: options.room } );

		this.connect();
	}

	/**
	 * Connect to the endpoint and initialize sync.
	 */
	public connect(): void {
		this.log( 'Connecting' );

		pollingManager.registerRoom( {
			room: this.options.room,
			session: this.options.session,
			log: this.log,
			onStatusChange: this.emitStatus,
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
		this.emitStatus( { status: 'disconnected' } );
	}

	/**
	 * Emit connection status, passing the full object through so that
	 * additional fields (e.g. `willAutoRetryInMs`) are preserved for consumers.
	 *
	 * @param connectionStatus The connection status object
	 */
	protected emitStatus = ( connectionStatus: ConnectionStatus ): void => {
		const { status } = connectionStatus;
		const error =
			status === 'disconnected' ? connectionStatus.error : undefined;

		if ( this.status === status && ! error ) {
			return;
		}

		// Only emit 'connecting' status if transitioning from 'disconnected'.
		if ( status === 'connecting' && this.status !== 'disconnected' ) {
			return;
		}

		this.log( 'Status change', { status, error } );

		// ObservableV2 expects arguments as an array
		this.status = status;
		this.emit( 'status', [ connectionStatus ] );
	};

	/**
	 * Log debug messages if debugging is enabled.
	 *
	 * @param message    The debug message
	 * @param debug      Additional debug information
	 * @param errorLevel The console method to use for logging
	 * @param force      Whether to force logging regardless of debug setting
	 */
	protected log = (
		message: string,
		debug: object = {},
		errorLevel: 'log' | 'warn' | 'error' = 'log',
		force = false
	): void => {
		if ( ! this.options.debug && ! force ) {
			return;
		}

		// eslint-disable-next-line no-console
		const logFn = console[ errorLevel ] || console.log;

		logFn( `[${ this.constructor.name }]: ${ message }`, {
			room: this.options.room,
			...debug,
		} );
	};
}

/**
 * Create a provider creator function for the HttpPollingProvider
 */
export function createHttpPollingProvider(): ProviderCreator {
	return async ( {
		objectType,
		objectId,
		session,
	} ): Promise< ProviderCreatorResult > => {
		// Generate room name from objectType and objectId
		const room = objectId ? `${ objectType }:${ objectId }` : objectType;
		const provider = new HttpPollingProvider( {
			// debug: true,
			room,
			session,
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
