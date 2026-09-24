<?php
/**
 * Note notification compatibility shims for WordPress 7.2.
 *
 * @package gutenberg
 */

/**
 * Reduces the note content in the post author's notification email to its text.
 *
 * `wp_notify_postauthor()` composes a plain text email and places the note
 * content in it as stored, and note content is HTML: an @mention is a
 * `<span class="wp-note-mention user-N">` chip around the name, and the note
 * form allows a few inline formats. Mail clients that show the plain text
 * message display that markup literally. This filter replaces the stored
 * content in the message with its text, the same way the mention notification
 * composes its message.
 *
 * Once WordPress reduces the note content to its text itself, its message no
 * longer contains the stored content and this filter leaves it unchanged.
 *
 * @param string     $notify_message The comment notification email text.
 * @param int|string $comment_id     Comment ID.
 * @return string The email text, with the note content reduced to its text.
 */
function gutenberg_strip_note_markup_from_notification_text( $notify_message, $comment_id ) {
	if ( ! is_string( $notify_message ) ) {
		return $notify_message;
	}

	$comment = get_comment( $comment_id );
	if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type ) {
		return $notify_message;
	}

	/*
	 * The tags are stripped before the entities are decoded, so escaped text
	 * such as "&lt;code&gt;" survives as text rather than being read as a tag
	 * and dropped.
	 */
	$content = wp_specialchars_decode( $comment->comment_content );
	$text    = wp_specialchars_decode( wp_strip_all_tags( $comment->comment_content ) );
	if ( $text === $content ) {
		return $notify_message;
	}

	return str_replace( $content, $text, $notify_message );
}
add_filter( 'comment_notification_text', 'gutenberg_strip_note_markup_from_notification_text', 10, 2 );
