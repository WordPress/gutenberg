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
		$editor_supports = array( 'block-comments' => true );

		// `add_post_type_support()` doesn't merge support sub-properties, so we explicitly merge it here.
		if ( is_array( $supports['editor'] ) && isset( $supports['editor'][0] ) && is_array( $supports['editor'][0] ) ) {
			$editor_supports = array_merge( $editor_supports, $supports['editor'][0] );
		}

		add_post_type_support( $post_type, 'editor', $editor_supports );
	}
}
add_action( 'init', 'gutenberg_block_comment_add_post_type_support' );

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
 * @param string[] $clauses The current SQL clauses for the comments query.
 * @param WP_Comment_Query $query The current comments query.
 *
 * @return string[] The modified SQL clauses for the comments query.
 */
if ( ! function_exists( 'exclude_block_comments_from_admin' ) ) {
	function exclude_block_comments_from_admin( $clauses, $query ) {
		// Only modify the query if it's for comments
		if ( isset( $query->query_vars['type'] ) && '' === $query->query_vars['type'] ) {
			$query->set( 'type', '' );

			global $wpdb;
			$clauses['where'] .= " AND {$wpdb->comments}.comment_type != 'block_comment'";
		}

		return $clauses;
	}
	add_action( 'comments_clauses', 'exclude_block_comments_from_admin', 10, 2 );
}

/**
 * Post List filters
 */

/**
 * Add a new column for editorial comments.
 *
 * @param array $columns Existing columns.
 * @return array Modified columns.
 */
function gutenberg_add_editorial_comments_column( $columns ) {
	// Add column immediately after the existing comments column.
	$editorial_comments = '<div class="dashicons dashicons-admin-comments" title="' . esc_attr__( 'Editorial Comments', 'gutenberg' ) . '"></div>';
	$comment_position   = array_search( 'comments', array_keys( $columns ), true );
	$columns_before     = array_slice( $columns, 0, $comment_position + 1, true );
	$columns_after      = array_slice( $columns, $comment_position + 1, null, true );
	$columns            = $columns_before + array( 'editorial_comments' => $editorial_comments ) + $columns_after;
	return $columns;
}
add_filter( 'manage_posts_columns', 'gutenberg_add_editorial_comments_column' );
add_filter( 'manage_pages_columns', 'gutenberg_add_editorial_comments_column' );

/**
 * Render the editorial comments count for each row.
 *
 * Use a format similar to the core comments column. Each row shows a comment icon
 * with the count of resolved comments. A red dot with a number in it shows the count
 * of unresolved comments.
 *
 * @param string $column_name The name of the column to render.
 * @param int    $post_id     The post ID.
 * @return void
 */
function gutenberg_render_editorial_comments_column( $column_name, $post_id ) {
	if ( 'editorial_comments' !== $column_name ) {
		return;
	}

	$approve_count = get_comments(
		array(
			'post_id' => $post_id,
			'type'    => 'block_comment',
			'status'  => 'approve',
			'count'   => true,
		)
	);

	$unapprove_count = get_comments(
		array(
			'post_id' => $post_id,
			'type'    => 'block_comment',
			'status'  => 'hold',
			'count'   => true,
		)
	);
	print( '<div class="column-comments">' );
	gutenberg_comments_bubble( $post_id, $unapprove_count, $approve_count );
	print( '</div>' );
}
add_action( 'manage_posts_custom_column', 'gutenberg_render_editorial_comments_column', 10, 2 );

/**
 * Displays a comment count bubble.
 *
 * @param int $post_id          The post ID.
 * @param int $pending_comments Number of pending comments.
 */
