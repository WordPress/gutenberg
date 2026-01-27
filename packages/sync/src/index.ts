/**
 * Type definitions for Yjs.
 */
export type * as Y from 'yjs';

/**
 * Type definitions for Quill Delta.
 */
export type { default as Delta } from './quill-delta/Delta';

export type { AwarenessState } from './awareness/awareness-state';
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
export { privateApis, type SyncPrivateApis } from './private-apis';
export type * from './types';
