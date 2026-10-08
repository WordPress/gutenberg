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
 * Updates the comment type for avatars to include internal comment types.
 *
 * Adds the 'reaction' type to core's default 'comment' and 'note' avatar
 * comment types.
 *
 * @param array $comment_type The array of comment types.
 * @return array The updated array of comment types.
 */
function gutenberg_update_get_avatar_comment_type_7_2( $comment_type ) {
	return array_values( array_unique( array_merge( $comment_type, array( 'note', 'reaction' ) ) ) );
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
		$internal_types    = array( 'note', 'reaction' );
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
	$internal_types    = array( 'note', 'reaction' );
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
		foreach ( array( 'note', 'reaction' ) as $internal_type ) {
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
	if ( ! empty( $_REQUEST['comment_type'] ) && in_array( $_REQUEST['comment_type'], array( 'note', 'reaction' ), true ) ) {
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
	$internal_types    = array( 'note', 'reaction' );
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
 * Normalizes an emoji hex key to the form reactions are stored under.
 *
 * Lowercases the code points, pads each to four digits and drops U+FE0F, so
 * `2764-FE0F`, `2764` and `2764-fe0f` all become `2764`.
 *
 * @since 7.2.0
 *
 * @param mixed $hex_key The key to normalize.
 * @return string The normalized key, or an empty string when it is not a
 *                sequence of valid Unicode code points.
 */
function gutenberg_normalize_note_reaction_key( $hex_key ) {
	if ( ! is_string( $hex_key ) || ! preg_match( '/^[0-9a-f]{1,6}(?:-[0-9a-f]{1,6})*$/i', $hex_key ) ) {
		return '';
	}

	$code_points = array();
	foreach ( explode( '-', strtolower( $hex_key ) ) as $code_point ) {
		$value = hexdec( $code_point );
		// Surrogates and values past U+10FFFF are not code points.
		if ( $value > 0x10FFFF || ( $value >= 0xD800 && $value <= 0xDFFF ) ) {
			return '';
		}
		if ( 0xFE0F === $value ) {
			continue;
		}
		$code_points[] = str_pad( dechex( $value ), 4, '0', STR_PAD_LEFT );
	}

	return implode( '-', $code_points );
}

/**
 * Returns the emoji a note can be reacted with.
 *
 * @since 7.2.0
 *
 * @return array[] Emoji definitions, each with a `hexKey` and a `label`.
 */
function gutenberg_get_note_reaction_emojis() {
	// Labels are lowercase since they also appear mid-sentence, eg. in the
	// reaction pill's tooltip.
	$default_emojis = array(
		array(
			'hexKey' => '2764',
			'label'  => _x( 'heart', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexKey' => '1f389',
			'label'  => _x( 'celebration', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexKey' => '1f604',
			'label'  => _x( 'smile', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexKey' => '1f440',
			'label'  => _x( 'eyes', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexKey' => '1f680',
			'label'  => _x( 'rocket', 'emoji reaction', 'gutenberg' ),
		),
	);

	/**
	 * Filters the emoji a note can be reacted with.
	 *
	 * Add entries to offer more emoji, or remove them to offer fewer. An
	 * empty list turns off adding reactions; existing reactions still show
	 * and can be removed by their authors.
	 *
	 * Each emoji is identified by its hex key: its code points in hex,
	 * joined by `-` (eg. `1f984` for 🦄, `1f468-200d-1f4bb` for 👨‍💻).
	 * U+FE0F is dropped and case does not matter. The editor renders each
	 * emoji as text, so pick emoji the fonts on your users' systems can
	 * display: newer emoji and flags do not render everywhere.
	 *
	 * @since 7.2.0
	 *
	 * @param array[] $emojis {
	 *     The emoji to offer, in display order.
	 *
	 *     @type string $hexKey The emoji's hex key, eg. `1f984`.
	 *     @type string $label  The emoji's name, lowercase, eg. `unicorn`.
	 * }
	 */
	$emojis = apply_filters( 'wp_note_reaction_emojis', $default_emojis );

	if ( ! is_array( $emojis ) ) {
		return $default_emojis;
	}

	// Drop malformed entries and duplicate keys, keeping the first label.
	$sanitized = array();
	foreach ( $emojis as $emoji ) {
		if ( ! is_array( $emoji ) || ! isset( $emoji['hexKey'], $emoji['label'] ) || ! is_string( $emoji['label'] ) ) {
			continue;
		}

		$hex_key = gutenberg_normalize_note_reaction_key( $emoji['hexKey'] );
		$label   = sanitize_text_field( $emoji['label'] );
		if ( '' === $hex_key || '' === $label || isset( $sanitized[ $hex_key ] ) ) {
			continue;
		}

		$sanitized[ $hex_key ] = array(
			'hexKey' => $hex_key,
			'label'  => $label,
		);
	}

	return array_values( $sanitized );
}

/**
 * Returns the hex keys of the emoji a note reaction accepts.
 *
 * Each key is the emoji's lowercase code points, padded to four digits.
 *
 * @since 7.2.0
 *
 * @return string[] The keys of the emoji from `gutenberg_get_note_reaction_emojis()`.
 */
function gutenberg_get_note_reaction_keys() {
	return wp_list_pluck( gutenberg_get_note_reaction_emojis(), 'hexKey' );
}

/**
 * Passes the reaction emoji to the editor, so the reaction menu offers the
 * same emoji the REST API accepts.
 *
 * The `noteReactionEmojis` setting is internal and may change: extend the
 * list through the `wp_note_reaction_emojis` filter instead.
 *
 * @since 7.2.0
 *
 * @param array $settings Block editor settings.
 * @return array Block editor settings with `noteReactionEmojis` added.
 */
function gutenberg_add_note_reaction_emojis_setting( $settings ) {
	$settings['noteReactionEmojis'] = gutenberg_get_note_reaction_emojis();
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_note_reaction_emojis_setting' );

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
 * Restoring the note does not bring its reactions back: core's
 * `wp_untrash_comment()` restores no children of any type, so restoring
 * children is left to a cascade that covers every child type together.
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

	foreach ( gutenberg_get_note_reaction_ids( $comment, 'approve' ) as $reaction_id ) {
		wp_trash_comment( $reaction_id );
	}
}
add_action( 'trashed_comment', 'gutenberg_trash_note_reactions', 10, 2 );
