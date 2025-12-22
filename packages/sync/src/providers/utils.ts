/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

export interface Message< DataType > {
	client_id: number;
	data: DataType;
	id: number;
	room: string;
	type: string;
}

export type MessagePayload< DataType > = Omit< Message< DataType >, 'id' >;

const DEFAULT_POLLING_INTERVAL_IN_MS = 250;
const MAX_BACKOFF_IN_MS = 30 * 1000; // 30 seconds

async function getMessagesFromSyncServer< DataType >(
	endpoint: string,
	clientId: number,
	room: string,
	lastSeenMessageId: number = 0
): Promise< Message< DataType >[] > {
	const url = addQueryArgs( endpoint, {
		// @ts-ignore
		_wpnonce: globalThis.__experimentalCollaborativeEditingNonce,
		client_id: clientId,
		room,
		last_seen_message_id: lastSeenMessageId,
	} );

	return await globalThis
		.fetch( url, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'X-WP-Nonce':
					// @ts-ignore
					globalThis.__experimentalCollaborativeEditingNonce,
			},
		} )
		.then( async ( response: Response ) => {
			if ( ! response.ok ) {
				throw new Error( `HTTP error! status: ${ response.status }` );
			}

			const data = await response.json();
			if (
				! Array.isArray( data.messages ) ||
				0 === data.messages.length
			) {
				return [];
			}

			const filteredMessages = data.messages.filter(
				( message: Message< DataType > ) => {
					if ( message.client_id === clientId ) {
						return false;
					}

					return true;
				}
			);

			return filteredMessages;
		} );
}

export function pollForMessagesFromSyncServer< DataType >(
	endpoint: string,
	clientId: number,
	room: string,
	onMessages: ( messages: Message< DataType >[] ) => void,
	pollInterval: number = DEFAULT_POLLING_INTERVAL_IN_MS
): () => void {
	let currentBackoff = pollInterval;
	let isPolling = true;
	let lastSeenMessageId = 0;

	async function poll() {
		if ( ! isPolling ) {
			return;
		}

		try {
			const messages = await getMessagesFromSyncServer< DataType >(
				endpoint,
				clientId,
				room,
				lastSeenMessageId
			);

			if ( messages.length > 0 ) {
				// Update lastSeenMessageId to the highest ID received
				messages.forEach( ( message ) => {
					if ( message.id > lastSeenMessageId ) {
						lastSeenMessageId = message.id;
					}
				} );

				onMessages( messages );
			}

			// Success: reset backoff to normal poll interval
			currentBackoff = pollInterval;
			setTimeout( poll, pollInterval );
		} catch ( error ) {
			// Exponential backoff on error: double the backoff time, up to max
			currentBackoff = Math.min( currentBackoff * 2, MAX_BACKOFF_IN_MS );
			setTimeout( poll, currentBackoff );
		}
	}

	void poll();

	return () => {
		isPolling = false;
	};
}

/**
 * Post a message to the sync server with retry logic.
 *
 * @param endpoint The sync server endpoint
 * @param message  The message payload
 */
export async function postMessageToSyncServer< DataType >(
	endpoint: string,
	message: MessagePayload< DataType >
): Promise< void > {
	const maxRetries = 10;
	let attempt = 0;

	while ( attempt < maxRetries ) {
		try {
			const response = await globalThis.fetch( endpoint, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce':
						// @ts-ignore
						globalThis.__experimentalCollaborativeEditingNonce,
				},
				body: JSON.stringify( message ),
			} );

			if ( ! response.ok ) {
				throw new Error( `HTTP error: ${ response.status }` );
			}

			return;
		} catch ( error ) {
			attempt++;

			if ( attempt >= maxRetries ) {
				return;
			}

			const backoffInMs = Math.min(
				100 * Math.pow( 2, attempt ),
				MAX_BACKOFF_IN_MS
			);

			await new Promise( ( resolve ) =>
				setTimeout( resolve, backoffInMs )
			);
		}
	}
}
