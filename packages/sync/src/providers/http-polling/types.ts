/**
 * Internal dependencies
 */
import type {
	AwarenessState,
	EngineDisposition,
	EngineUpdate,
	LocalAwarenessState,
} from '../../engines/session';

export type { AwarenessState, LocalAwarenessState };

/**
 * Update types of the Yjs relay engine (see engines/yjs-relay):
 * - sync_step1: State vector announcement
 * - sync_step2: Acknowledgment, missing updates response
 * - update: Regular document update (persisted until save)
 * - compaction: Merged updates using Y.mergeUpdates replacing all prior updates
 *
 * The transport does not interpret these; it moves typed updates opaquely.
 */
export enum SyncUpdateType {
	COMPACTION = 'compaction',
	SYNC_STEP_1 = 'sync_step1',
	SYNC_STEP_2 = 'sync_step2',
	UPDATE = 'update',
}

/**
 * A typed update on the wire. The engine-defined `type` and base64 `data`
 * are opaque to the transport.
 */
export type SyncUpdate = EngineUpdate;

interface SyncEnvelopeFromClient {
	after: number;
	awareness: LocalAwarenessState;
	client_id: number;
	/**
	 * Engine identity stamp (see EngineSessionCodec.engineSlug): lets the
	 * server fence a stale tab speaking the wrong engine with a 409 before
	 * storing any of its updates.
	 */
	engine?: string;
	engine_protocol?: number;
	/** Sync-inspector opt-in: ask the engine for a `_debug` envelope. */
	debug?: boolean;
	room: string;
	updates: SyncUpdate[];
}

interface SyncEnvelopeFromServer {
	/** Engine diagnostics, present only when the request opted in. */
	_debug?: Record< string, unknown >;
	awareness: AwarenessState;
	compaction_request?: SyncUpdate[]; // deprecated
	dispositions?: EngineDisposition[];
	end_cursor: number; // use as `after` in next request
	should_compact?: boolean;
	room: string;
	updates: SyncUpdate[];
}

export interface SyncPayload {
	rooms: SyncEnvelopeFromClient[];
}

export interface SyncResponse {
	rooms: SyncEnvelopeFromServer[];
}

export interface UpdateQueue {
	add: ( update: SyncUpdate ) => void;
	addBulk: ( updates: SyncUpdate[] ) => void;
	clear: () => void;
	get: () => SyncUpdate[];
	pause: () => void;
	peek: () => SyncUpdate[];
	restore: ( updates: SyncUpdate[] ) => void;
	restoreExact: ( updates: SyncUpdate[] ) => void;
	resume: () => void;
	size: () => number;
	take: ( count: number ) => SyncUpdate[];
}
