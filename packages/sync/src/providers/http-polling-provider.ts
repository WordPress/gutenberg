/**
 * External dependencies
 */
import type * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import {
	applyAwarenessUpdate,
	encodeAwarenessUpdate,
} from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';

/**
 * Internal dependencies
 */
import type { ProviderCreator, ProviderCreatorResult } from '../types';
import {
	type AwarenessChanges,
	BaseProvider,
	type ProviderOptions,
} from './base-provider';
import {
	type Message,
	type MessagePayload,
	pollForMessagesFromSyncServer,
	postMessageToSyncServer,
} from './utils';

interface HttpPollingProviderOptions extends ProviderOptions {
	endpoint: string;
	pollingIntervalInMs?: number;
}

type MessageData = number[];

type MessageType = 'sync' | 'awareness';

/**
 * Yjs provider that uses HTTP SSE for real-time synchronization.
 * Unlike WebRTC, this provider communicates through a central server
 * which manages rooms and broadcasts updates to all connected clients.
 */
export class HttpPollingProvider extends BaseProvider< HttpPollingProviderOptions > {
	protected name = 'HttpPollingProvider';

	private stopPolling: () => void = () => {};
	private synced = false;

	/**
	 * Connect to the endpoint and initialize sync.
	 */
	public connect(): void {
		this.log( 'Initializing polling' );
		this.stopPolling = this.pollForMessages();

		// Send initial sync
		this.sendSyncStep1();

		this.emitStatus( 'connected' );
	}

	/**
	 * Destroy the provider and cleanup resources.
	 */
	public disconnect(): void {
		super.disconnect();

		this.stopPolling();
	}

	/**
	 * Handle awareness updates and send them to the server.
	 *
	 * @param changes The awareness changes
	 * @param origin  The origin of the update
	 */
	protected onAwarenessUpdate(
		changes: AwarenessChanges,
		origin: unknown
	): void {
		if ( this === origin ) {
			return;
		}

		const changedClients = changes.added
			.concat( changes.updated )
			.concat( changes.removed );

		if ( changedClients.length === 0 ) {
			return;
		}

		this.log( 'Sending awareness update', { changedClients } );

		const update = encodeAwarenessUpdate( this.awareness, changedClients );

		this.sendEncodedMessage( update, 'awareness' );
	}

	/**
	 * Handle document updates and send them to the server.
	 *
	 * @param update The document update
	 * @param origin The origin of the update
	 */
	protected onDocUpdate( update: Uint8Array, origin: unknown ): void {
		if ( this === origin ) {
			return;
		}

		const encoder = encoding.createEncoder();
		syncProtocol.writeUpdate( encoder, update );

		this.sendEncodedMessage( encoding.toUint8Array( encoder ), 'sync' );
	}

	private pollForMessages(): () => void {
		return pollForMessagesFromSyncServer< number[] >(
			this.options.endpoint,
			this.options.doc.clientID,
			this.options.room,
			( messages ) => {
				messages.forEach( ( message: Message< MessageData > ) => {
					this.processMessage( message );
				} );
			},
			this.options.pollingIntervalInMs
		);
	}

	/**
	 * Process incoming messages from the server
	 *
	 * @param {Message< MessageData >} message The incoming sync message
	 */
	private processMessage( message: Message< MessageData > ): void {
		this.log( 'Handling incoming message', {
			messageId: message.id,
			type: message.type,
		} );

		if ( ! message.data ) {
			return;
		}

		const data = new Uint8Array( message.data );

		// Handle awareness messages
		if ( message.type === 'awareness' ) {
			this.log( 'Applying awareness update' );
			applyAwarenessUpdate( this.awareness, data, this );
			return;
		}

		// Handle sync messages
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
			this.sendEncodedMessage( encoding.toUint8Array( encoder ), 'sync' );
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

	/**
	 * Send an encoded message to the server via POST.
	 *
	 * @param data The encoded message data
	 * @param type The message type ('sync' or 'awareness')
	 */
	private sendEncodedMessage(
		data: Uint8Array,
		type: MessageType = 'sync'
	): void {
		const payload: MessagePayload< MessageData > & { type: MessageType } = {
			client_id: this.options.doc.clientID,
			data: Array.from( data ),
			room: this.options.room,
			type,
		};

		void postMessageToSyncServer< MessageData >(
			this.options.endpoint,
			payload
		);
	}

	/**
	 * Send sync step 1 (announce our state vector).
	 */
	private sendSyncStep1(): void {
		const encoder = encoding.createEncoder();
		syncProtocol.writeSyncStep1( encoder, this.options.doc );
		this.sendEncodedMessage( encoding.toUint8Array( encoder ), 'sync' );
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
