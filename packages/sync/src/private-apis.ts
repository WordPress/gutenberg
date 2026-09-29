import {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
} from './config';
import { ConnectionError, ConnectionErrorCode } from './errors';
import {
	getEngineAdapters,
	registerSyncEngine,
	resetEngineAdaptersForTesting,
	resolveEngineAdapter,
} from './engines';
import {
	getProviderCreators,
	registerSyncTransport,
	resetProviderCreatorsForTesting,
} from './providers';
import { lock } from './lock-unlock';
import { createSyncManager } from './manager';
import { default as Delta } from './quill-delta/Delta';

export const privateApis = {};

lock( privateApis, {
	ConnectionErrorCode,
	/**
	 * The engine-neutral sync manager shell. Engine plugins compose it with
	 * their own engine — `createSyncManager( engine, { debug } )` — inside an
	 * adapter's `createManager`. Prefer `resolveEngineAdapter()` to obtain the
	 * server-announced manager; constructing one directly bypasses the engine
	 * mismatch check.
	 */
	createSyncManager,
	resolveEngineAdapter,
	// The engines plugin registers its adapters and transports through
	// these, and drives its managers/providers through the shared registry
	// + error type (see the Gutenberg Sync Engines plugin).
	registerSyncEngine,
	registerSyncTransport,
	getProviderCreators,
	ConnectionError,
	// Test-support: engine/transport plugins reset the shared registries and
	// assert registration state between their own unit tests.
	getEngineAdapters,
	resetEngineAdaptersForTesting,
	resetProviderCreatorsForTesting,
	Delta,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
} );
