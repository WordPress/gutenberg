/**
 * External dependencies
 */
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import type { Awareness } from 'y-protocols/awareness';
import { removeAwarenessStates } from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';

/**
 * Internal dependencies
 */
import { type AwarenessState, type SyncUpdate, SyncUpdateType } from './types';
import { base64ToUint8Array, createSyncUpdate } from './utils';

/**
 * Create a compaction update by merging existing updates. This preserves
 * the original operation metadata (client IDs, logical clocks) so that
 * Yjs deduplication works correctly when the compaction is applied.
 *
 * Deprecated: The server is moving towards full state updates for compaction.
 *
 * @param updates The updates to merge
 */
export function createDeprecatedCompactionUpdate(
	updates: SyncUpdate[]
): SyncUpdate {
	// Extract only compaction and update types for merging (skip sync-step updates).
	// Decode base64 updates to Uint8Array for merging.
	const mergeable = updates
		.filter( ( u ) =>
			[ SyncUpdateType.COMPACTION, SyncUpdateType.UPDATE ].includes(
				u.type
			)
		)
		.map( ( u ) => base64ToUint8Array( u.data ) );

	// Merge all updates while preserving operation metadata.
	return createSyncUpdate(
		Y.mergeUpdatesV2( mergeable ),
		SyncUpdateType.COMPACTION
	);
}

/**
 * Create a compaction update from the full state of a document. Used in
 * response to server compaction requests: the server replaces all prior
 * updates with the full document state.
 *
 * @param doc The Yjs document
 */
export function createCompactionUpdate( doc: Y.Doc ): SyncUpdate {
	return createSyncUpdate(
		Y.encodeStateAsUpdateV2( doc ),
		SyncUpdateType.COMPACTION
	);
}

/**
 * Create sync step 1 update (announce our state vector).
 *
 * @param doc The Yjs document
 */
export function createSyncStep1Update( doc: Y.Doc ): SyncUpdate {
	const encoder = encoding.createEncoder();
	syncProtocol.writeSyncStep1( encoder, doc );
	return createSyncUpdate(
		encoding.toUint8Array( encoder ),
		SyncUpdateType.SYNC_STEP_1
	);
}

/**
 * Create sync step 2 update (acknowledge sync step 1).
 *
 * @param doc    The Yjs document
 * @param step1  The sync step 1 update received
 * @param origin The transaction origin to tag remote changes with
 */
export function createSyncStep2Update(
	doc: Y.Doc,
	step1: Uint8Array,
	origin: unknown
): SyncUpdate {
	const decoder = decoding.createDecoder( step1 );
	const encoder = encoding.createEncoder();
	syncProtocol.readSyncMessage( decoder, encoder, doc, origin );
	return createSyncUpdate(
		encoding.toUint8Array( encoder ),
		SyncUpdateType.SYNC_STEP_2
	);
}

/**
 * Process an incoming awareness update from the server.
 *
 * @param state     The awareness state received
 * @param awareness The local Awareness instance
 * @param origin    The origin used when removing awareness states
 */
export function processAwarenessUpdate(
	state: AwarenessState,
	awareness: Awareness,
	origin: unknown
): void {
	const currentStates = awareness.getStates();
	const added = new Set< number >();
	const updated = new Set< number >();

	// Removed clients are missing from the server state.
	const removed = new Set< number >(
		Array.from( currentStates.keys() ).filter(
			( clientId ) => ! state[ clientId ]
		)
	);

	Object.entries( state ).forEach( ( [ clientIdString, awarenessState ] ) => {
		const clientId = Number( clientIdString );

		// Skip our own state (we already have it locally).
		if ( clientId === awareness.clientID ) {
			return;
		}

		// A null state should be removed by the server, but handle it here just in case.
		if ( null === awarenessState ) {
			currentStates.delete( clientId );
			removed.add( clientId );
			return;
		}

		if ( ! currentStates.has( clientId ) ) {
			currentStates.set( clientId, awarenessState );
			added.add( clientId );
			return;
		}

		const currentState = currentStates.get( clientId );

		if (
			JSON.stringify( currentState ) !== JSON.stringify( awarenessState )
		) {
			currentStates.set( clientId, awarenessState );
			updated.add( clientId );
		}
	} );

	if ( added.size + updated.size > 0 ) {
		awareness.emit( 'change', [
			{
				added: Array.from( added ),
				updated: Array.from( updated ),
				// Left blank on purpose, as the removal of clients is handled in the if condition below.
				removed: [],
			},
		] );
	}

	if ( removed.size > 0 ) {
		removeAwarenessStates( awareness, Array.from( removed ), origin );
	}
}

/**
 * Process an incoming sync / document update based on its type.
 *
 * @param update The typed update received
 * @param doc    The Yjs document
 * @param onSync Callback when sync is complete
 * @param origin The transaction origin to tag remote changes with
 * @return A response update if needed (e.g., sync_step2 in response to sync_step1)
 */
export function processDocUpdate(
	update: SyncUpdate,
	doc: Y.Doc,
	onSync: () => void,
	origin: unknown
): SyncUpdate | void {
	const data = base64ToUint8Array( update.data );

	switch ( update.type ) {
		case SyncUpdateType.SYNC_STEP_1: {
			// Respond to sync step 1 with sync step 2.
			return createSyncStep2Update( doc, data, origin );
		}

		case SyncUpdateType.SYNC_STEP_2: {
			// Apply sync step 2 (potentially contains missing updates).
			const decoder = decoding.createDecoder( data );
			const encoder = encoding.createEncoder();
			syncProtocol.readSyncMessage( decoder, encoder, doc, origin );
			onSync();
			return;
		}

		case SyncUpdateType.COMPACTION:
		case SyncUpdateType.UPDATE: {
			// Apply document update directly.
			Y.applyUpdateV2( doc, data, origin );
		}
	}
}
