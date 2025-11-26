/**
 * This version number should be incremented whenever there are breaking changes
 * to Yjs doc schema or in how it is interpreted by code in the SyncConfig. This
 * allows implementors to invalidate persisted CRDT docs.
 */
export const CRDT_DOC_VERSION = 1;

/**
 * CRDT documents can hold meta information in a map. This map exists only in
 * memory and is not synced or persisted. This key can be used to indicate that
 * a (temporary) document has been loaded from persistence.
 */
export const CRDT_DOC_META_PERSISTENCE_KEY = 'fromPersistence';

/**
 * Root-level key for the CRDT document that holds the entity record data.
 */
export const CRDT_RECORD_MAP_KEY = 'document';

/**
 * Root-level key for the CRDT document that holds the state descriptors (see
 * below).
 */
export const CRDT_STATE_MAP_KEY = 'state';

// Y.Map keys for the state map.
export const CRDT_STATE_VERSION_KEY = 'version';

/**
 * Origin string for CRDT document changes originating from the local editor.
 */
export const LOCAL_EDITOR_ORIGIN = 'gutenberg';

/**
 * Origin string for CRDT document changes originating from the sync manager.
 */
export const LOCAL_SYNC_MANAGER_ORIGIN = 'syncManager';

/**
 * WordPress meta key used to persist the CRDT document for an entity.
 */
export const WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE = '_crdt_document';
