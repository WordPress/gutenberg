/**
 * External dependencies
 */
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import { Observable } from 'lib0/observable';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { ProviderCreator, ProviderCreatorResult } from '../types';

interface HttpSseProviderOptions {
	debug?: boolean;
	doc: Y.Doc;
	endpoint: string;
	fullStateIntervalInMs?: number;
	reconnectIntervalInMs?: number;
	room: string;
}

interface SyncMessage {
	data: number[];
	from: number;
	id: number;
	is_full_state: boolean;
	last_message_id: number;
}

interface SyncMessagePayload {
	client_id: number;
	message: Omit< SyncMessage, 'id' >;
	room: string;
}

const DEFAULT_FULL_STATE_INTERVAL_IN_MS = 30000;
const DEFAULT_RECONNECT_INTERVAL_IN_MS = 5000;

/**
 * Yjs provider that uses HTTP SSE for real-time synchronization.
 * Unlike WebRTC, this provider communicates through a central server
 * which manages rooms and broadcasts updates to all connected clients.
 */
export class HttpSseProvider extends Observable< string > {
	private options: HttpSseProviderOptions;

	private eventSource: EventSource | null = null;
	private lastMessageId = 0;
	private seenMessages = new Set< number >();
	private synced = false;

	private fullStateTimeout?: NodeJS.Timeout;
	private reconnectTimeout?: NodeJS.Timeout;

	public constructor( options: HttpSseProviderOptions ) {
		super();

		this.options = options;
		this.options.doc.on( 'update', this.onDocUpdate );

		this.log( 'Initializing', { room: options?.room } );
		this.connect();
	}

	/**
	 * Connect to the endpoint and initialize sync.
	 */
	public connect(): void {
		if ( ! this.reconnectTimeout ) {
			this.reconnectTimeout = setInterval(
				this.connect.bind( this ),
				this.options.reconnectIntervalInMs ??
					DEFAULT_RECONNECT_INTERVAL_IN_MS
			);
		}

		// Set up periodic full state sending (every 30 seconds)
		if ( ! this.fullStateTimeout ) {
			this.fullStateTimeout = setInterval(
				this.sendFullState.bind( this ),
				this.options.fullStateIntervalInMs ??
					DEFAULT_FULL_STATE_INTERVAL_IN_MS
			);
		}

		const readyState = this.eventSource?.readyState;
		if ( 0 === readyState || 1 === readyState ) {
			this.log( 'Already connected or connecting to endpoint', {
				readyState,
			} );
			return;
		}

		this.log( 'Connecting to endpoint' );

		// Setup EventSource for receiving messages
		const url = addQueryArgs( this.options.endpoint, {
			// @ts-ignore
			_wpnonce: globalThis.__experimentalCollaborativeEditingNonce ?? '',
			client_id: this.options.doc.clientID,
			last_message_id: this.lastMessageId,
			room: this.options.room,
		} );

		this.eventSource?.close();
		this.eventSource = new EventSource( url, { withCredentials: true } );

		this.eventSource.onerror = this.onEventSourceError.bind( this );
		this.eventSource.onopen = this.onEventSourceOpen.bind( this );
		this.eventSource.onmessage = this.onEventSourceMessage.bind( this );
	}

	/**
	 * Destroy the provider and cleanup resources.
	 */
	public destroy(): void {
		this.log( 'Disconnecting' );

		this.eventSource?.close();
		this.emitStatus( 'disconnected' );
		this.options.doc.off( 'update', this.onDocUpdate );

		clearInterval( this.fullStateTimeout );
		clearInterval( this.reconnectTimeout );

		super.destroy();
	}

	/**
	 * Emit connection status.
	 *
	 * @param status The connection status
	 */
	private emitStatus( status: 'connected' | 'disconnected' ): void {
		this.emit( 'status', [ { status } ] );
	}

	/**
	 * Log debug messages if debugging is enabled.
	 *
	 * @param message The debug message
	 * @param debug   Additional debug information
	 */
	private log( message: string, debug: object = {} ): void {
		if ( this.options.debug ) {
			// eslint-disable-next-line no-console
			console.log( `[HttpSseProvider]: ${ message }`, {
				room: this.options.room,
				...debug,
			} );
		}
	}

	/* BEGIN: Bound arrow functions to preserve "this" */

	/**
	 * Handle document updates and send them to the server.
	 *
	 * @param update The document update
	 * @param origin The origin of the update
	 */
	private onDocUpdate = ( update: Uint8Array, origin: unknown ): void => {
		if ( this === origin ) {
			return;
		}

		const encoder = encoding.createEncoder();
		syncProtocol.writeUpdate( encoder, update );

		this.sendEncodedMessage( encoding.toUint8Array( encoder ) );
	};

