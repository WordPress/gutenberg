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
 * Post-level fields the Suggest intent refuses with a field-specific message
 * and discards when staged on the way in. `status` carries editorial
 * authority, so it gets its own announcement; every other post-level field
 * that is not proposable is refused by the generic guard in
 * `suggest-post-edits.ts`. See issue #73411 (F-15).
 */
export const SUGGEST_LOCKED_POST_FIELDS = [ 'status' ] as const;

/**
 * Post edits that carry the block content rather than a post-level field.
 * Suggestion mode captures content changes as markers inside the blocks, so
 * these edits pass through to the post while suggesting; every other key of
 * the post record is either proposed or refused. See issue #73411.
 */
export const SUGGEST_CONTENT_POST_FIELDS = [
	'blocks',
	'content',
	'selection',
] as const;

/**
 * Post meta keys that are derived from the block content (footnotes are
 * written to meta by the block sync as the blocks change), so they pass
 * through like the content itself.
 */
export const SUGGEST_CONTENT_META_KEYS = [ 'footnotes' ] as const;

/**
 * Post fields Suggestion mode holds as proposals: an edit to one is kept in
 * the editor store (`postFieldProposals`), shown in place of the post's value
 * while suggesting, and saved as a note for a reviewer to accept or reject.
 * The post's taxonomies (by `rest_base`) and its registered meta keys are
 * proposable too; see `isProposablePostField`.
 */
export const SUGGEST_PROPOSABLE_POST_FIELDS = [
	'title',
	'excerpt',
	'featured_media',
	'slug',
] as const;

/**
 * Class tokens carried by inline suggestion markers in serialized block
 * content, one per marker kind (`<mark class="wp-suggestion-add">`, `-del`,
 * `-format`).
 *
 * Mirrors `SUGGESTION_CLASSES` in `components/inline-suggestions/format.ts`,
 * duplicated here because the store must not import from the component tree.
 * A serialization contract: `utils/pending-suggestion-markers.ts` reads them
 * back out of saved content, so the two copies must not drift.
 *
 * On their own the tokens are only a cheap pre-filter, never the answer -
 * they also appear in block class names and in prose about the feature. See
 * `hasPendingSuggestionMarkers` for what actually identifies a marker.
 */
export const SUGGESTION_MARKER_CLASSES: readonly string[] = [
	'wp-suggestion-add',
	'wp-suggestion-del',
	'wp-suggestion-format',
];
