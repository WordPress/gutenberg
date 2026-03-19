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
 * Root-level key for the map that holds the entity record data.
 */
export const CRDT_RECORD_MAP_KEY = 'document';

/**
 * Root-level key for the map that holds the state information about the CRDT
 * document itself.
 */
export const CRDT_STATE_MAP_KEY = 'state';

/**
 * Y.Map key representing the timestamp of the last save operation.
 */
export const CRDT_STATE_MAP_SAVED_AT_KEY = 'savedAt';

/**
 * Y.Map key representing the Y.Doc client ID of the user who performed the last
 * save operation.
 */
export const CRDT_STATE_MAP_SAVED_BY_KEY = 'savedBy';

/**
 * Y.Map key representing the version of the CRDT document schema.
 */
export const CRDT_STATE_MAP_VERSION_KEY = 'version';

/**
 * Origin string for CRDT document changes originating from the local editor.
 */
export const LOCAL_EDITOR_ORIGIN = 'gutenberg';

/**
 * Origin string for CRDT document changes originating from the sync manager.
 */
export const LOCAL_SYNC_MANAGER_ORIGIN = 'syncManager';

/**
 * Origin string for CRDT document changes that should be synced but not
 * recorded in the undo history (e.g. status changes during publish).
 *
 * This origin is intentionally NOT included in the UndoManager's
 * `trackedOrigins`, so changes made with this origin will be applied to
 * the CRDT document (and synced to peers) without creating undo levels.
 */
export const LOCAL_UNDO_IGNORED_ORIGIN = 'gutenberg-undo-ignored';
