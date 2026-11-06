<?php
/**
 * Note notification compatibility shims for WordPress 7.2.
 *
 * @package gutenberg
 * @since   7.2.0
 */

/**
 * Unwraps the mention chips in note content.
 *
 * An @mention is stored as `<span class="wp-note-mention user-N">@Name</span>`.
 * The chip is unwrapped, opener and closer, so the name stays and the markup
 * goes. Whether a `<span>` is a chip is read from its class names, so
 * `wp-note-mention` inside another class name or in the text does not count.
 *
 * The content is parsed by the WP_HTML_Processor and written back token
 * by token without the chips, the way WP_HTML_Processor::serialize() writes a
 * document, as the HTML API has no public way to remove a tag. The rest of the
 * content therefore comes back normalized rather than byte for byte: tag names
 * in lower case, attributes double quoted, an unclosed tag closed and a stray
 * closer dropped. Text is written back with only `&`, `<` and `>` as entities,
 * which wp_specialchars_decode() turns back into the text the author typed.
 * Content the processor cannot parse to the end is returned as stored, chips
 * included, rather than cut short.
 *
 * @since 7.2.0
 *
 * @param string $content Note content, as stored.
 * @return string The content with the mention chips unwrapped.
 */
function gutenberg_unwrap_note_mentions( string $content ): string {
	if ( ! str_contains( $content, 'wp-note-mention' ) ) {
		return $content;
	}

	$processor = WP_HTML_Processor::create_fragment( $content );
	if ( null === $processor ) {
		return $content;
	}

	/*
	 * A stack of the open `<span>` elements, true for a chip, pairs each chip
	 * opener with its own closer: the processor visits the closers in nesting
	 * order and closes an unclosed element itself at the end.
	 */
	$span_stack = array();
	$unwrapped  = '';
	while ( $processor->next_token() ) {
		if ( 'SPAN' === $processor->get_tag() ) {
			if ( $processor->is_tag_closer() ) {
				$is_mention = array_pop( $span_stack );
			} else {
				$is_mention   = true === $processor->has_class( 'wp-note-mention' );
				$span_stack[] = $is_mention;
			}

			if ( true === $is_mention ) {
				continue;
			}
		}

		if ( '#text' === $processor->get_token_type() ) {
			/*
			 * The processor's own serialization also turns the quotes into
			 * entities, which wp_specialchars_decode() leaves as they are, so
			 * they would show up as entities in the email.
			 */
			$unwrapped .= htmlspecialchars( $processor->get_modifiable_text(), ENT_NOQUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8' );
			continue;
		}

		$unwrapped .= $processor->serialize_token();
	}

	// Cut short by markup the processor does not support, or by an incomplete tag.
	if ( null !== $processor->get_last_error() || $processor->paused_at_incomplete_token() ) {
		return $content;
	}

	return $unwrapped;
}

/**
 * Unwraps the mention chips in the note content of the post author's notification email.
 *
 * `wp_notify_postauthor()` composes a plain text email and places the note
 * content in it as stored, so a mail client that shows the plain text message
 * displays the mention markup literally. Once WordPress unwraps the chips
 * itself, the message no longer contains the stored content and this filter
 * leaves it unchanged.
 *
 * @since 7.2.0
 *
 * @param string     $notify_message The comment notification email text.
 * @param int|string $comment_id     Comment ID.
 * @return string The email text with the mention chips unwrapped.
 */
function gutenberg_unwrap_note_mentions_in_notification_text( $notify_message, $comment_id ) {
	$comment = get_comment( $comment_id );
	if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type ) {
		return $notify_message;
	}

	if ( ! str_contains( $comment->comment_content, 'wp-note-mention' ) ) {
		return $notify_message;
	}

	return str_replace(
		wp_specialchars_decode( $comment->comment_content ),
		wp_specialchars_decode( gutenberg_unwrap_note_mentions( $comment->comment_content ) ),
		$notify_message
	);
}
add_filter( 'comment_notification_text', 'gutenberg_unwrap_note_mentions_in_notification_text', 10, 2 );
