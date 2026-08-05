/**
 * External dependencies
 */
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { Awareness, removeAwarenessStates } from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';

/**
 * Internal dependencies
 */
import type {
	AwarenessState,
	EngineLocalUpdateListener,
	EngineSessionCodec,
	EngineUpdate,
} from '../session';
import { SyncUpdateType } from '../../providers/http-polling/types';
import {
	base64ToUint8Array,
	createSyncUpdate,
} from '../../providers/http-polling/utils';

/**
 * Origin tag for Yjs transactions applied by this session, so updates the
 * session applies are not reported back as local updates. The value predates
 * the extraction of this codec from the polling transport and is retained
 * as-is; it is treated as opaque.
 */
const YJS_RELAY_SESSION_ORIGIN = 'polling-manager';

/**
 * Options for creating a Yjs relay session codec.
 */
export interface YjsSessionOptions {
	/**
	 * The awareness instance tracking collaborator presence. When omitted, a
	 * standalone instance is created so remote awareness states can still be
	 * applied.
	 */
	awareness?: Awareness;

	/** The Yjs document holding the entity state. */
	doc: Y.Doc;
}

/**
 * Create sync step 1 update (announce our state vector).
 *
 * @param doc The Yjs document
 */
function createSyncStep1Update( doc: Y.Doc ): EngineUpdate {
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
 * @param doc   The Yjs document
 * @param step1 The sync step 1 update received
 */
function createSyncStep2Update( doc: Y.Doc, step1: Uint8Array ): EngineUpdate {
	const decoder = decoding.createDecoder( step1 );
	const encoder = encoding.createEncoder();
	syncProtocol.readSyncMessage(
		decoder,
		encoder,
		doc,
		YJS_RELAY_SESSION_ORIGIN
	);
	return createSyncUpdate(
		encoding.toUint8Array( encoder ),
		SyncUpdateType.SYNC_STEP_2
	);
}

/**
 * Create a compaction update by merging existing updates. This preserves
 * the original operation metadata (client IDs, logical clocks) so that
 * Yjs deduplication works correctly when the compaction is applied.
 *
 * Deprecated: The server is moving towards full state updates for compaction.
 *
 * @param updates The updates to merge
 */
function createDeprecatedCompactionUpdate(
	updates: EngineUpdate[]
): EngineUpdate {
	// Extract only compaction and update types for merging (skip sync-step updates).
	// Decode base64 updates to Uint8Array for merging.
	const mergeable = updates
		.filter( ( u ) =>
			[
				SyncUpdateType.COMPACTION as string,
				SyncUpdateType.UPDATE as string,
			].includes( u.type )
		)
		.map( ( u ) => base64ToUint8Array( u.data ) );

	// Merge all updates while preserving operation metadata.
	return createSyncUpdate(
		Y.mergeUpdatesV2( mergeable ),
		SyncUpdateType.COMPACTION
	);
}

/**
 * Process an incoming awareness update from the server.
 *
 * @param state     The awareness state received
 * @param awareness The local Awareness instance
 */
function processAwarenessUpdate(
	state: AwarenessState,
	awareness: Awareness
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
		removeAwarenessStates(
			awareness,
			Array.from( removed ),
			YJS_RELAY_SESSION_ORIGIN
		);
	}
}

/**
 * Process an incoming sync / document update based on its type.
 *
 * @param update The typed update received
 * @param doc    The Yjs document
 * @return A response update if needed (e.g., sync_step2 in response to sync_step1)
 */
function processDocUpdate(
	update: EngineUpdate,
	doc: Y.Doc
): EngineUpdate | void {
	const data = base64ToUint8Array( update.data );

	switch ( update.type ) {
		case SyncUpdateType.SYNC_STEP_1: {
			// Respond to sync step 1 with sync step 2.
			return createSyncStep2Update( doc, data );
		}

		case SyncUpdateType.SYNC_STEP_2: {
			// Apply sync step 2 (potentially contains missing updates).
			const decoder = decoding.createDecoder( data );
			const encoder = encoding.createEncoder();
			syncProtocol.readSyncMessage(
				decoder,
				encoder,
				doc,
				YJS_RELAY_SESSION_ORIGIN
			);
			return;
		}

		case SyncUpdateType.COMPACTION:
		case SyncUpdateType.UPDATE: {
			// Apply document update directly.
			Y.applyUpdateV2( doc, data, YJS_RELAY_SESSION_ORIGIN );
		}
	}
}

/**
 * Creates the Yjs relay engine's session codec for one entity/room. The codec
 * closes over the Y.Doc and Awareness so that transports never see them: they
 * receive only wire-shaped typed updates and awareness state objects.
 *
 * @param options The Yjs document and optional awareness to wrap.
 * @return The transport-facing session codec.
 */
export function createYjsSessionCodec(
	options: YjsSessionOptions
): EngineSessionCodec {
	const { doc } = options;
	const awareness = options.awareness ?? new Awareness( doc );

	let localUpdateListener: EngineLocalUpdateListener | null = null;
	let isDocListenerAttached = false;

	function onDocUpdate( update: Uint8Array, origin: unknown ): void {
		if ( YJS_RELAY_SESSION_ORIGIN === origin ) {
			return;
		}

		// Tag local document changes as 'update' type.
		localUpdateListener?.(
			createSyncUpdate( update, SyncUpdateType.UPDATE ),
			update.byteLength
		);
	}

	return {
		applyRemoteAwareness: ( state ) =>
			processAwarenessUpdate( state, awareness ),
		clientId: doc.clientID,
		createCompactionUpdate: () =>
			createSyncUpdate(
				Y.encodeStateAsUpdateV2( doc ),
				SyncUpdateType.COMPACTION
			),
		createCompactionFromUpdates: createDeprecatedCompactionUpdate,
		destroy() {
			if ( isDocListenerAttached ) {
				doc.off( 'updateV2', onDocUpdate );
				isDocListenerAttached = false;
			}
			localUpdateListener = null;
		},
		getInitialUpdates: () => [ createSyncStep1Update( doc ) ],
		getLocalAwareness: () => awareness.getLocalState() ?? {},
		onLocalUpdate( listener ) {
			localUpdateListener = listener;
			if ( ! isDocListenerAttached ) {
				doc.on( 'updateV2', onDocUpdate );
				isDocListenerAttached = true;
			}
		},
		receiveUpdate: ( update ) => processDocUpdate( update, doc ),
	};
}
