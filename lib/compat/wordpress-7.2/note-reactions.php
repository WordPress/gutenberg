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
 * @param string[] $comment_type The array of comment types.
 * @return string[] The updated array of comment types.
 *
 * @phpstan-return non-empty-list<string>
 */
function gutenberg_update_get_avatar_comment_type_7_2( $comment_type ) {
	return array_values( array_unique( array_merge( $comment_type, array( 'note', 'reaction' ) ) ) );
}
add_filter( 'get_avatar_comment_types', 'gutenberg_update_get_avatar_comment_type_7_2' );

/**
 * Excludes reactions from comment queries unless they are requested.
 *
 * Core's WP_Comment_Query already excludes 'note' unless 'all' or 'note' is
 * requested; this applies the same rule to 'reaction'.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param string[]         $clauses The current SQL clauses for the comments query.
 * @param WP_Comment_Query $query   The current comments query.
 *
 * @return string[] The modified SQL clauses for the comments query.
 */
function gutenberg_exclude_block_comments_from_admin_7_2( $clauses, WP_Comment_Query $query ) {
	$types_in     = array_merge( (array) $query->query_vars['type'], (array) $query->query_vars['type__in'] );
	$types_not_in = (array) $query->query_vars['type__not_in'];

	if (
		in_array( 'all', $types_in, true ) ||
		in_array( 'reaction', $types_in, true ) ||
		in_array( 'reaction', $types_not_in, true )
	) {
		return $clauses;
	}

	global $wpdb;
	$clauses['where'] .= " AND {$wpdb->comments}.comment_type != 'reaction'";

	return $clauses;
}
add_filter( 'comments_clauses', 'gutenberg_exclude_block_comments_from_admin_7_2', 10, 2 );

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
	return $cwhere . " AND {$wpdb->comments}.comment_type NOT IN ( 'note', 'reaction' )";
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
		/*
		 * Add an exclusion clause for each internal type not already present.
		 * Core's query already hardcodes the note-only exclusion, so expanding
		 * per type - rather than bailing when any exclusion exists - ensures
		 * reactions are excluded too and keeps the filter idempotent if it
		 * runs more than once.
		 */
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
 * Excludes notes and reactions from the last comment modified lookup.
 *
 * Both are stored approved, so get_lastcommentmodified() would otherwise
 * report a note or reaction as the site's latest comment, for example in
 * the comment feed's Last-Modified header.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param string $query The SQL query string.
 * @return string The modified SQL query string.
 */
function gutenberg_exclude_internal_comment_types_from_lastcommentmodified_7_2( $query ) {
	global $wpdb;

	$needle = "FROM $wpdb->comments WHERE comment_approved = '1' ORDER BY comment_date_gmt DESC LIMIT 1";
	if ( ! str_starts_with( $query, 'SELECT ' ) || ! str_ends_with( $query, $needle ) ) {
		return $query;
	}

	return str_replace( "comment_approved = '1' ORDER BY", "comment_approved = '1' AND comment_type NOT IN ( 'note', 'reaction' ) ORDER BY", $query );
}
add_filter( 'query', 'gutenberg_exclude_internal_comment_types_from_lastcommentmodified_7_2' );

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
 * @return int The modified comment count.
 */
function gutenberg_exclude_notes_from_comment_count_7_2( $new_count, $old_count, $post_id ) {
	global $wpdb;
	if ( null !== $new_count ) {
		return $new_count;
	}
	$new_count = (int) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT COUNT(*) FROM $wpdb->comments WHERE comment_post_ID = %d AND comment_approved = '1' AND comment_type NOT IN ( 'note', 'reaction' )",
			$post_id
		)
	);
	return $new_count;
}
add_filter( 'pre_wp_update_comment_count_now', 'gutenberg_exclude_notes_from_comment_count_7_2', 10, 3 );

/**
 * Formats an emoji hex key in the reaction storage form: lowercase, each
 * code point padded to four digits, U+FE0F stripped. Accepts Emojibase
 * hexcodes (`2764-FE0F`) and stored keys.
 *
 * @since 7.2.0
 *
 * @param string $hex_key Hex code points joined by `-`.
 * @return string The formatted hex key, or empty string when invalid.
 */
function gutenberg_format_note_reaction_hex_key( $hex_key ) {
	if ( ! is_string( $hex_key ) || ! preg_match( '/^[0-9a-f]{1,6}(-[0-9a-f]{1,6})*$/i', $hex_key ) ) {
		return '';
	}
	$parts = array();
	foreach ( explode( '-', strtolower( $hex_key ) ) as $part ) {
		if ( 0xFE0F === hexdec( $part ) ) {
			continue;
		}
		$parts[] = str_pad( $part, 4, '0', STR_PAD_LEFT );
	}
	return implode( '-', $parts );
}

/**
 * Reduces an emoji hex key to its base emoji: formatted as in
 * gutenberg_format_note_reaction_hex_key(), with skin-tone modifiers
 * stripped, so a rule for an emoji covers its skin-tone variants.
 *
 * @since 7.2.0
 *
 * @param string $hex_key Hex code points joined by `-`.
 * @return string The base emoji's hex key, or empty string when invalid.
 */
