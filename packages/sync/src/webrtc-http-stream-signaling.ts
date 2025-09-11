/**
 * Internal dependencies
 */
import {
	WebrtcProvider,
	SignalingConn,
	WebrtcConn,
	signalingConns,
	rooms,
	publishSignalingMessage,
	log,
} from './y-webrtc/y-webrtc';
import * as cryptoutils from './y-webrtc/crypto';

/**
 * External dependencies
 */
import * as map from 'lib0/map';
import { Observable } from 'lib0/observable';
import * as buffer from 'lib0/buffer';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

interface SignalData {
	from: string;
	to: string;
	type: 'announce' | 'signal';
	signal: { type: 'offer' | 'answer'; [ key: string ]: any };
	token: number;
}

interface SignalMessage {
	type: string;
	topic: string;
	data: SignalData;
}

/**
 * Method copied as is from the SignalingConn constructor.
 * Setups the needed event handlers for an http signaling connection.
 *
 * @param signalCon The signaling connection.
 * @param url       The url.
 */
function setupSignalEventHandlers(
	signalCon: HttpSignalingConn,
	url: string
): void {
	signalCon.on( 'connect', () => {
		log( `connected (${ url })` );
		const topics = Array.from( rooms.keys() );
		signalCon.send( { type: 'subscribe', topics } );
		rooms.forEach( ( room ) =>
			publishSignalingMessage( signalCon as SignalingConn, room, {
				type: 'announce',
				from: room.peerId,
			} )
		);
	} );
	signalCon.on( 'message', ( m: SignalMessage ) => {
		switch ( m.type ) {
			case 'publish': {
				const roomName = m.topic!;
				const room = rooms.get( roomName );
				if ( ! room || typeof roomName !== 'string' ) {
					return;
				}

				if (
					room === null ||
					typeof roomName !== 'string' ||
					room === undefined
				) {
					return;
				}
				const execMessage = ( data: SignalData ) => {
					const webrtcConns = room.webrtcConns;
					const peerId = room.peerId;
					if (
						data === null ||
						data.from === peerId ||
						( data.to !== undefined && data.to !== peerId ) ||
						room.bcConns.has( data.from )
					) {
						// ignore messages that are not addressed to this conn, or from clients that are connected via broadcastchannel
						return;
					}
					const emitPeerChange = webrtcConns.has( data.from )
						? () => {}
						: () =>
								room.provider.emit( 'peers', [
									{
										removed: [],
										added: [ data.from ],
										webrtcPeers: Array.from(
											room.webrtcConns.keys()
										),
										bcPeers: Array.from( room.bcConns ),
									},
								] );
					switch ( data.type ) {
						case 'announce':
							if ( webrtcConns.size < room.provider.maxConns ) {
								map.setIfUndefined(
									webrtcConns,
									data.from,
									() =>
										new WebrtcConn(
											signalCon as SignalingConn,
											true,
											data.from,
											room
										)
								);
								emitPeerChange();
							}
							break;
						case 'signal':
							if ( data.signal.type === 'offer' ) {
								const existingConn = webrtcConns.get(
									data.from
								);
								if ( existingConn ) {
									const remoteToken = data.token;
									const localToken = existingConn.glareToken;
									if (
										localToken &&
										localToken > remoteToken
									) {
										log( 'offer rejected: ', data.from );
										return;
									}
									// if we don't reject the offer, we will be accepting it and answering it
									existingConn.glareToken = undefined;
								}
							}
							if ( data.signal.type === 'answer' ) {
								log( 'offer answered by: ', data.from );
								const existingConn = webrtcConns.get(
									data.from
								);
								if ( existingConn ) {
									existingConn.glareToken = undefined;
								}
							}
							if ( data.to === peerId ) {
								map.setIfUndefined(
									webrtcConns,
									data.from,
									() =>
										new WebrtcConn(
											signalCon as SignalingConn,
											false,
											data.from,
											room
										)
								).peer.signal( data.signal );
								emitPeerChange();
							}
							break;
					}
				};
				if ( room.key ) {
					if ( typeof m.data === 'string' ) {
						cryptoutils
							.decryptJson(
								buffer.fromBase64( m.data ),
								room.key
							)
							.then(
								// @ts-expect-error -- decryptJson return type is too generic; we know it matches SignalData
								execMessage
							);
					}
				} else {
					execMessage( m.data );
				}
			}
		}
	} );
	signalCon.on( 'disconnect', () => log( `disconnect (${ url })` ) );
}

/**
 * Method that instantiates the http signaling connection.
 * Tries to implement the same methods a websocket provides using ajax requests
 * to send messages and EventSource to retrieve messages.
 *
 * @param httpClient The signaling connection.
 */