function gutenberg_comments_bubble( $post_id, $pending_comments, $approved_comments ) {
	$post_object   = get_post( $post_id );
	$edit_post_cap = $post_object ? 'edit_post' : 'edit_posts';

	if ( ! current_user_can( $edit_post_cap, $post_id )
		&& ( post_password_required( $post_id )
			|| ! current_user_can( 'read_post', $post_id ) )
	) {
		// The user has no access to the post and thus cannot see the comments.
		return false;
	}

	$approved_comments_number = number_format_i18n( $approved_comments );
	$pending_comments_number  = number_format_i18n( $pending_comments );

	$approved_only_phrase = sprintf(
		/* translators: %s: Number of comments. */
		_n( '%s comment', '%s comments', $approved_comments, 'gutenberg' ),
		$approved_comments_number
	);

	$approved_phrase = sprintf(
		/* translators: %s: Number of comments. */
		_n( '%s approved comment', '%s approved comments', $approved_comments, 'gutenberg' ),
		$approved_comments_number
	);

	$pending_phrase = sprintf(
		/* translators: %s: Number of comments. */
		_n( '%s pending comment', '%s pending comments', $pending_comments, 'gutenberg' ),
		$pending_comments_number
	);

	if ( ! $approved_comments && ! $pending_comments ) {
		// No comments at all.
		printf(
			'<span aria-hidden="true">&#8212;</span>' .
			'<span class="screen-reader-text">%s</span>',
			__( 'No comments', 'gutenberg' )
		);
	} elseif ( $approved_comments && 'trash' === get_post_status( $post_id ) ) {
		// Don't link the comment bubble for a trashed post.
		printf(
			'<span class="post-com-count post-com-count-approved">' .
				'<span class="comment-count-approved" aria-hidden="true">%s</span>' .
				'<span class="screen-reader-text">%s</span>' .
			'</span>',
			$approved_comments_number,
			$pending_comments ? $approved_phrase : $approved_only_phrase
		);
	} elseif ( $approved_comments ) {
		// Link the comment bubble to approved comments.
		printf(
			'<a href="%s" class="post-com-count post-com-count-approved">' .
				'<span class="comment-count-approved" aria-hidden="true">%s</span>' .
				'<span class="screen-reader-text">%s</span>' .
			'</a>',
			esc_url(
				add_query_arg(
					array(
						'p'              => $post_id,
						'comment_status' => 'approved',
						'comment_type'   => 'block_comment',
					),
					admin_url( 'edit-comments.php' )
				)
			),
			$approved_comments_number,
			$pending_comments ? $approved_phrase : $approved_only_phrase
		);
	} else {
		// Don't link the comment bubble when there are no approved comments.
		printf(
			'<span class="post-com-count post-com-count-no-comments">' .
				'<span class="comment-count comment-count-no-comments" aria-hidden="true">%s</span>' .
				'<span class="screen-reader-text">%s</span>' .
			'</span>',
			$approved_comments_number,
			$pending_comments ?
			/* translators: Hidden accessibility text. */
			__( 'No approved comments', 'gutenberg' ) :
			/* translators: Hidden accessibility text. */
			__( 'No comments', 'gutenberg' )
		);
	}

	if ( $pending_comments ) {
		printf(
			'<a href="%s" class="post-com-count post-com-count-pending">' .
				'<span class="comment-count-pending" aria-hidden="true">%s</span>' .
				'<span class="screen-reader-text">%s</span>' .
			'</a>',
			esc_url(
				add_query_arg(
					array(
						'p'              => $post_id,
						'comment_status' => 'moderated',
						'comment_type'   => 'block_comment',

					),
					admin_url( 'edit-comments.php' )
				)
			),
			$pending_comments_number,
			$pending_phrase
		);
	} else {
		printf(
			'<span class="post-com-count post-com-count-pending post-com-count-no-pending">' .
				'<span class="comment-count comment-count-no-pending" aria-hidden="true">%s</span>' .
				'<span class="screen-reader-text">%s</span>' .
			'</span>',
			$pending_comments_number,
			$approved_comments ?
			/* translators: Hidden accessibility text. */
			__( 'No pending comments', 'gutenberg' ) :
			/* translators: Hidden accessibility text. */
			__( 'No comments', 'gutenberg' )
		);
	}
}

/**
 * Filter the editorial comment so it is sortable.
 *
 * @param array $columns Existing sortable columns.
 * @return array Modified sortable columns.
 */
function gutenberg_filter_edit_post_sortable_columns( $columns ) {
	$columns['editorial_comments'] = 'editorial_comments';
	return $columns;
}
add_filter( 'manage_edit-post_sortable_columns', 'gutenberg_filter_edit_post_sortable_columns' );
add_filter( 'manage_edit-page_sortable_columns', 'gutenberg_filter_edit_post_sortable_columns' );

/**
 * Filters for the comments page.
 */

/**
 * Use the 'admin_comment_types_dropdown' filter to add Editorial Comments to the comment type dropdown.
 */
function gutenberg_add_editorial_comments_to_comment_type_dropdown( $types ) {
	$types['block_comment'] = __( 'Editorial Comments', 'gutenberg' );
	return $types;
}
add_filter( 'admin_comment_types_dropdown', 'gutenberg_add_editorial_comments_to_comment_type_dropdown' );

/**
 * Add a submenu item under "Comments" for "Editorial Comments". This screen shows comments with the "block_comment" type.
 */
function gutenberg_add_editorial_comments_submenu() {
	add_submenu_page(
		'edit-comments.php',
		__( 'Editorial Comments', 'gutenberg' ),
		__( 'Editorial Comments', 'gutenberg' ),
		'edit_posts',
		admin_url( 'edit-comments.php?comment_type=block_comment' ),
		''
	);
}
add_action( 'admin_menu', 'gutenberg_add_editorial_comments_submenu' );

/**
 * Use the `comment_status_links` filter to remove non-applicable options Spam and Trash.
 *
 * Also, rename "Pending" to "Open" and "Approved" to "Resolved" for editorial comments.
 *
 * @param array $status_links The existing status links.
 * @return array The modified status links.
 */
function gutenberg_filter_editorial_comments_status_links( $status_links ) {
	if ( isset( $_GET['comment_type'] ) && 'block_comment' === $_GET['comment_type'] ) {
		unset( $status_links['spam'] );
		unset( $status_links['trash'] );
	}
	if ( isset( $status_links['moderated'] ) ) {
		$status_links['moderated'] = str_replace( __( 'Pending', 'gutenberg' ), __( 'Open', 'gutenberg' ), $status_links['moderated'] );
	}
	if ( isset( $status_links['approved'] ) ) {
		$status_links['approved'] = str_replace( __( 'Approved', 'gutenberg' ), __( 'Resolved', 'gutenberg' ), $status_links['approved'] );
	}
	return $status_links;
}
add_filter( 'comment_status_links', 'gutenberg_filter_editorial_comments_status_links' );


/**
 * Adjust the bulk edit options on the comments screen when the comment type is block_comment.
 *
 * The options should be Resolve (approve), Reopen (unapprove), and Delete.
 * @param array $bulk_actions The existing bulk actions.
 * @return array The modified bulk actions.
 *
 */
function gutenberg_filter_editorial_comments_bulk_actions( $bulk_actions ) {
	if ( isset( $_GET['comment_type'] ) && 'block_comment' === $_GET['comment_type'] ) {
		$bulk_actions = array(
			'approve'   => __( 'Resolve', 'gutenberg' ),
			'unapprove' => __( 'Reopen', 'gutenberg' ),
			'delete'    => __( 'Delete', 'gutenberg' ),
		);
	}
	return $bulk_actions;
}
add_filter( 'bulk_actions-edit-comments', 'gutenberg_filter_editorial_comments_bulk_actions' );
