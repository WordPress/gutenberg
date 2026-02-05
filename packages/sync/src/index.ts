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
 * Awareness is used to track user presence and state.
 */
export { Awareness } from 'y-protocols/awareness';

/**
 * Deltas are used to calculate incremental Y.Text updates.
 */
export { default as Delta } from './quill-delta/Delta';

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

export type * from './types';