	/**
	 * Handle EventSource errors and attempt to reconnect. NOTE: If the connection
	 * closes for any reason -- even an expected reason like the server closing the
	 * connection after a time limit is reached -- an error event is emitted. The
	 * error event is a generic event with no useful information, so it is not
	 * inspected.
	 */
	private onEventSourceError = (): void => {
		this.log( 'SSE connection error', {
			readystate: this.eventSource?.readyState,
		} );

		this.connect();
	};

	/**
	 * Handle EventSource open event and initiate sync.
	 */
	private onEventSourceOpen = (): void => {
		this.log( 'Connection opened' );
		this.emitStatus( 'connected' );

		// Send initial sync
		this.sendSyncStep1();
	};

	/**
	 * Handle incoming EventSource messages.
	 *
	 * @param {MessageEvent} event The incoming message event
	 */
	private onEventSourceMessage = ( event: MessageEvent ): void => {
		try {
			const data = JSON.parse( event.data );
			if ( Array.isArray( data.messages ) ) {
				data.messages.forEach( ( message: any ) => {
					this.processEventSourceMessage( message );
				} );
			}
		} catch ( error ) {
			this.log( 'Error parsing SSE message', { error } );
		}
	};

	/* END bound arrow functions */

	/**
	 * Process incoming messages from the server
	 *
	 * @param {SyncMessage} message The incoming sync message
	 */
	private processEventSourceMessage( message: SyncMessage ): void {
		if ( message.from === this.options.doc.clientID ) {
			this.log( 'Ignoring own message', { messageId: message.id } );
			return;
		}

		if ( this.seenMessages.has( message.id ) ) {
			this.log( 'Ignoring duplicate message', { messageId: message.id } );
			return;
		}

		this.log( 'Handling incoming message', { messageId: message.id } );

		this.lastMessageId = message.id;

		if ( message.data ) {
			const data = new Uint8Array( message.data );
			const decoder = decoding.createDecoder( data );
			const encoder = encoding.createEncoder();

			const syncMessageType = syncProtocol.readSyncMessage(
				decoder,
				encoder,
				this.options.doc,
				this
			);

			// If we received sync step 1, respond with sync step 2.
			if ( syncMessageType === syncProtocol.messageYjsSyncStep1 ) {
				this.sendEncodedMessage( encoding.toUint8Array( encoder ) );
			}

			// If we received sync step 2, we're now synced.
			if (
				syncMessageType === syncProtocol.messageYjsSyncStep2 &&
				! this.synced
			) {
				this.synced = true;
				this.emit( 'synced', [ { synced: true } ] );
			}
		}
	}

	/**
	 * Send an encoded message to the server via POST.
	 *
	 * @param data        The encoded message data
	 * @param isFullState Whether this message contains the full document state
	 */
	private sendEncodedMessage( data: Uint8Array, isFullState = false ): void {
		const payload: SyncMessagePayload = {
			client_id: this.options.doc.clientID,
			message: {
				from: this.options.doc.clientID,
				data: Array.from( data ),
				is_full_state: isFullState,
				last_message_id: this.lastMessageId,
			},
			room: this.options.room,
		};

		// Format payload for x-www-form-urlencoded
		const payloadData: Record< string, string > = {
			...payload,
			client_id: payload.client_id.toString(),
			message: JSON.stringify( payload.message ),
		};

		globalThis
			.fetch( this.options.endpoint, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'X-WP-Nonce':
						// @ts-ignore
						globalThis.__experimentalCollaborativeEditingNonce ??
						'',
				},
				body: new URLSearchParams( payloadData ),
			} )
			.catch( ( error ) => {
				this.log( 'Error sending message to server', { error } );
			} );
	}

	/**
	 * Send the full document state to the server.
	 */
	private sendFullState(): void {
		const state = Y.encodeStateAsUpdateV2( this.options.doc );
		const encoder = encoding.createEncoder();
		syncProtocol.writeUpdate( encoder, state );
		this.sendEncodedMessage( state, true );
	}

	/**
	 * Send sync step 1 (announce our state vector).
	 */
	private sendSyncStep1(): void {
		const encoder = encoding.createEncoder();
		syncProtocol.writeSyncStep1( encoder, this.options.doc );
		this.sendEncodedMessage( encoding.toUint8Array( encoder ), true );
	}
}

type CreateHttpSseProviderOptions = Omit<
	HttpSseProviderOptions,
	'doc' | 'room'
>;

/**
 * Create a provider creator function for the HttpSseProvider
 *
 * @param {CreateHttpSseProviderOptions} options Options for the HttpSseProvider excluding doc and room
 */
export function createHttpSseProvider(
	options: CreateHttpSseProviderOptions
): ProviderCreator {
	return async (
		objectType: string,
		objectId: string | null,
		doc: Y.Doc
	): Promise< ProviderCreatorResult > => {
		// Generate room name from objectType and objectId
		const room = objectId ? `${ objectType }:${ objectId }` : objectType;
		const provider = new HttpSseProvider( {
			...options,
			debug: false,
			doc,
			room,
		} );

		return {
			destroy: () => provider.destroy(),
		};
	};
}
