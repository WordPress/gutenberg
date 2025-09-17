// This version number should be incremented whenever there are breaking changes
// to Yjs doc schema or in how it is interpreted by code in the SyncConfig. This
// allows implementors to invalidate persisted CRDT docs, if any.
export const CRDT_DOC_VERSION = 1;

// Map keys in the root Yjs document.
export const CRDT_RECORD_MAP_KEY = 'document';
export const CRDT_STATE_MAP_KEY = 'state';

// Sub-keys.
export const CRDT_STATE_PERSISTED_AT_KEY = 'persistedAt';

// Origin strings.
export const LOCAL_EDITOR_ORIGIN = 'gutenberg';
export const LOCAL_SYNC_PROVIDER_ORIGIN = 'syncProvider';
export const LOCAL_ORIGINS = [
	LOCAL_EDITOR_ORIGIN,
	LOCAL_SYNC_PROVIDER_ORIGIN,
];
