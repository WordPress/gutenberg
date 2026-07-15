<?php
/**
 * Inline (partial-text) note support for block comments.
 *
 * Block comments (notes) shipped in WordPress 6.9; see
 * `lib/compat/wordpress-6.9/block-comments.php`. Inline notes - notes anchored
 * to a text selection within a block rather than the whole block - are a 7.1
 * addition and live here.
 *
 * An inline note's anchor is the in-content `<mark class="wp-note" data-id="N">`
 * marker alone: the `data-id` identifies the note and the marker's position
 * follows edits, so no separate selection metadata is stored. The marker is
 * kept in the raw `post_content` (and REST `raw` view) and only stripped from
 * rendered front-end output by the filter below.
 */

/**
 * Strip inline note markers from rendered block output.
 *
 * Inline notes are anchored in raw block content with
 * `<mark class="wp-note" data-id="N">…</mark>` so the marker survives edits,
 * but the public HTML should not expose note metadata. `render_block` unwraps
 * the marker entirely - dropping the `<mark>` open tag and its matching closer
 * while keeping the marked text - so nothing leaks to the front end. The raw
 * `post_content` (and the REST `raw` view, revisions, exports) keeps the marker
 * so the editor can re-attach on reload.
 *
 * Only note markers are unwrapped: `WP_HTML_Tag_Processor::has_class()` matches
 * the `wp-note` class by exact token, so a `<mark>` a user or plugin added
 * (e.g. a `core/text-color` highlight, or an unrelated `wp-note-foo` class) is
 * never flagged and survives byte-for-byte with all of its attributes intact.
 * A naive regex would be wrong here: a `\bwp-note\b` word boundary also matches
 * `wp-note-foo`, which is why the class check goes through the HTML API instead.
 *
 * The HTML API has no public token-removal method yet (it is on the roadmap:
 * https://github.com/WordPress/gutenberg/discussions/54583), so an anonymous
 * `WP_HTML_Tag_Processor` subclass unwraps each note `<mark>` and its matching
 * closer directly on the parsed token stream. Walking tokens - rather than
 * matching `<mark>` with a regex - means `</mark>`-looking text inside a comment
 * or attribute value can never be mistaken for a real tag, and a nesting stack
 * keeps each note opener paired with its own closer so overlapping notes and any
 * user highlight `<mark>` left intact still resolve correctly.
 *
 * @param string $block_content Rendered block HTML.
 * @return string Block HTML with wp-note markers unwrapped.
 */
function gutenberg_strip_inline_note_markers( $block_content ) {
	if ( ! str_contains( $block_content, 'wp-note' ) ) {
		return $block_content;
	}

	// Anonymous subclass exposing token removal, which WP_HTML_Tag_Processor
	// does not provide publicly yet. Removing the current token via its bookmark
	// span unwraps the `<mark>` (opener or closer) while keeping the text it
	// wraps. The redeclaration-guard sniff cannot tell these class methods from
	// global functions, so it is disabled for the class body.
	// phpcs:disable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	$processor = new class( $block_content ) extends WP_HTML_Tag_Processor {
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

	// Walk every `<mark>`, tracking note nesting on a stack so each note opener
	// pairs with its own closer, and unwrap only the note markers.
	$mark_stack = array();
	$query      = array(
		'tag_name'    => 'MARK',
		'tag_closers' => 'visit',
	);
	while ( $processor->next_tag( $query ) ) {
		if ( $processor->is_tag_closer() ) {
			$is_note = array_pop( $mark_stack );
		} else {
			$is_note      = $processor->has_class( 'wp-note' );
			$mark_stack[] = $is_note;
		}

		if ( true === $is_note ) {
			$processor->remove_token();
		}
	}

	return $processor->get_updated_html();
}
add_filter( 'render_block', 'gutenberg_strip_inline_note_markers' );

/**
 * Allows note mention markup in the content of `note` comments for users
 * without `unfiltered_html`.
 *
 * The notes `@` mention completer stores a mention as a link to the mentioned
 * user's author page carrying the user's ID in a class:
 * `<a class="wp-note-mention user-N" href="…">@Name</a>`. The default comment
 * kses allowlist includes `a` but only its `href` and `title` attributes, so
 * for users without `unfiltered_html` the mention classes would be stripped
 * on save.
 *
 * This callback is deliberately not attached globally: `class` attributes are
 * CSS and JavaScript selector hooks, so allowing them in every comment would
 * extend what regular (including anonymous) commenters can publish. Instead
 * gutenberg_notes_arm_mention_kses() attaches it only while
 * a `note` comment is being filtered and detaches it right after, so the
 * sanitization of other comment types is unchanged. Notes can only be written
 * by logged-in users who can edit the post, and are never rendered on the
 * front end.
 *
 * @param array|string $allowed The allowed tags structure for the context.
 * @param string       $context The kses context.
 * @return array|string Modified allowed tags structure.
 */
