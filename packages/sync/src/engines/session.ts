/**
 * Engine session codec types.
 *
 * A session codec is the seam between a sync ENGINE (which owns the meaning
 * of update payloads) and a TRANSPORT (which owns their movement: rooms,
 * cursors, polling cadence, connection status). The engine's manager creates
 * one codec per entity/room and hands it to each transport provider; the
 * transport delegates all payload creation and interpretation to the codec
 * and treats every payload as opaque.
 *
 * Nothing in this module may reference a specific engine's types (e.g. Yjs):
 * the same transport must be able to carry any engine's payloads.
 */

/**
 * The local client's awareness state as sent to the server, or null when the
 * client is disconnecting.
 */
export type LocalAwarenessState = object | null;

/**
 * Awareness states for all clients in a room, keyed by client ID, as received
 * from the server.
 */
export type AwarenessState = Record< string, LocalAwarenessState >;

/**
 * A typed sync update as it travels over the wire: an engine-defined kind and
 * a base64-encoded payload. Transports move these without interpreting them.
 */
export interface EngineUpdate {
	/** Base64-encoded update payload. Opaque to transports. */
	data: string;

	/** Engine-defined update kind (a wire value, e.g. 'update'). */
	type: string;
}

/**
 * Listener for updates produced by local edits. The codec reports the raw
 * payload size alongside the wire-shaped update so transports can enforce
 * size limits without decoding the payload.
 */
export type EngineLocalUpdateListener = (
	update: EngineUpdate,
	sizeInBytes: number
) => void;

/**
 * A per-update outcome reported by the server for a batch this client sent
 * (e.g. an intent log's applied / escalated / voided dispositions). Opaque to
 * transports beyond this envelope shape; engines that produce none never see
 * the callback.
 */
export interface EngineDisposition {
	/** The update's engine-assigned identifier (e.g. an intent id). */
	intentId: string;

	/** Terminal outcome, engine-defined (e.g. 'applied'). */
	status: string;

	/** Engine-defined reason for non-applied outcomes. */
	reason?: string;
}

/**
 * The transport-facing session for one entity/room: creates outgoing updates,
 * interprets received ones, and encodes/applies awareness states. Created by
 * the engine (closed over its internal state — the transport never sees that
 * state) and consumed by transport providers.
 */
export interface EngineSessionCodec {
	/** Applies awareness states received from the server. */
	applyRemoteAwareness: ( state: AwarenessState ) => void;

	/**
	 * The client identifier this session announces to the server
	 * (the `client_id` wire field).
	 */
	clientId: number;

	/**
	 * Engine identity stamped on every sync request (the `engine` and
	 * `engine_protocol` wire fields) so the server can fence a stale tab
	 * speaking the wrong engine BEFORE storing any of its updates. Optional:
	 * sessions without a stamp rely on the server's room-lineage check alone,
	 * which only fences rooms that already have stored updates.
	 */
	engineSlug?: string;
	engineProtocol?: number;

	/**
	 * Creates a single update representing the full local state, replacing
	 * all prior updates (compaction-on-request).
	 */
	createCompactionUpdate: () => EngineUpdate;

	/**
	 * Creates the update the transport should send after a request whose
	 * outcome is unknown (e.g. a network timeout after a possible write).
	 * Only engines whose UPDATES ARE NOT IDEMPOTENT need this: re-sending a
	 * Yjs delta the server already stored would grow storage unboundedly, so
	 * the Yjs codec answers with a full-state compaction that safely
	 * supersedes either outcome. Engines with server-side idempotent ingest
	 * (e.g. the intent log's per-intentId dedup) OMIT this method and the
	 * transport simply re-sends the original updates.
	 */
	createRecoveryUpdate?: () => EngineUpdate;

	/**
	 * Creates a compaction by merging the given server-provided updates,
	 * preserving their operation metadata.
	 *
	 * @deprecated The server is moving towards full state updates for
	 *             compaction (`createCompactionUpdate`).
	 */
	createCompactionFromUpdates: ( updates: EngineUpdate[] ) => EngineUpdate;

	/**
	 * Detaches the transport-facing subscriptions registered via
	 * `onLocalUpdate`. Safe to call repeatedly; a subsequent
	 * `onLocalUpdate` call re-attaches (reconnection).
	 */
	destroy: () => void;

	/**
	 * Returns the updates announcing this session to a room it just joined
	 * (e.g. a state-vector announcement answered by peers with the missing
	 * state).
	 */
	getInitialUpdates: () => EngineUpdate[];

	/** Encodes the local awareness state for a sync request. */
	getLocalAwareness: () => LocalAwarenessState;

	/**
	 * Subscribes to updates produced by local edits, replacing any previous
	 * listener. Updates the engine applies via `receiveUpdate` are not
	 * reported back.
	 */
	onLocalUpdate: ( listener: EngineLocalUpdateListener ) => void;

	/**
	 * Processes one received update. May return a response update to be
	 * queued for the server (e.g. a state answer to a peer's announcement).
	 */
	receiveUpdate: ( update: EngineUpdate ) => EngineUpdate | void;

	/**
	 * Processes the server's per-update dispositions for a batch this client
	 * sent — its delivery ack. Transports MUST invoke this AFTER processing
	 * the same response's updates: rows already settle the pending state
	 * they supersede (an accepted update's authoritative form, an
	 * escalation's proposal), so the ack only settles what has no row and
	 * the session's document never regresses mid-response. Optional:
	 * engines without dispositions (e.g. the Yjs relay) omit it.
	 */
	receiveDispositions?: ( dispositions: EngineDisposition[] ) => void;
}
