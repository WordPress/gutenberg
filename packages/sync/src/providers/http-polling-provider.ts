/**
 * External dependencies
 */
import type * as Y from 'yjs';
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

interface HttpPollingProviderOptions {
	debug?: boolean;
	doc: Y.Doc;
	endpoint: string;
	pollingIntervalInMs?: number;
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

const DEFAULT_POLLING_INTERVAL_IN_MS = 200;

/**
 * Yjs provider that uses HTTP SSE for real-time synchronization.
 * Unlike WebRTC, this provider communicates through a central server
 * which manages rooms and broadcasts updates to all connected clients.
 */
export class HttpPollingProvider extends Observable< string > {
	private options: HttpPollingProviderOptions;

	private lastMessageId = 0;
	private seenMessages = new Set< number >();
	private synced = false;

	private pollingTimeout?: NodeJS.Timeout;

	public constructor( options: HttpPollingProviderOptions ) {
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
		this.log( 'Initializing polling' );
		this.pollForMessages();

		// Send initial sync
		this.sendSyncStep1();

		this.emitStatus( 'connected' );
	}

	/**
	 * Destroy the provider and cleanup resources.
	 */
	public destroy(): void {
		this.log( 'Disconnecting' );

		this.emitStatus( 'disconnected' );
		this.options.doc.off( 'update', this.onDocUpdate );

		clearInterval( this.pollingTimeout );

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
			console.log( `[HttpPollingProvider]: ${ message }`, {
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

	/* END bound arrow functions */

	private pollForMessages(): void {
		clearTimeout( this.pollingTimeout );

		const url = addQueryArgs( this.options.endpoint, {
			// @ts-ignore
			_wpnonce: globalThis.__experimentalCollaborativeEditingNonce ?? '',
			client_id: this.options.doc.clientID,
			last_message_id: this.lastMessageId,
			room: this.options.room,
		} );

		globalThis
			.fetch( url, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'X-WP-Nonce':
						// @ts-ignore
						globalThis.__experimentalCollaborativeEditingNonce ??
						'',
				},
			} )
			.then( async ( response: Response ) => {
				if ( ! response.ok ) {
					throw new Error(
						`HTTP error! status: ${ response.status }`
					);
				}

				const data = await response.json();
				if ( Array.isArray( data.messages ) ) {
					data.messages.forEach( ( message: SyncMessage ) => {
						this.processMessage( message );
					} );
				}
			} )
			.catch( ( error ) => {
				this.log( 'Polling error', { error } );
			} );

		this.pollingTimeout = setTimeout(
			this.pollForMessages.bind( this ),
			this.options.pollingIntervalInMs ?? DEFAULT_POLLING_INTERVAL_IN_MS
		);
	}

	/**
	 * Process incoming messages from the server
	 *
	 * @param {SyncMessage} message The incoming sync message
	 */
	private processMessage( message: SyncMessage ): void {
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
	 * Send sync step 1 (announce our state vector).
	 */
	private sendSyncStep1(): void {
		const encoder = encoding.createEncoder();
		syncProtocol.writeSyncStep1( encoder, this.options.doc );
		this.sendEncodedMessage( encoding.toUint8Array( encoder ), true );
	}
}

type CreateHttpPollingProviderOptions = Omit<
	HttpPollingProviderOptions,
	'doc' | 'room'
>;

/**
 * Create a provider creator function for the HttpPollingProvider
 *
 * @param {CreateHttpPollingProviderOptions} options Options for the HttpPollingProvider excluding doc and room
 */
export function createHttpPollingProvider(
	options: CreateHttpPollingProviderOptions
): ProviderCreator {
	return async (
		objectType: string,
		objectId: string | null,
		doc: Y.Doc
	): Promise< ProviderCreatorResult > => {
		// Generate room name from objectType and objectId
		const room = objectId ? `${ objectType }:${ objectId }` : objectType;
		const provider = new HttpPollingProvider( {
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
