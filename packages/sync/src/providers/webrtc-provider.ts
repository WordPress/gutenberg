/**
 * External dependencies
 */
import { ObservableV2 } from 'lib0/observable';

/**
 * Internal dependencies
 */
import {
	type Message,
	type MessagePayload,
	pollForMessagesFromSyncServer,
	postMessageToSyncServer,
} from './utils';
import { WebrtcProvider } from './y-webrtc/y-webrtc';

import type { CRDTDoc, ObjectID, ObjectType, ProviderCreator } from '../types';

const POLL_INTERVAL_MS = 2000;
const ROOM_NAME = 'webrtc/signaling:999'; // synthetic room name for signaling

type SignalingMessage =
	| {
			type: 'publish';
			topic: string;
			data: any;
	  }
	| {
			type: 'announce';
			topics: string[];
			data: any;
	  };

/**
 * HTTP-based signaling transport that uses short-polling instead of a WebSocket.
 * Compatible with the Gutenberg HTTP Polling Sync Server REST API.
 */
class HttpSignalingTransport extends ObservableV2< any > {
	private shouldConnect: boolean = true;
	private stopPolling: () => void = () => {};

	constructor(
		public url: string,
		private clientId: number
	) {
		super();
		setTimeout( () => {
			this.connect();
		}, 100 );
	}

	/**
	 * @param {SignalingMessage} message
	 */
	send( message: SignalingMessage ) {
		const payload: MessagePayload< SignalingMessage > = {
			client_id: this.clientId,
			data: message,
			room: ROOM_NAME,
			type: 'signaling',
		};

		void postMessageToSyncServer< SignalingMessage >( this.url, payload );
	}

	public destroy(): void {
		super.destroy();

		this.disconnect();
	}

	public disconnect(): void {
		this.shouldConnect = false;
		this.stopPolling();
		this.emit( 'disconnect', [] );
	}

	public connect() {
		if ( ! this.shouldConnect ) {
			return;
		}

		this.stopPolling = this.pollRooms();
		this.emit( 'connect', [] );
	}

	/**
	 * Poll a specific room for new messages.
	 */
	private pollRooms(): () => void {
		return pollForMessagesFromSyncServer< SignalingMessage >(
			this.url,
			this.clientId,
			ROOM_NAME,
			( messages: Message< SignalingMessage >[] ) => {
				messages.forEach( ( message: Message< SignalingMessage > ) => {
					// Emit as a publish message (parent class handlers will process it)
					this.emit( 'message', [ message.data ] );
				} );
			},
			POLL_INTERVAL_MS
		);
	}
}

class WebrtcProviderWithHttpSignaling extends WebrtcProvider {
	createSignalingTransport( url: any ) {
		return new HttpSignalingTransport( url, this.doc.clientID );
	}
}

interface WebRTCProviderConfig {
	password: string;
	signalingUrl: string;
}

/**
 * Function that creates a new WebRTC Connection.
 *
 * @param {WebRTCProviderConfig} config
 * @return {ProviderCreator} Promise that resolves when the connection is established.
 */
export function createWebRTCProvider( {
	password,
	signalingUrl,
}: WebRTCProviderConfig ): ProviderCreator {
	return function (
		objectType: ObjectType,
		objectId: ObjectID,
		doc: CRDTDoc
	) {
		const roomName = `${ objectType }-${ objectId }`;
		const provider = new WebrtcProviderWithHttpSignaling( roomName, doc, {
			signaling: [ signalingUrl ],
			password,
		} );

		return Promise.resolve( {
			destroy: () => provider.destroy(),
		} );
	};
}
