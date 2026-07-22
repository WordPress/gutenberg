/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const NOTE_FORMAT_NAME = 'core/note';

/*
 * Anchoring-only format: it serializes an inline note's in-content marker as
 * `<mark class="wp-note" data-id="N">`, and deliberately has no `edit`. Notes
 * are added from the block options menu (or its keyboard shortcut), which
 * creates an inline note whenever a text selection is active. A format `edit`
 * would fill `RichText.ToolbarControls`, which the format toolbar renders
 * inside the "More" (inline styles) dropdown - the wrong home for an action
 * that is neither an inline style nor exclusive to text selections.
 */
export const noteFormat = {
	title: __( 'Note' ),
	tagName: 'mark',
	className: 'wp-note',
	attributes: {
		'data-id': 'data-id',
	},
};
