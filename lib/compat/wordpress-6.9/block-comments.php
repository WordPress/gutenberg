<?php

/**
 * Adds support for block comments to the built-in post types.
 *
 * @return void
 */
function gutenberg_block_comment_add_post_type_support() {
	$post_types = array( 'post', 'page' );

	foreach ( $post_types as $post_type ) {
		if ( ! post_type_supports( $post_type, 'editor' ) ) {
			continue;
		}

		$supports        = get_all_post_type_supports( $post_type );
		$editor_supports = array( 'notes' => true );

		// `add_post_type_support()` doesn't merge support sub-properties, so we explicitly merge it here.
		if ( is_array( $supports['editor'] ) && isset( $supports['editor'][0] ) && is_array( $supports['editor'][0] ) ) {
			$editor_supports = array_merge( $editor_supports, $supports['editor'][0] );
		}

		add_post_type_support( $post_type, 'editor', $editor_supports );
	}
}
add_action( 'init', 'gutenberg_block_comment_add_post_type_support' );

/**
 * Register comment metadata for block comment status.
 */
function gutenberg_register_block_comment_metadata() {
	register_meta(
		'comment',
		'_wp_note_status',
		array(
			'type'          => 'string',
			'description'   => __( 'Note resolution status', 'gutenberg' ),
			'single'        => true,
			'show_in_rest'  => array(
				'schema' => array(
					'type' => 'string',
					'enum' => array( 'resolved', 'reopen' ),
				),
			),
			'auth_callback' => function ( $allowed, $meta_key, $object_id ) {
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_block_comment_metadata' );

/**
 * Updates the comment type for avatars in the WordPress REST API.
 *
 * This function adds the 'note' type to the list of comment types
 * for which avatars should be retrieved in the WordPress REST API.
 *
 * @param array $comment_type The array of comment types.
 * @return array The updated array of comment types.
 */
if ( ! function_exists( 'update_get_avatar_comment_type' ) ) {
	function update_get_avatar_comment_type( $comment_type ) {
		$comment_type[] = 'note';
		return $comment_type;
	}
	add_filter( 'get_avatar_comment_types', 'update_get_avatar_comment_type' );
}

/**
 * Excludes block comments from the admin comments query.
 *
 * This function modifies the comments query to exclude comments of type 'note'
 * when the query is for comments in the WordPress admin.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param WP_Comment_Query $query The current comments query.
 *
 * @return void
 */
if ( ! function_exists( 'exclude_block_comments_from_admin' ) ) {
	function exclude_block_comments_from_admin( $query ) {
		$types_in = array_merge( (array) $query->query_vars['type'], (array) $query->query_vars['type__in'] );
		$types_in = array_filter( $types_in );

		$types_not_in = (array) $query->query_vars['type__not_in'];
		$types_not_in = array_filter( $types_not_in );

		// If 'note' is already included in the types to include or exclude, do nothing.
		if ( in_array( 'note', array_merge( $types_in, $types_not_in ), true ) ) {
			return;
		}

		// Do not modify queries that are specifically looking for child comments.
		if ( ! empty( $query->query_vars['parent'] ) || ! empty( $query->query_vars['parent__in'] ) ) {
			return;
		}

		// Exclude notes from queries.
		$types_not_in[]                    = 'note';
		$query->query_vars['type__not_in'] = $types_not_in;
	}
	add_action( 'pre_get_comments', 'exclude_block_comments_from_admin' );
}

/**
 * Filter the comment count query to exclude block_comment type comments.
 *
 * Note: we need to make sure this doesn't interfere with the "Editorial Comments" view
 * once https://github.com/WordPress/gutenberg/issues/71621 is implemented.
 *
 * @param string $query The SQL query string.
 * @return string The modified SQL query string.
 */
function gutenberg_filter_comment_count_query_exclude_block_comments( $query ) {
	// Adjust the query if it is a comment count query.
	if ( str_starts_with( $query, 'SELECT comment_post_ID, COUNT(comment_ID) as num_comments FROM' ) && str_contains( $query, 'comment_approved' ) ) {
		if ( ! str_contains( $query, "comment_type != 'note'" ) ) {
			$query = str_replace( 'comment_approved', "comment_type != 'note' AND comment_approved", $query );
		}
	}
	return $query;
}
add_filter( 'query', 'gutenberg_filter_comment_count_query_exclude_block_comments' );

/**
 * Allows duplicate block comment.
 *
 * @since 6.9.0
 *
 * @param int $dupe_id The duplicate comment ID.
 * @param array $commentdata The comment data.
 *
 * @return int ID of the comment identified as a duplicate.
 */
function gutenberg_allow_duplicate_note_resolution( $dupe_id, $commentdata ) {
	if ( isset( $commentdata['comment_type'] ) && 'note' === $commentdata['comment_type'] ) {
		return false;
	}
	return $dupe_id;
}
add_filter( 'duplicate_comment_id', 'gutenberg_allow_duplicate_note_resolution', 10, 2 );
