<?php
/**
 * Block comments compatibility for WordPress 7.1.
 *
 * Extends note-related block comment functions to support inline note markers
 * and the 'reaction' comment type for emoji reactions on notes.
 *
 * Why a custom comment type (vs. comment meta on the parent note)?
 *
 * - Each reaction has a real author, date, and ID, so existing comment
 *   APIs handle authorship, timestamps, and deletion without bespoke code.
 *   This avoids client-side date math and timezone bugs.
 * - The type is generic ('reaction', not 'note_reaction') so it can later
 *   attach to any commentable resource (blocks, posts, other comment types),
 *   not just block notes.
 * - Race conditions when adding/removing reactions concurrently are handled
 *   by the comments table (one row per reaction) rather than by read-modify-
 *   write on a serialized meta value.
 *
 * Background discussion: https://github.com/WordPress/gutenberg/pull/75549
 * and https://github.com/WordPress/gutenberg/pull/75148.
 *
 * @package gutenberg
 */

/**
 * Strip inline note markers from rendered block output.
 *
 * Inline notes are anchored in raw block content with
 * `<mark class="wp-note" data-id="N">...</mark>` so the marker survives edits,
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
		 * Gets the span for the current token.
		 *
		 * @return WP_HTML_Span Current token span.
		 */
		private function get_span() {
			// Always called after next_tag() returned true, so the bookmark is set.
			$this->set_bookmark( 'here' );
			return $this->bookmarks['here'];
		}

		/**
		 * Removes the current token, keeping any text it wraps.
		 */
		public function remove_token() {
			$span = $this->get_span();

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
 * Returns the list of internal comment types used by core features.
 *
 * Internal comment types (currently 'note' and 'reaction') back editor
 * functionality such as block notes and emoji reactions, and should be
 * excluded from front-end comment listings, counts, and similar contexts
 * that target user discussion. Centralizing the list keeps every guard
 * in sync when new internal types are added.
 *
 * Mirrors the planned `wp_get_internal_comment_types()` core helper
 * (see https://github.com/WordPress/wordpress-develop/pull/10930).
 *
 * @since 7.1.0
 *
 * @return string[] List of internal comment type slugs.
 */
function gutenberg_get_internal_comment_types() {
	/**
	 * Filters the list of internal comment types.
	 *
	 * @since 7.1.0
	 *
	 * @param string[] $types List of internal comment type slugs.
	 */
	return apply_filters( 'gutenberg_internal_comment_types', array( 'note', 'reaction' ) );
}

/**
 * Updates the comment type for avatars to include internal comment types.
 *
 * Replaces the 6.9 implementation to also add the 'reaction' type
 * to the list of comment types for which avatars should be retrieved.
 *
 * @param array $comment_type The array of comment types.
 * @return array The updated array of comment types.
 */
function gutenberg_update_get_avatar_comment_type_7_1( $comment_type ) {
	return array_values( array_unique( array_merge( $comment_type, gutenberg_get_internal_comment_types() ) ) );
}
remove_filter( 'get_avatar_comment_types', 'update_get_avatar_comment_type' );
add_filter( 'get_avatar_comment_types', 'gutenberg_update_get_avatar_comment_type_7_1' );

/**
 * Excludes block comments and reactions from the admin comments query.
 *
 * Replaces the 6.9 implementation to also exclude 'reaction' type.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param string[]         $clauses The current SQL clauses for the comments query.
 * @param WP_Comment_Query $query   The current comments query.
 *
 * @return string[] The modified SQL clauses for the comments query.
 */
function gutenberg_exclude_block_comments_from_admin_7_1( $clauses, $query ) {
	if ( isset( $query->query_vars['type'] ) && '' === $query->query_vars['type'] ) {
		$query->set( 'type', '' );

		global $wpdb;
		$internal_types    = gutenberg_get_internal_comment_types();
		$type_placeholders = implode( ', ', array_fill( 0, count( $internal_types ), '%s' ) );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
		$clauses['where'] .= ' AND ' . $wpdb->prepare( "{$wpdb->comments}.comment_type NOT IN ( $type_placeholders )", $internal_types );
	}

	return $clauses;
}
remove_action( 'comments_clauses', 'exclude_block_comments_from_admin', 10 );
add_action( 'comments_clauses', 'gutenberg_exclude_block_comments_from_admin_7_1', 10, 2 );

/**
 * Filter the comment count query to exclude notes and reactions.
 *
 * Replaces the 6.9 implementation to also exclude 'reaction' type.
 *
 * @param string $query The SQL query string.
 * @return string The modified SQL query string.
 */
function gutenberg_filter_comment_count_query_exclude_block_comments_7_1( $query ) {
	if ( str_starts_with( $query, 'SELECT comment_post_ID, COUNT(comment_ID) as num_comments FROM' ) && str_contains( $query, 'comment_approved' ) ) {
		if ( ! str_contains( $query, "comment_type != 'note'" ) ) {
			$type_clauses = array();
			foreach ( gutenberg_get_internal_comment_types() as $internal_type ) {
				$type_clauses[] = "comment_type != '" . esc_sql( $internal_type ) . "'";
			}
			$query = str_replace( 'comment_approved', implode( ' AND ', $type_clauses ) . ' AND comment_approved', $query );
		}
	}
	return $query;
}
add_filter( 'query', 'gutenberg_filter_comment_count_query_exclude_block_comments_7_1' );

/**
 * Adjusts the comments list table query so notes and reactions never display.
 *
 * Replaces the 6.9 implementation to also handle 'reaction' type.
 *
 * @param array $args An array of get_comments() arguments.
 * @return array Possibly modified arguments for get_comments().
 */
function gutenberg_hide_note_from_comment_list_table_7_1( $args ) {
	if ( ! empty( $_REQUEST['comment_type'] ) && in_array( $_REQUEST['comment_type'], gutenberg_get_internal_comment_types(), true ) ) {
		unset( $args['type'] );
	}
	return $args;
}
add_filter( 'comments_list_table_query_args', 'gutenberg_hide_note_from_comment_list_table_7_1' );

/**
 * Override comment_count to exclude notes and reactions from the comment count.
 *
 * Replaces the 6.9 implementation to also exclude 'reaction' type.
 *
 * @param int|null $new_count The new comment count. Default null.
 * @param int      $old_count The old comment count.
 * @param int      $post_id   Post ID.
 * @return int|null The modified comment count.
 */
function gutenberg_exclude_notes_from_comment_count_7_1( $new_count, $old_count, $post_id ) {
	global $wpdb;
	if ( null !== $new_count ) {
		return $new_count;
	}
	$internal_types    = gutenberg_get_internal_comment_types();
	$type_placeholders = implode( ', ', array_fill( 0, count( $internal_types ), '%s' ) );
	$new_count         = (int) $wpdb->get_var(
		$wpdb->prepare(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"SELECT COUNT(*) FROM $wpdb->comments WHERE comment_post_ID = %d AND comment_approved = '1' AND comment_type NOT IN ( $type_placeholders )",
			array_merge( array( $post_id ), $internal_types )
		)
	);
	return $new_count;
}
add_filter( 'pre_wp_update_comment_count_now', 'gutenberg_exclude_notes_from_comment_count_7_1', 10, 3 );

/**
 * Returns the allowed emojis for note reactions.
 *
 * Each emoji is an associative array with:
 * - `emoji` (string) The emoji character.
 * - `label` (string) A translated human-readable label.
 * - `value` (string) A slug used as the storage key.
 *
 * @since 7.1.0
 *
 * @return array[] List of emoji definitions.
 */
function gutenberg_get_note_reaction_emojis() {
	$default_emojis = array(
		array(
			'emoji' => '❤️',
			'label' => __( 'Heart', 'gutenberg' ),
			'value' => 'heart',
		),
		array(
			'emoji' => '🎉',
			'label' => __( 'Celebration', 'gutenberg' ),
			'value' => 'celebration',
		),
		array(
			'emoji' => '😄',
			'label' => __( 'Smile', 'gutenberg' ),
			'value' => 'smile',
		),
		array(
			'emoji' => '👀',
			'label' => __( 'Eyes', 'gutenberg' ),
			'value' => 'eyes',
		),
		array(
			'emoji' => '🚀',
			'label' => __( 'Rocket', 'gutenberg' ),
			'value' => 'rocket',
		),
	);

	/**
	 * Filters the list of allowed emojis for note reactions.
	 *
	 * @since 7.1.0
	 *
	 * @param array[] $emojis List of emoji definitions. Each item has
	 *                        `emoji`, `label`, and `value` keys.
	 */
	return apply_filters( 'gutenberg_note_reaction_emojis', $default_emojis );
}
