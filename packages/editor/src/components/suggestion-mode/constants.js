/**
 * The editor store is referenced by its registered name rather than being
 * imported directly to avoid a module cycle between the suggestion-mode
 * subsystem, the editor store, and the editor provider (which mounts
 * `SuggestionOverlayProvider`).
 */
export const EDITOR_STORE_NAME = 'core/editor';