function gutenberg_notes_allow_mention_attributes( $allowed, $context ) {
	if ( 'pre_comment_content' !== $context || ! is_array( $allowed ) ) {
		return $allowed;
	}

	if ( ! isset( $allowed['a'] ) || ! is_array( $allowed['a'] ) ) {
		$allowed['a'] = array();
	}

	$allowed['a']['class'] = true;

	return $allowed;
}

/**
 * Arms the mention markup allowance for a single note kses pass.
 *
 * @see gutenberg_notes_allow_mention_attributes()
 */
function gutenberg_notes_arm_mention_kses() {
	add_filter( 'wp_kses_allowed_html', 'gutenberg_notes_allow_mention_attributes', 10, 2 );

	/*
	 * Disarm once this one comment's content has been filtered, so the
	 * allowance cannot apply to any later comment. PHP_INT_MAX runs after
	 * every other 'pre_comment_content' callback (wp_filter_kses at 10,
	 * wp_rel_ugc at 15, anything a plugin adds): when a callback empties its
	 * own priority bucket mid-run, WP_Hook skips the bucket that follows, so
	 * a self-removing disarm must be the final bucket or it would silently
	 * swallow the next callback.
	 */
	add_filter( 'pre_comment_content', 'gutenberg_notes_disarm_mention_kses', PHP_INT_MAX );

	/*
	 * Backstop: if the write aborts between arming and content filtering (for
	 * example a failed capability or flood check in a batched REST request),
	 * disarm at the end of the REST request so the allowance cannot leak into
	 * a later write.
	 */
	add_filter( 'rest_request_after_callbacks', 'gutenberg_notes_disarm_mention_kses' );
}

/**
 * Disarms the mention markup allowance after a note kses pass.
 *
 * Attached by gutenberg_notes_arm_mention_kses(); self-removes from both of
 * its hooks so the extended allowlist never outlives the single note write
 * that armed it.
 *
 * @param mixed $value The filtered value, passed through untouched.
 * @return mixed The unchanged value.
 */
function gutenberg_notes_disarm_mention_kses( $value = null ) {
	remove_filter( 'wp_kses_allowed_html', 'gutenberg_notes_allow_mention_attributes' );
	remove_filter( 'pre_comment_content', 'gutenberg_notes_disarm_mention_kses', PHP_INT_MAX );
	remove_filter( 'rest_request_after_callbacks', 'gutenberg_notes_disarm_mention_kses' );

	return $value;
}

/**
 * Arms the mention markup allowance when a `note` comment is inserted.
 *
 * Covers every wp_new_comment() caller; runs before wp_filter_comment()
 * sanitizes the content.
 *
 * @param array $commentdata Comment data.
 * @return array Unchanged comment data.
 */
function gutenberg_notes_scope_mention_kses( $commentdata ) {
	if ( isset( $commentdata['comment_type'] ) && 'note' === $commentdata['comment_type'] ) {
		gutenberg_notes_arm_mention_kses();
	}

	return $commentdata;
}

/**
 * Arms the mention markup allowance for REST note writes.
 *
 * Runs in WP_REST_Comments_Controller::prepare_item_for_database() for both
 * creates and updates, before the comment is sanitized. Updates do not carry
 * the comment type in the prepared data, so it is resolved from the comment
 * being updated.
 *
 * @param array           $prepared_comment Prepared comment data.
 * @param WP_REST_Request $request          The REST request.
 * @return array Unchanged prepared comment data.
 */
function gutenberg_notes_scope_mention_kses_rest( $prepared_comment, $request ) {
	$comment_type = isset( $prepared_comment['comment_type'] ) ? $prepared_comment['comment_type'] : '';

	if ( '' === $comment_type && ! empty( $request['id'] ) ) {
		$comment_type = get_comment_type( (int) $request['id'] );
	}

	if ( 'note' === $comment_type ) {
		gutenberg_notes_arm_mention_kses();
	}

	return $prepared_comment;
}

/*
 * When WordPress itself scopes the mention allowance inside
 * wp_filter_comment() (WordPress 7.1+), defer to it.
 */
if ( ! function_exists( '_wp_kses_allow_note_mention_attributes' ) ) {
	add_filter( 'preprocess_comment', 'gutenberg_notes_scope_mention_kses' );
	add_filter( 'rest_preprocess_comment', 'gutenberg_notes_scope_mention_kses_rest', 10, 2 );
}
