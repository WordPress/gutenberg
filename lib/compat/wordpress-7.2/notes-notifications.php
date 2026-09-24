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
 * goes. Everything else in the content is left as it is.
 *
 * The `<span>` openers and closers are delimited the way wp_strip_all_tags()
 * delimits a tag, and WP_HTML_Tag_Processor reads the class names of each
 * opener: it is the tag, not the string, that says whether a span is a chip, so
 * `wp-note-mention` inside another class name or in the text does not count. A
 * nesting stack pairs each chip opener with its own closer, and a closer without
 * an opener is left as it is, since note content is user-editable and not
 * guaranteed to be well formed.
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

	/*
	 * Every `<span>` opener and closer, in document order, with its offset. The
	 * Tag Processor can read a tag but neither remove one nor say where in the
	 * string it sits, so the tags are located here and only their class names
	 * are read through it.
	 */
	if ( ! preg_match_all( '#<(/?)span(?=[\s/>])[^>]*>#i', $content, $span_tags, PREG_SET_ORDER | PREG_OFFSET_CAPTURE ) ) {
		return $content;
	}

	$span_stack = array();
	$unwrapped  = '';
	$copied_to  = 0;
	foreach ( $span_tags as $span_tag ) {
		list( $tag, $at ) = $span_tag[0];

		if ( '/' === $span_tag[1][0] ) {
			$is_mention = array_pop( $span_stack );
		} else {
			$opener       = new WP_HTML_Tag_Processor( $tag );
			$is_mention   = $opener->next_tag() && $opener->has_class( 'wp-note-mention' );
			$span_stack[] = $is_mention;
		}

		if ( true === $is_mention ) {
			$unwrapped .= substr( $content, $copied_to, $at - $copied_to );
			$copied_to  = $at + strlen( $tag );
		}
	}

	return $unwrapped . substr( $content, $copied_to );
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
