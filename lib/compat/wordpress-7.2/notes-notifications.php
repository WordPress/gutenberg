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
 * The low-level WP_HTML_Tag_Processor is used, as in
 * gutenberg_strip_inline_note_markers(): note content is user-editable, so the
 * markup is not guaranteed to be well formed, and scanning tokens degrades
 * gracefully, leaving an unbalanced or stray tag exactly as it was.
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

	// Anonymous subclass exposing token removal, which WP_HTML_Tag_Processor
	// does not provide publicly yet. Removing the current token via its bookmark
	// span unwraps the `<span>` (opener or closer) while keeping the text it
	// wraps. The redeclaration-guard sniff cannot tell these class methods from
	// global functions, so it is disabled for the class body.
	// phpcs:disable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	$processor = new class( $content ) extends WP_HTML_Tag_Processor {
		/**
		 * Removes the current token, keeping any text it wraps.
		 */
		public function remove_token(): void {
			// Always called after next_tag() returned true, so the bookmark is set.
			$this->set_bookmark( 'here' );
			$span = $this->bookmarks['here'];

			$this->lexical_updates[] = new WP_HTML_Text_Replacement( $span->start, $span->length, '' );
		}
	};
	// phpcs:enable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration

	// Walk every `<span>`, tracking mention nesting on a stack so each chip
	// opener pairs with its own closer, and unwrap only the mention chips.
	$span_stack = array();
	$query      = array(
		'tag_name'    => 'SPAN',
		'tag_closers' => 'visit',
	);
	while ( $processor->next_tag( $query ) ) {
		if ( $processor->is_tag_closer() ) {
			$is_mention = array_pop( $span_stack );
		} else {
			$is_mention   = $processor->has_class( 'wp-note-mention' );
			$span_stack[] = $is_mention;
		}

		if ( true === $is_mention ) {
			$processor->remove_token();
		}
	}

	return $processor->get_updated_html();
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
