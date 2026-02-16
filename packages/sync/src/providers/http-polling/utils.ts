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
export async function postSyncUpdate(
	payload: SyncPayload
): Promise< SyncResponse > {
	const response = await apiFetch< SyncResponse, false >( {
		body: JSON.stringify( payload ),
		headers: {
			'Content-Type': 'application/json',
		},
		method: 'POST',
		parse: false,
		path: SYNC_API_PATH,
	} );

	if ( ! response.ok ) {
		throw new Error(
			`Sync update failed with status ${ response.status }`
		);
	}

	return await response.json();
}
