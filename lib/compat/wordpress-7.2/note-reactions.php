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
 * Replaces the 6.9 implementation to also add the 'reaction' type
 * to the list of comment types for which avatars should be retrieved.
 *
 * @param array $comment_type The array of comment types.
 * @return array The updated array of comment types.
 */
function gutenberg_update_get_avatar_comment_type_7_2( $comment_type ) {
	return array_values( array_unique( array_merge( $comment_type, gutenberg_get_internal_comment_types() ) ) );
}
remove_filter( 'get_avatar_comment_types', 'update_get_avatar_comment_type' );
add_filter( 'get_avatar_comment_types', 'gutenberg_update_get_avatar_comment_type_7_2' );

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
remove_action( 'comments_clauses', 'exclude_block_comments_from_admin', 10 );
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
 * Replaces the 6.9 implementation to also exclude 'reaction' type.
 *
 * @param string $query The SQL query string.
 * @return string The modified SQL query string.
 */
function gutenberg_filter_comment_count_query_exclude_block_comments_7_2( $query ) {
	if ( str_starts_with( $query, 'SELECT comment_post_ID, COUNT(comment_ID) as num_comments FROM' ) && str_contains( $query, 'comment_approved' ) ) {
		// Add an exclusion clause for each internal type not already present.
		// Core (and older versions of this filter) may have already injected
		// the note-only exclusion, so expanding per type - rather than bailing
		// when any exclusion exists - ensures reactions are excluded too and
		// keeps the filter idempotent if it runs more than once.
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
 * Replaces the 6.9 implementation to also handle 'reaction' type.
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
 * Replaces the 6.9 implementation to also exclude 'reaction' type.
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
 * Returns the note reaction emoji settings: the named emoji list plus the
 * rules for emoji picked from the full picker, which are stored as hex keys.
 *
 * @since 7.2.0
 *
 * @return array {
 *     @type array[]  $emojis         Named emoji definitions, each with `emoji`,
 *                                    `label`, and `value` keys.
 *     @type bool     $allow_unlisted Whether emoji outside the named list are accepted.
 *     @type string[] $exclude        Normalized hex keys that are never accepted.
 * }
 */
function gutenberg_get_note_reaction_emoji_settings() {
	$default_emojis = array(
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

	/**
	 * Filters which emoji note reactions accept.
	 *
	 * Named emoji are always accepted. `allow_unlisted` and `exclude` only
	 * apply to emoji picked from the full picker.
	 *
	 * @since 7.2.0
	 *
	 * @param array $settings {
	 *     @type array[]  $emojis         Named emoji definitions. Each item has
	 *                                    `emoji`, `label`, and `value` keys.
	 *     @type bool     $allow_unlisted Whether any emoji from the full picker is
	 *                                    accepted. False limits reactions to the
	 *                                    named list. Default true.
	 *     @type string[] $exclude        Emojibase hexcodes to reject, such as
	 *                                    `1F595`. Excluding an emoji also excludes
	 *                                    its skin-tone variants. Default empty.
	 * }
	 */
	$defaults = array(
		'emojis'         => $default_emojis,
		'allow_unlisted' => true,
		'exclude'        => array(),
	);
	$settings = apply_filters( 'gutenberg_note_reaction_emoji_settings', $defaults );
	// Keys a callback leaves out keep their defaults.
	$settings = is_array( $settings ) ? wp_parse_args( $settings, $defaults ) : $defaults;

	$exclude = array();
	if ( is_array( $settings['exclude'] ) ) {
		foreach ( $settings['exclude'] as $hexcode ) {
			$hex_key = gutenberg_normalize_note_reaction_hex_key( $hexcode );
			if ( '' !== $hex_key ) {
				$exclude[] = $hex_key;
			}
		}
	}

	return array(
		'emojis'         => is_array( $settings['emojis'] ) ? array_values( $settings['emojis'] ) : array(),
		'allow_unlisted' => (bool) $settings['allow_unlisted'],
		'exclude'        => array_values( array_unique( $exclude ) ),
	);
}

/**
 * Returns the named emojis for note reactions.
 *
 * @since 7.2.0
 *
 * @return array[] List of emoji definitions, each with `emoji`, `label`,
 *                 and `value` keys.
 */
function gutenberg_get_note_reaction_emojis() {
	$settings = gutenberg_get_note_reaction_emoji_settings();
	return $settings['emojis'];
}

/**
 * Injects the note reaction emoji list into block editor settings so the
 * reaction picker offers the same (filterable) set the REST API accepts.
 *
 * @since 7.2.0
 *
 * @param array $settings Existing block editor settings.
 * @return array Updated block editor settings.
 */
function gutenberg_add_note_reaction_emojis_setting( $settings ) {
	$emoji_settings = gutenberg_get_note_reaction_emoji_settings();

	$settings['noteReactionEmojis']     = $emoji_settings['emojis'];
	$settings['noteReactionEmojiRules'] = array(
		'allowUnlisted' => $emoji_settings['allow_unlisted'],
		'exclude'       => $emoji_settings['exclude'],
	);
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_note_reaction_emojis_setting' );

/**
 * Normalizes an emoji hex key to the reaction storage form: lowercase,
 * each code point padded to four digits, U+FE0F and skin-tone modifiers
 * stripped. Accepts Emojibase hexcodes (`1F44D-1F3FB`) and stored keys.
 *
 * @since 7.2.0
 *
 * @param string $hex_key Hex code points joined by `-`.
 * @return string The base emoji's hex key, or empty string when invalid.
 */
function gutenberg_normalize_note_reaction_hex_key( $hex_key ) {
	if ( ! is_string( $hex_key ) || ! preg_match( '/^[0-9a-f]{1,6}(-[0-9a-f]{1,6})*$/i', $hex_key ) ) {
		return '';
	}
	$parts = array();
	foreach ( explode( '-', strtolower( $hex_key ) ) as $part ) {
		$value = hexdec( $part );
		// Variation Selector-16 and the five Fitzpatrick skin-tone modifiers.
		if ( 0xFE0F === $value || ( $value >= 0x1F3FB && $value <= 0x1F3FF ) ) {
			continue;
		}
		$parts[] = str_pad( $part, 4, '0', STR_PAD_LEFT );
	}
	return implode( '-', $parts );
}

/**
 * Whether a hex-key reaction is accepted under the emoji rules. An emoji
 * from the named list is always accepted, including its skin-tone variants.
 *
 * @since 7.2.0
 *
 * @param string $hex_key The submitted hex key.
 * @return bool Whether the reaction is allowed.
 */
function gutenberg_is_note_reaction_hex_key_allowed( $hex_key ) {
	$base = gutenberg_normalize_note_reaction_hex_key( $hex_key );
	if ( '' === $base ) {
		return false;
	}

	$settings = gutenberg_get_note_reaction_emoji_settings();
	foreach ( $settings['emojis'] as $entry ) {
		if (
			is_array( $entry ) &&
			! empty( $entry['emoji'] ) &&
			gutenberg_normalize_note_reaction_hex_key( gutenberg_emoji_to_hexcode( $entry['emoji'] ) ) === $base
		) {
			return true;
		}
	}

	return $settings['allow_unlisted'] && ! in_array( $base, $settings['exclude'], true );
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

	// Every status: trashing the note, or the user removing a reaction,
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
	// reactions the user had already removed.
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
 * flagged as trashed along with the note come back. Ones the user removed
 * beforehand stay in the trash.
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
