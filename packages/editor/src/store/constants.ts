/**
 * Set of post properties for which edits should assume a merging behavior,
 * assuming an object value.
 *
 * @type {Set}
 */
export const EDIT_MERGE_PROPERTIES = new Set( [ 'meta' ] );

/**
 * Constant for the store module (or reducer) key.
 */
export const STORE_NAME = 'core/editor';

export const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;
export const ONE_MINUTE_IN_MS = 60 * 1000;
export const AUTOSAVE_PROPERTIES = [ 'title', 'excerpt', 'content' ];
export const TEMPLATE_PART_AREA_DEFAULT_CATEGORY = 'uncategorized';
export const TEMPLATE_POST_TYPE = 'wp_template';
export const TEMPLATE_PART_POST_TYPE = 'wp_template_part';
export const PATTERN_POST_TYPE = 'wp_block';
export const NAVIGATION_POST_TYPE = 'wp_navigation';
export const ATTACHMENT_POST_TYPE = 'attachment';
export const TEMPLATE_ORIGINS = {
	custom: 'custom',
	theme: 'theme',
	plugin: 'plugin',
};
export const TEMPLATE_POST_TYPES = [ 'wp_template', 'wp_template_part' ];
export const GLOBAL_POST_TYPES = [
	...TEMPLATE_POST_TYPES,
	'wp_block',
	'wp_navigation',
];
export const DESIGN_POST_TYPES = [
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	NAVIGATION_POST_TYPE,
];

/**
 * Editor intent values. The intent represents the user's current editing
 * purpose (edit the post directly, suggest changes, or view in read-only).
 *
 * Mostly orthogonal to the `editorMode` preference (visual vs. code). The
 * exception is `suggest`, which always reports `visual`: the code editor
 * hands back raw `post_content` with nowhere to carry an inline marker, so
 * `getEditorMode` masks the preference rather than changing it, and the
 * user's stored mode returns with the `edit` intent.
 *
 * Because `suggest` is visual-only it also depends on the visual editor
 * being available at all: `setEditorIntent` refuses it when the
 * `richEditingEnabled` setting is off (the "Disable the visual editor when
 * writing" profile option), and the intent menu offers it disabled with a
 * pointer to that setting.
 *
 * Storage and defaults:
 *   - Session-scoped: held in the editor store's reducer, not the
 *     preferences store, so reloading the editor always returns to the
 *     default `edit` intent.
 *   - The private `getEditorIntent` selector falls back to
 *     `EDITOR_INTENT_EDIT` when no value is set, so consumers can rely on
 *     a non-null result.
 *
 * Suggest Mode context:
 * Phase 1 of the Suggest Mode feature only wires the intent state and the
 * UI surface (menu + keyboard shortcuts). Subsequent phases use the
 * `suggest` intent to capture edits as in-memory overlays, render them as
 * suggestions, and let other users apply or reject them. Adding a new
 * intent here also requires updates to:
 *   - packages/editor/src/components/intent-switcher/index.tsx (UI choices)
 *   - packages/editor/src/components/global-keyboard-shortcuts/* (shortcut
 *     registration and dispatch)
 */
export const EDITOR_INTENT_EDIT = 'edit';
export const EDITOR_INTENT_SUGGEST = 'suggest';
export const EDITOR_INTENT_VIEW = 'view';
export const EDITOR_INTENTS = [
	EDITOR_INTENT_EDIT,
	EDITOR_INTENT_SUGGEST,
	EDITOR_INTENT_VIEW,
] as const;
export type EditorIntent = ( typeof EDITOR_INTENTS )[ number ];

/**
 * Post-level fields the Suggest intent refuses to edit because there is no way
 * to hold them as a pending proposal: they are not part of the block tree, so
 * nothing can carry a marker for them and nothing can review them later. Only
 * `status` is listed for now — it is the field that carries editorial
 * authority. The rest of the post-level fields (title, excerpt, featured image)
 * still need a per-field capture-or-disable decision. See issue #73411 (F-15).
 */
export const SUGGEST_LOCKED_POST_FIELDS = [ 'status' ] as const;

/**
 * Class token carried by an inline suggestion marker
 * (`<mark class="wp-suggestion">`) in serialized block content.
 *
 * Mirrors `SUGGESTION_CLASS` in `components/inline-suggestions/format.js`,
 * duplicated here because the store must not import from the component tree.
 * A serialization contract: `utils/pending-suggestion-markers.js` reads it back
 * out of saved content, so the two copies must not drift.
 *
 * On its own the token is only a cheap pre-filter, never the answer - it also
 * appears in block class names and in prose about the feature. See
 * `hasPendingSuggestionMarkers` for what actually identifies a marker.
 */
export const SUGGESTION_MARKER_CLASS = 'wp-suggestion';
