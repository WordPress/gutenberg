/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	type SyncPayload,
	type SyncResponse,
	type SyncUpdate,
	SyncUpdateType,
	type UpdateQueue,
} from './types';

const SYNC_API_PATH = '/wp-sync/v1/updates';

export function uint8ArrayToBase64( data: Uint8Array ): string {
	let binary = '';
	const len = data.byteLength;
	for ( let i = 0; i < len; i++ ) {
		binary += String.fromCharCode( data[ i ] );
	}
	return globalThis.btoa( binary );
}

export function base64ToUint8Array( base64: string ): Uint8Array {
	const binaryString = globalThis.atob( base64 );
	const len = binaryString.length;
	const bytes = new Uint8Array( len );
	for ( let i = 0; i < len; i++ ) {
		bytes[ i ] = binaryString.charCodeAt( i );
	}
	return bytes;
}

export function createSyncUpdate(
	data: Uint8Array,
	type: SyncUpdateType
): SyncUpdate {
	return {
		data: uint8ArrayToBase64( data ),
		type,
	};
}

export function createUpdateQueue(
	initial: SyncUpdate[] = [],
	paused = true
): UpdateQueue {
	let isPaused = paused;
	const updates: SyncUpdate[] = [ ...initial ];

	return {
		add( update: SyncUpdate ): void {
			updates.push( update );
		},
		addBulk( bulkUpdates: SyncUpdate[] ): void {
			if ( 0 === bulkUpdates.length ) {
				return;
			}

			updates.push( ...bulkUpdates );
		},
		clear(): void {
			updates.splice( 0, updates.length );
		},
		get(): SyncUpdate[] {
			if ( isPaused ) {
				return [];
			}

			// Return and clear the queue (take operation).
			// Use restore() to put updates back on failure.
			return updates.splice( 0, updates.length );
		},
		pause(): void {
			isPaused = true;
		},
		restore( restoredUpdates: SyncUpdate[] ): void {
			// Restore to front of the queue on failure. Remove compaction updates.
			const filtered = restoredUpdates.filter(
				( u ) => u.type !== SyncUpdateType.COMPACTION
			);

			if ( 0 === filtered.length ) {
				return;
			}

			updates.unshift( ...filtered );
		},
		resume(): void {
			isPaused = false;
		},
		size(): number {
			return updates.length;
		},
	};
}

/**
 * Post a sync update and receive updates the client is missing.
 *
 * @param payload The sync payload including data and after cursor
 * @return The sync server response
 */
export function postSyncUpdate(
	payload: SyncPayload
): Promise< SyncResponse > {
	return apiFetch( {
		method: 'POST',
		path: SYNC_API_PATH,
		data: payload,
	} );
}

/**
 * Fire-and-forget variant of postSyncUpdate. Uses `keepalive` so the
 * request survives page unload, and errors are silently ignored.
 *
 * @param payload The sync payload to send.
 */
export function postSyncUpdateNonBlocking( payload: SyncPayload ): void {
	if ( payload.rooms.length === 0 ) {
		return;
	}

	apiFetch( {
		method: 'POST',
		path: SYNC_API_PATH,
		data: payload,
		keepalive: true,
	} ).catch( () => {} );
}

/**
 * Parse an integer from an unknown value, returning a default if parsing fails.
 *
 * @param value        The value to parse as an integer.
 * @param defaultValue The default value to return if parsing fails.
 * @return The parsed integer or the default value.
 */
export function intValueOrDefault(
	value: unknown,
	defaultValue: number
): number {
	const intValue = parseInt( String( value ), 10 );

	return isNaN( intValue ) ? defaultValue : intValue;
}
