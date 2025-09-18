<?php
/**
 * Updates the comment type in the REST API.
 *
 * This function is used as a filter callback for the 'rest_pre_insert_comment' hook.
 * It checks if the 'comment_type' parameter is set to 'block_comment' in the REST API request,
 * and if so, updates the 'comment_type' and 'comment_approved' properties of the prepared comment.
 *
 * @param array $prepared_comment The prepared comment data.
 * @param WP_REST_Request $request The REST API request object.
 * @return array The updated prepared comment data.
 */
if ( ! function_exists( 'update_comment_type_in_rest_api_6_8' ) ) {
	function update_comment_type_in_rest_api_6_8( $prepared_comment, $request ) {
		if ( ! empty( $request['comment_type'] ) && 'block_comment' === $request['comment_type'] ) {
			$prepared_comment['comment_type']     = $request['comment_type'];
			$prepared_comment['comment_approved'] = $request['comment_approved'];
		}

		return $prepared_comment;
	}
	add_filter( 'rest_pre_insert_comment', 'update_comment_type_in_rest_api_6_8', 10, 2 );
}

/**
 * Updates the comment type for avatars in the WordPress REST API.
 *
 * This function adds the 'block_comment' type to the list of comment types
 * for which avatars should be retrieved in the WordPress REST API.
 *
 * @param array $comment_type The array of comment types.
 * @return array The updated array of comment types.
 */
if ( ! function_exists( 'update_get_avatar_comment_type' ) ) {
	function update_get_avatar_comment_type( $comment_type ) {
		$comment_type[] = 'block_comment';
		return $comment_type;
	}
	add_filter( 'get_avatar_comment_types', 'update_get_avatar_comment_type' );
}

/**
 * Excludes block comments from the admin comments query.
 *
 * This function modifies the comments query to exclude comments of type 'block_comment'
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

		// If 'block_comment' is already included in the types to include or exclude, do nothing.
		if ( in_array( 'block_comment', array_merge( $types_in, $types_not_in ), true ) ) {
			return;
		}

		// Exclude block comments from queries
		$types_not_in[]                    = 'block_comment';
		$query->query_vars['type__not_in'] = $types_not_in;
	}
	add_action( 'pre_get_comments', 'exclude_block_comments_from_admin' );
}
