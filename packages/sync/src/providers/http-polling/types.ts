/**
 * Internal dependencies
 *
 * The sync protocol types are shared across transports and live in
 * `../common/types`. They are re-exported here to keep the http-polling
 * provider's public surface stable.
 */
export {
	type AwarenessState,
	type LocalAwarenessState,
	type SyncEnvelopeFromClient,
	type SyncEnvelopeFromServer,
	type SyncPayload,
	type SyncResponse,
	type SyncUpdate,
	SyncUpdateType,
	type UpdateQueue,
} from '../common/types';
