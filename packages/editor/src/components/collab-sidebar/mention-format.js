/**
 * WordPress dependencies
 */
import { registerFormatType, store as richTextStore } from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export const MENTION_FORMAT_NAME = 'core/note-mention';

/**
 * Registers the note mention format (idempotent).
 *
 * Mentions are stored as links carrying the mentioned user's ID, e.g.
 * `<a class="wp-note-mention" data-user-id="5" href="…">@Jane</a>`. A dedicated
 * format type, rather than the built-in `core/link`, is required so rich text
 * preserves the `data-user-id` attribute through edit and serialize
 * round-trips (`core/link` drops unknown attributes).
 */
export function registerNoteMentionFormat() {
	if ( select( richTextStore ).getFormatType( MENTION_FORMAT_NAME ) ) {
		return;
	}

	registerFormatType( MENTION_FORMAT_NAME, {
		title: __( 'Mention' ),
		tagName: 'a',
		className: 'wp-note-mention',
		interactive: true,
		attributes: {
			id: 'data-user-id',
			url: 'href',
		},
	} );
}
