/**
 * WordPress dependencies
 */
import { registerFormatType } from '@wordpress/rich-text';
import { __ } from '@wordpress/i18n';

/**
 * Inline RichText format types used by Suggest mode to render proposed text
 * changes within a block, alongside the sidebar diff summary.
 *
 * Both formats are registered without an `edit` UI so they never appear in
 * the block toolbar — they are applied programmatically by the suggest-mode
 * interceptor (see #77867 Phase B) when a user types or deletes text in
 * Suggest mode. The persisted post is unaffected: while a suggestion is
 * open the formatted value lives in the in-memory overlay (the store
 * interceptor reverts the live block attribute), and on Accept the
 * strip-runs transform removes the deletion characters and unwraps the
 * addition format before the value is written back to the block.
 *
 * `gutenberg/` rather than `core/` because these are suggest-mode-specific,
 * not a general-purpose rich-text primitive.
 */
export const SUGGESTED_DELETION_FORMAT = 'gutenberg/suggested-deletion';
export const SUGGESTED_ADDITION_FORMAT = 'gutenberg/suggested-addition';

const suggestedDeletion = {
	name: SUGGESTED_DELETION_FORMAT,
	title: __( 'Suggested deletion' ),
	tagName: 'del',
	className: 'has-suggestion-deletion',
	interactive: false,
	object: false,
	edit: () => null,
};

const suggestedAddition = {
	name: SUGGESTED_ADDITION_FORMAT,
	title: __( 'Suggested addition' ),
	tagName: 'ins',
	className: 'has-suggestion-addition',
	interactive: false,
	object: false,
	edit: () => null,
};

let registered = false;

/**
 * Idempotently register the suggest-mode inline format types. Editor
 * bootstrap, the suggest-mode tests, and any future entry points can all
 * call this without producing duplicate-format warnings.
 */
export function registerSuggestionFormats() {
	if ( registered ) {
		return;
	}
	registerFormatType( SUGGESTED_DELETION_FORMAT, suggestedDeletion );
	registerFormatType( SUGGESTED_ADDITION_FORMAT, suggestedAddition );
	registered = true;
}

// Register on module import so any code path that pulls the suggest-mode
// package (editor bootstrap, e2e harness, integration tests) ends up with
// the format types available without needing a separate init call.
registerSuggestionFormats();
