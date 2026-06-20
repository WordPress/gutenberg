<?php
/**
 * Block comments compatibility for WordPress 7.1.
 *
 * Extends note-related block comment functions to also handle
 * the 'reaction' comment type for emoji reactions on notes.
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
 * @param string[] $clauses The current SQL clauses for the comments query.
 * @param WP_Comment_Query $query The current comments query.
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
 * @param int|null $new     The new comment count. Default null.
 * @param int      $old     The old comment count.
 * @param int      $post_id Post ID.
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
