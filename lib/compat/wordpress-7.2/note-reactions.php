<?php
/**
 * Emoji reactions on block comments (notes) for WordPress 7.2.
 *
 * Extends note-related block comment functions to support the 'reaction'
 * comment type used for emoji reactions on notes.
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
 * @since   7.2.0
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
 * @since 7.2.0
 *
 * @return string[] List of internal comment type slugs.
 */
function gutenberg_get_internal_comment_types() {
	/**
	 * Filters the list of internal comment types.
	 *
	 * @since 7.2.0
	 *
	 * @param string[] $types List of internal comment type slugs.
	 */
	$types = apply_filters( 'gutenberg_internal_comment_types', array( 'note', 'reaction' ) );

	// Callers build `NOT IN ( ... )` from this list, which is invalid SQL when empty.
	if ( ! is_array( $types ) || empty( $types ) ) {
		return array( 'note', 'reaction' );
	}

	return array_values( $types );
}

/**
 * Updates the comment type for avatars to include internal comment types.
 *
 * Adds the 'reaction' type to core's default 'comment' and 'note' avatar
 * comment types.
 *
 * @param array $comment_type The array of comment types.
 * @return array The updated array of comment types.
 */
function gutenberg_update_get_avatar_comment_type_7_2( $comment_type ) {
	return array_values( array_unique( array_merge( $comment_type, gutenberg_get_internal_comment_types() ) ) );
}
add_filter( 'get_avatar_comment_types', 'gutenberg_update_get_avatar_comment_type_7_2' );

/**
 * Excludes notes and reactions from comment queries that request no
 * specific type.
 *
 * Core's WP_Comment_Query already excludes 'note'; this also excludes
 * 'reaction'.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param string[]         $clauses The current SQL clauses for the comments query.
 * @param WP_Comment_Query $query   The current comments query.
 *
 * @return string[] The modified SQL clauses for the comments query.
 */
