/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */

/**
 * Exported copy of Yjs so that consumers of this package don't need to install it.
 */
export * as Y from 'yjs';

/**
 * Deltas are used to calculate incremental Y.Text updates.
 */
export { default as Delta } from './quill-delta/Delta';

export { AwarenessState } from './awareness/awareness-state';
export {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	CRDT_RECORD_METADATA_MAP_KEY,
	CRDT_RECORD_METADATA_SAVED_AT_KEY,
	CRDT_RECORD_METADATA_SAVED_BY_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_SYNC_MANAGER_ORIGIN,
	WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
} from './config';

export { createSyncManager } from './manager';

/**
 * Callback registered as event handler for provider 'status' events.
 */
export type { OnStateChangeCallback } from './types';

/**
 * Options passed to a provider creator function when initializing a sync provider.
 */
export type { ProviderCreatorOptions } from './types';

/**
 * Error information reported by a sync provider when a disconnection occurs.
 */
export type { SyncConnectionError } from './types';

/**
 * Current connection state of a sync provider, including status and optional error information.
 */
export type { SyncConnectionState } from './types';

/**
 * Connection status of a sync provider: either connected or disconnected.
 */
export type { SyncConnectionStatus } from './types';

/**
 * An enhanced state includes additional metadata about the user's connection
 * that is not appropriate to synchronize via Yjs awareness.
 */
export type { EnhancedState } from './awareness/awareness-types';

export type * from './types';
