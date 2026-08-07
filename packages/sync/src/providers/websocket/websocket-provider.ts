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
import { websocketManager } from './websocket-manager';

/**
 * Transport slug (matches the server's WP_WebSocket_Sync_Transport).
 */
export const WEBSOCKET_TRANSPORT_SLUG = 'websocket';

interface ProviderOptions {
	room: string;
	session: EngineSessionCodec;
}

type WebSocketProviderEvents = {
	status: ( status: ConnectionStatus ) => void;
};

/**
 * Provider that moves the engine session codec's updates and awareness over
 * a WebSocket (its server counterpart is the WP_WebSocket_Sync_Server
 * daemon). Push-based: remote edits arrive the instant peers make them.
 */
class WebSocketProvider extends ObservableV2< WebSocketProviderEvents > {
	protected status: ConnectionStatus[ 'status' ] = 'disconnected';

	public constructor( protected options: ProviderOptions ) {
		super();
		websocketManager.registerRoom( {
			room: options.room,
			session: options.session,
			onStatusChange: ( status ) => this.emit( 'status', [ status ] ),
		} );
	}

	public destroy(): void {
		websocketManager.unregisterRoom( this.options.room );
		super.destroy();
	}
}

/**
 * Creates the WebSocket provider.
 *
 * @return {ProviderCreator} The provider creator.
 */
export function createWebSocketProvider(): ProviderCreator {
	return async ( { objectType, objectId, session } ) => {
		const room = objectId ? `${ objectType }:${ objectId }` : objectType;
		const provider = new WebSocketProvider( { room, session } );
		return {
			destroy: () => provider.destroy(),
			on: ( event, cb ) =>
				provider.on(
					event as 'status',
					cb as ( status: ConnectionStatus ) => void
				),
		} as ProviderCreatorResult;
	};
}
