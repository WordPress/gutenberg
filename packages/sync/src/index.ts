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

export {
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_SYNC_MANAGER_ORIGIN,
} from './config';
export { createSyncManager } from './manager';
export type * from './types';