function gutenberg_exclude_block_comments_from_admin_7_2( $clauses, $query ) {
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
add_action( 'comments_clauses', 'gutenberg_exclude_block_comments_from_admin_7_2', 10, 2 );

/**
 * Excludes internal comment types from comment feeds.
 *
 * WP_Query builds the comment feed SQL directly (not via WP_Comment_Query)
 * and only hardcodes the 'note' exclusion, so reactions would otherwise
 * appear in public comment feeds.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param string $cwhere The WHERE clause of the comment feed query.
 * @return string The modified WHERE clause.
 */
function gutenberg_exclude_internal_comment_types_from_feed_7_2( $cwhere ) {
	global $wpdb;
	$internal_types    = gutenberg_get_internal_comment_types();
	$type_placeholders = implode( ', ', array_fill( 0, count( $internal_types ), '%s' ) );
	// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
	return $cwhere . ' AND ' . $wpdb->prepare( "{$wpdb->comments}.comment_type NOT IN ( $type_placeholders )", $internal_types );
}
add_filter( 'comment_feed_where', 'gutenberg_exclude_internal_comment_types_from_feed_7_2' );

/**
 * Filter the comment count query to exclude notes and reactions.
 *
 * Core hardcodes the 'note' exclusion in this query; this also excludes
 * 'reaction'.
 *
 * @param string $query The SQL query string.
 * @return string The modified SQL query string.
 */
function gutenberg_filter_comment_count_query_exclude_block_comments_7_2( $query ) {
	if ( str_starts_with( $query, 'SELECT comment_post_ID, COUNT(comment_ID) as num_comments FROM' ) && str_contains( $query, 'comment_approved' ) ) {
		// Add an exclusion clause for each internal type not already present.
		// Core's query already hardcodes the note-only exclusion, so expanding
		// per type - rather than bailing when any exclusion exists - ensures
		// reactions are excluded too and keeps the filter idempotent if it
		// runs more than once.
		$type_clauses = array();
		foreach ( gutenberg_get_internal_comment_types() as $internal_type ) {
			$clause = "comment_type != '" . esc_sql( $internal_type ) . "'";
			if ( ! str_contains( $query, $clause ) ) {
				$type_clauses[] = $clause;
			}
		}
		if ( ! empty( $type_clauses ) ) {
			$query = str_replace( 'comment_approved', implode( ' AND ', $type_clauses ) . ' AND comment_approved', $query );
		}
	}
	return $query;
}
add_filter( 'query', 'gutenberg_filter_comment_count_query_exclude_block_comments_7_2' );

/**
 * Adjusts the comments list table query so notes and reactions never display.
 *
 * Extends core's 'note' guard in WP_Comments_List_Table to the 'reaction'
 * type.
 *
 * @param array $args An array of get_comments() arguments.
 * @return array Possibly modified arguments for get_comments().
 */
function gutenberg_hide_note_from_comment_list_table_7_2( $args ) {
	if ( ! empty( $_REQUEST['comment_type'] ) && in_array( $_REQUEST['comment_type'], gutenberg_get_internal_comment_types(), true ) ) {
		unset( $args['type'] );
	}
	return $args;
}
add_filter( 'comments_list_table_query_args', 'gutenberg_hide_note_from_comment_list_table_7_2' );

/**
 * Override comment_count to exclude notes and reactions from the comment count.
 *
 * Core's default count excludes only 'note'; this also excludes 'reaction'.
 *
 * @param int|null $new_count The new comment count. Default null.
 * @param int      $old_count The old comment count.
 * @param int      $post_id   Post ID.
 * @return int|null The modified comment count.
 */
function gutenberg_exclude_notes_from_comment_count_7_2( $new_count, $old_count, $post_id ) {
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
add_filter( 'pre_wp_update_comment_count_now', 'gutenberg_exclude_notes_from_comment_count_7_2', 10, 3 );

/**
 * Returns the named emojis for note reactions.
 *
 * @since 7.2.0
 *
 * @return array[] List of emoji definitions, each with `emoji`, `label`,
 *                 and `value` keys.
 */
function gutenberg_get_note_reaction_emojis() {
	return array(
		array(
			'emoji' => '❤️',
			'label' => _x( 'Heart', 'emoji reaction', 'gutenberg' ),
			'value' => 'heart',
		),
		array(
			'emoji' => '🎉',
			'label' => _x( 'Celebration', 'emoji reaction', 'gutenberg' ),
			'value' => 'celebration',
		),
		array(
			'emoji' => '😄',
			'label' => _x( 'Smile', 'emoji reaction', 'gutenberg' ),
			'value' => 'smile',
		),
		array(
			'emoji' => '👀',
			'label' => _x( 'Eyes', 'emoji reaction', 'gutenberg' ),
			'value' => 'eyes',
		),
		array(
			'emoji' => '🚀',
			'label' => _x( 'Rocket', 'emoji reaction', 'gutenberg' ),
			'value' => 'rocket',
		),
	);
}

/**
 * Returns the reaction children of a note.
 *
 * @since 7.2.0
 *
 * @param WP_Comment $note   The note whose reactions to fetch.
 * @param string     $status Comment status to match. Default 'any', which
 *                           includes trashed reactions.
 * @return int[] Reaction comment IDs.
 */
function gutenberg_get_note_reaction_ids( $note, $status = 'any' ) {
	return get_comments(
		array(
			'parent'  => $note->comment_ID,
			'type'    => 'reaction',
			'status'  => $status,
			'fields'  => 'ids',
			'orderby' => 'comment_ID',
		)
	);
}

/**
 * Permanently deletes a note's reactions along with the note.
 *
 * `wp_delete_comment()` reparents a deleted comment's children one level up
 * rather than deleting them, so reactions would otherwise survive their note
 * as approved, orphaned rows still carrying the reactor's identity. Core
 * cascades only `note` children (see `wp_trash_comment()`), so reactions need
 * their own cascade.
 *
 * Runs on `delete_comment`, which fires before the reparenting query.
 *
 * @since 7.2.0
 *
 * @param string     $comment_id The comment ID as a numeric string.
 * @param WP_Comment $comment    The comment being deleted.
 */
function gutenberg_delete_note_reactions( $comment_id, $comment ) {
	if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type ) {
		return;
	}

	// Every status: trashing the note, or a REST delete without `force`,
	// leaves reactions in the trash.
	foreach ( gutenberg_get_note_reaction_ids( $comment ) as $reaction_id ) {
		wp_delete_comment( $reaction_id, true );
	}
}
add_action( 'delete_comment', 'gutenberg_delete_note_reactions', 10, 2 );

/**
 * Trashes a note's reactions along with the note.
 *
 * Core cascades a trashed note to its `note` children only, so reactions
 * would otherwise stay approved under a trashed note. Replies are covered
 * because core trashes each one, which fires this action again.
 *
 * @since 7.2.0
 *
 * @param string     $comment_id The comment ID as a numeric string.
 * @param WP_Comment $comment    The trashed comment.
 */
function gutenberg_trash_note_reactions( $comment_id, $comment ) {
	if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type ) {
		return;
	}

	// Flag each one so restoring the note brings back only these, not
	// reactions already in the trash (a REST delete without `force`).
	foreach ( gutenberg_get_note_reaction_ids( $comment, 'approve' ) as $reaction_id ) {
		if ( wp_trash_comment( $reaction_id ) ) {
			add_comment_meta( $reaction_id, '_wp_trash_meta_with_note', '1', true );
		}
	}
}
add_action( 'trashed_comment', 'gutenberg_trash_note_reactions', 10, 2 );

/**
 * Restores a note's reactions along with the note.
 *
 * The counterpart to gutenberg_trash_note_reactions(): only reactions
 * flagged as trashed along with the note come back. Ones already in the
 * trash beforehand stay there.
 *
 * @since 7.2.0
 *
 * @param string     $comment_id The comment ID as a numeric string.
 * @param WP_Comment $comment    The untrashed comment.
 */
function gutenberg_untrash_note_reactions( $comment_id, $comment ) {
	if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type ) {
		return;
	}

	foreach ( gutenberg_get_note_reaction_ids( $comment, 'trash' ) as $reaction_id ) {
		if ( get_comment_meta( $reaction_id, '_wp_trash_meta_with_note', true ) ) {
			wp_untrash_comment( $reaction_id );
		}
	}
}
add_action( 'untrashed_comment', 'gutenberg_untrash_note_reactions', 10, 2 );

/**
 * Clears the flag gutenberg_trash_note_reactions() sets, however a comment
 * leaves the trash, so a later note restore can't resurrect it.
 *
 * @since 7.2.0
 *
 * @param string     $comment_id The comment ID as a numeric string.
 * @param WP_Comment $comment    The untrashed comment.
 */
function gutenberg_clear_note_reaction_trash_flag( $comment_id, $comment ) {
	if ( ! $comment instanceof WP_Comment || 'reaction' !== $comment->comment_type ) {
		return;
	}

	delete_comment_meta( $comment_id, '_wp_trash_meta_with_note' );
}
add_action( 'untrashed_comment', 'gutenberg_clear_note_reaction_trash_flag', 5, 2 );
