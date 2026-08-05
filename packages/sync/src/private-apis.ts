/**
 * Internal dependencies
 */
import {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
} from './config';
import { ConnectionErrorCode } from './errors';
import { resolveEngineAdapter } from './engines';
import { lock } from './lock-unlock';
import { createSyncManager } from './manager';
import { pollingManager } from './providers/http-polling/polling-manager';
import { default as Delta } from './quill-delta/Delta';

export const privateApis = {};

lock( privateApis, {
	ConnectionErrorCode,
	/**
	 * @deprecated Resolve the manager through `resolveEngineAdapter()` so the
	 *             server-announced engine handshake is honored; direct
	 *             construction bypasses the engine mismatch check.
	 */
	createSyncManager,
	resolveEngineAdapter,
	Delta,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
	retrySyncConnection: () => pollingManager.retryNow(),
} );