function setupHttpSignal( httpClient: HttpSignalingConn ) {
	if ( httpClient.shouldConnect && httpClient.ws === null ) {
		// eslint-disable-next-line no-restricted-syntax
		const subscriberId = Math.floor( 100000 + Math.random() * 900000 );
		const url = httpClient.url;
		const eventSource = new window.EventSource(
			addQueryArgs( url, {
				subscriber_id: subscriberId,
				action: 'gutenberg_signaling_server',
			} )
		);

		let pingTimeout: any = null;
		eventSource.onmessage = ( event ) => {
			httpClient.lastMessageReceived = Date.now();
			const data = event.data;
			if ( data ) {
				const messages = JSON.parse( data );
				if ( Array.isArray( messages ) ) {
					messages.forEach( onSingleMessage );
				}
			}
		};
		httpClient.ws = eventSource;
		httpClient.connecting = true;
		httpClient.connected = false;
		const onSingleMessage = ( message: any ) => {
			if ( message && message.type === 'pong' ) {
				clearTimeout( pingTimeout );
				pingTimeout = setTimeout(
					sendPing,
					messageReconnectTimeout / 2
				);
			}
			httpClient.emit( 'message', [ message, httpClient ] );
		};

		/**
		 * @param error
		 */
		const onclose = ( error: any ) => {
			if ( httpClient.ws !== null ) {
				httpClient.ws.close();
				httpClient.ws = null;
				httpClient.connecting = false;
				if ( httpClient.connected ) {
					httpClient.connected = false;
					httpClient.emit( 'disconnect', [
						{ type: 'disconnect', error },
						httpClient,
					] );
				} else {
					httpClient.unsuccessfulReconnects++;
				}
			}
			clearTimeout( pingTimeout );
		};
		const sendPing = () => {
			if (
				httpClient.ws &&
				httpClient.ws.readyState === window.EventSource.OPEN
			) {
				httpClient.send( {
					type: 'ping',
				} );
			}
		};
		if ( httpClient.ws ) {
			httpClient.ws.onclose = () => {
				onclose( null );
			};
			httpClient.ws.send = function send( message: string ) {
				window
					.fetch( url, {
						body: new URLSearchParams( {
							subscriber_id: subscriberId.toString(),
							action: 'gutenberg_signaling_server',
							message,
						} ),
						method: 'POST',
					} )
					.catch( () => {
						log(
							'Error sending to server with message: ' + message
						);
					} );
			};
		}
		eventSource.onerror = () => {
			// Todo: add an error handler
		};
		eventSource.onopen = () => {
			if ( httpClient.connected ) {
				return;
			}
			if ( eventSource.readyState === window.EventSource.OPEN ) {
				httpClient.lastMessageReceived = Date.now();
				httpClient.connecting = false;
				httpClient.connected = true;
				httpClient.unsuccessfulReconnects = 0;
				httpClient.emit( 'connect', [
					{ type: 'connect' },
					httpClient,
				] );
				// set ping
				pingTimeout = setTimeout(
					sendPing,
					messageReconnectTimeout / 2
				);
			}
		};
	}
}
const messageReconnectTimeout = 30000;

export class HttpSignalingConn extends Observable< string > {
	url: string;
	ws:
		| ( EventSource & {
				send?: ( msg: string ) => void;
				onclose?: ( this: EventSource, ev: Event ) => any;
		  } )
		| null;
	binaryType: null;
	connected: boolean;
	connecting: boolean;
	unsuccessfulReconnects: number;
	lastMessageReceived: number;
	shouldConnect: boolean;
	_checkInterval: NodeJS.Timeout;
	providers: Set< WebrtcProvider >;

	constructor( url: string ) {
		super();

		//WebsocketClient from lib0/websocket.js
		this.url = url;
		/**
		 * @type {WebSocket?}
		 */
		this.ws = null;
		this.binaryType = null; // this.binaryType = binaryType
		this.connected = false;
		this.connecting = false;
		this.unsuccessfulReconnects = 0;
		this.lastMessageReceived = 0;
		/**
		 * Whether to connect to other peers or not
		 */
		this.shouldConnect = true;
		this._checkInterval = setInterval( () => {
			if (
				this.connected &&
				messageReconnectTimeout <
					Date.now() - this.lastMessageReceived &&
				this.ws
			) {
				// no message received in a long time - not even your own awareness
				// updates (which are updated every 15 seconds)
				this.ws.close();
			}
		}, messageReconnectTimeout / 2 );
		//setupWS( this );
		setupHttpSignal( this );

		// From SignalingConn
		/**
		 * @type {Set<WebrtcProvider>}
		 */
		this.providers = new Set();

		setupSignalEventHandlers( this, url );
	}

	send( message: any ) {
		if ( this.ws && this.ws?.send ) {
			this.ws.send( JSON.stringify( message ) );
		}
	}

	destroy() {
		clearInterval( this._checkInterval );
		this.disconnect();
		super.destroy();
	}

	disconnect() {
		this.shouldConnect = false;
		if ( this.ws !== null ) {
			this.ws.close();
		}
	}

	connect() {
		this.shouldConnect = true;
		if ( ! this.connected && this.ws === null ) {
			setupHttpSignal( this );
		}
	}
}

export class WebrtcProviderWithHttpSignaling extends WebrtcProvider {
	connect() {
		this.shouldConnect = true;
		this.signalingUrls.forEach( ( url: string ) => {
			const signalingConn = map.setIfUndefined<
				SignalingConn | HttpSignalingConn,
				string,
				Map< string, SignalingConn | HttpSignalingConn >
			>(
				signalingConns,
				url,
				// Only this conditional logic to create a normal websocket connection or
				// an http signaling connection was added to the constructor when compared
				// with the base class.
				url.startsWith( 'ws://' ) || url.startsWith( 'wss://' )
					? () => new SignalingConn( url )
					: () => new HttpSignalingConn( url )
			);
			this.signalingConns.push( signalingConn );
			signalingConn.providers.add( this );
		} );
		if ( this.room ) {
			this.room.connect();
		}
	}
}