function gutenberg_normalize_note_reaction_hex_key( $hex_key ) {
	$formatted = gutenberg_format_note_reaction_hex_key( $hex_key );
	if ( '' === $formatted ) {
		return '';
	}
	$parts = array();
	foreach ( explode( '-', $formatted ) as $part ) {
		$value = hexdec( $part );
		// The five Fitzpatrick skin-tone modifiers.
		if ( $value >= 0x1F3FB && $value <= 0x1F3FF ) {
			continue;
		}
		$parts[] = $part;
	}
	return implode( '-', $parts );
}

/**
 * Returns the note reaction emoji settings: the named emoji list plus the
 * rules for which other emoji the picker offers and the REST API accepts.
 *
 * @since 7.2.0
 *
 * @return array {
 *     @type array[]  $emojis         Named emoji, each with a `hexcode` key
 *                                    in storage form and a `label`.
 *     @type bool     $allow_unlisted Whether emoji outside the named list are accepted.
 *     @type string[] $exclude        Base hex keys that are never accepted.
 * }
 */
function gutenberg_get_note_reaction_emoji_settings() {
	$default_emojis = array(
		array(
			'hexcode' => '1F44D',
			'label'   => _x( 'Thumbs up', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexcode' => '2795',
			'label'   => _x( 'Plus', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexcode' => '2764',
			'label'   => _x( 'Heart', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexcode' => '1F389',
			'label'   => _x( 'Celebration', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexcode' => '1F604',
			'label'   => _x( 'Smile', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexcode' => '1F440',
			'label'   => _x( 'Eyes', 'emoji reaction', 'gutenberg' ),
		),
		array(
			'hexcode' => '1F680',
			'label'   => _x( 'Rocket', 'emoji reaction', 'gutenberg' ),
		),
	);

	/**
	 * Filters which emoji note reactions offer and accept.
	 *
	 * Named emoji seed the picker's "Frequently used" section, carry their
	 * own labels, and are always accepted. `allow_unlisted` and `exclude`
	 * apply to every other emoji in the picker.
	 *
	 * @since 7.2.0
	 *
	 * @param array $settings {
	 *     @type array[]  $emojis         Named emoji. Each item has a `hexcode`
	 *                                    (Emojibase form, such as `1F984`) and
	 *                                    a `label`.
	 *     @type bool     $allow_unlisted Whether any emoji from the picker is
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

	$emojis = array();
	if ( is_array( $settings['emojis'] ) ) {
		foreach ( $settings['emojis'] as $entry ) {
			if ( ! is_array( $entry ) || ! isset( $entry['hexcode'], $entry['label'] ) || ! is_string( $entry['label'] ) ) {
				continue;
			}
			$hex_key = gutenberg_format_note_reaction_hex_key( $entry['hexcode'] );
			if ( '' !== $hex_key ) {
				$emojis[] = array(
					'hexcode' => $hex_key,
					'label'   => $entry['label'],
				);
			}
		}
	}

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
		'emojis'         => $emojis,
		'allow_unlisted' => (bool) $settings['allow_unlisted'],
		'exclude'        => array_values( array_unique( $exclude ) ),
	);
}

/**
 * Injects the note reaction emoji settings into the block editor settings
 * so the picker offers the same set the REST API accepts.
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
 * Whether a reaction hex key is accepted under the emoji rules. An emoji
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
		if ( gutenberg_normalize_note_reaction_hex_key( $entry['hexcode'] ) === $base ) {
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
 * @return int[] Reaction comment IDs, oldest first.
 */
function gutenberg_get_note_reaction_ids( WP_Comment $note, string $status = 'any' ): array {
	return get_comments(
		array(
			'parent'  => $note->comment_ID,
			'type'    => 'reaction',
			'status'  => $status,
			'fields'  => 'ids',
			'orderby' => 'comment_ID',
			'order'   => 'ASC',
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
 * @param string          $comment_id The comment ID as a numeric string.
 * @param WP_Comment|null $comment    The comment being deleted.
 *
 * @phpstan-param numeric-string $comment_id
 */
function gutenberg_delete_note_reactions( $comment_id, ?WP_Comment $comment ): void {
	if ( ! $comment || 'note' !== $comment->comment_type ) {
		return;
	}

	/*
	 * Every status: trashing the note, or a REST delete without `force`,
	 * leaves reactions in the trash.
	 */
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
 * @param string          $comment_id The comment ID as a numeric string.
 * @param WP_Comment|null $comment    The trashed comment, or null when a plugin
 *                                    fires the action for a missing row.
 *
 * @phpstan-param numeric-string $comment_id
 */
function gutenberg_trash_note_reactions( $comment_id, ?WP_Comment $comment ): void {
	if ( ! $comment || 'note' !== $comment->comment_type ) {
		return;
	}

	foreach ( gutenberg_get_note_reaction_ids( $comment, 'approve' ) as $reaction_id ) {
		wp_trash_comment( $reaction_id );
	}
}
add_action( 'trashed_comment', 'gutenberg_trash_note_reactions', 10, 2 );
