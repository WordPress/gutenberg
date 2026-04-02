/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const name = 'core/suggestion-delete';
const title = __( 'Suggested deletion' );

/**
 * Format type for suggested deletions.
 *
 * Unlike suggestion-insert (which is purely decoration-based and stripped
 * before serialization), suggestion-delete works via standard HTML tags.
 * The read-back injects `<del class="wp-suggestion-delete">` into block
 * attributes so that the deletion text is present for the editor to display.
 * These tags MUST survive RichText serialization so that the write-back's
 * `stripSuggestionMarkup` can strip the deletion text before writing to the
 * CRDT.
 *
 * This format type intentionally does NOT use
 * `__experimentalCreatePrepareEditableTree`. Formats added via that API are
 * stripped by `removeEditorOnlyFormats` before serialization, which would
 * remove the `<del>` tags and cause the deletion text to leak back into
 * the CRDT as new content.
 */
export const suggestionDelete = {
	name,
	title,
	tagName: 'del',
	className: 'wp-suggestion-delete',
	edit() {
		return null;
	},
};
