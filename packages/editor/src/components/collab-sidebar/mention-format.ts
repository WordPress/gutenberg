/**
 * WordPress dependencies
 */
import {
	registerFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export const MENTION_FORMAT_NAME = 'core/note-mention';

/**
 * Registers the note mention format (idempotent).
 *
 * Mentions are stored as spans carrying the mentioned user's ID in a class,
 * e.g. `<span class="wp-note-mention user-5">@Jane</span>` - a mention marks
 * a person rather than offering navigation, so it is deliberately not a link.
 * A dedicated format type is required so rich text preserves the `user-N`
 * class through edit and serialize round-trips; mapping `class` as a format
 * attribute (the `core/text-color` pattern) keeps classes beyond the format's
 * own `wp-note-mention`.
 */
export function registerNoteMentionFormat() {
	if ( select( richTextStore ).getFormatType( MENTION_FORMAT_NAME ) ) {
		return;
	}

	registerFormatType( MENTION_FORMAT_NAME, {
		title: __( 'Mention' ),
		tagName: 'span',
		className: 'wp-note-mention',
		interactive: false,
		attributes: {
			class: 'class',
		},
	} );
}
