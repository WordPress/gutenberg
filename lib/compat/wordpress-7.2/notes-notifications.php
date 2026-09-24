<?php
/**
 * Note notification compatibility shims for WordPress 7.2.
 *
 * @package gutenberg
 * @since   7.2.0
 */

/**
 * Reduces the stored content of a note to plain text.
 *
 * Note content is stored as HTML: an @mention is a
 * `<span class="wp-note-mention user-N">` chip around the name, a line break
 * is a `<br>`, and the note form allows a few inline formats. Emails are
 * plain text, so the line breaks become newlines, the other tags are dropped
 * and the text they wrap is kept. The tags are stripped before the entities
 * are decoded, so escaped text such as "&lt;code&gt;" survives as text rather
 * than being read as a tag and dropped.
 *
 * @since 7.2.0
 *
 * @param string $content Note content, as stored.
 * @return string The plain text of the note.
 */
function gutenberg_get_note_plain_text( string $content ): string {
	$content = (string) preg_replace( '#<br\s*/?>#i', "\n", $content );

	return wp_specialchars_decode( wp_strip_all_tags( $content ) );
}

/**
 * Replaces the note content in the post author's notification email with its plain text.
 *
 * `wp_notify_postauthor()` composes a plain text email and places the note
 * content in it as stored, so a mail client that shows the plain text message
 * displays the markup literally. Once WordPress places the plain text itself,
 * the message no longer contains the stored content and this filter leaves it
 * unchanged.
 *
 * @since 7.2.0
 *
 * @param string     $notify_message The comment notification email text.
 * @param int|string $comment_id     Comment ID.
 * @return string The email text with the note content as plain text.
 */
function gutenberg_strip_note_markup_from_notification_text( $notify_message, $comment_id ) {
	$comment = get_comment( $comment_id );
	if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type ) {
		return $notify_message;
	}

	/*
	 * Nothing to strip. This also keeps the replacement away from tag-free
	 * content, whose text could match elsewhere in the message.
	 */
	if ( ! str_contains( $comment->comment_content, '<' ) ) {
		return $notify_message;
	}

	return str_replace(
		wp_specialchars_decode( $comment->comment_content ),
		gutenberg_get_note_plain_text( $comment->comment_content ),
		$notify_message
	);
}
add_filter( 'comment_notification_text', 'gutenberg_strip_note_markup_from_notification_text', 10, 2 );
