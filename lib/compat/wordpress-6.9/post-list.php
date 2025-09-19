<?php
/**
 * Filters to alter the post list page.
 *
 * Add a new column for editorial comments, similar to the core comments column.
 */

/**
 * Add a new column for editorial comments.
 */
function gutenberg_add_editorial_comments_column( $columns ) {
	$columns['editorial_comments'] = '<div class="dashicons dashicons-admin-comments" title="' . esc_attr__( 'Editorial Comments', 'gutenberg' ) . '"></div>';
	return $columns;
}
add_filter( 'manage_posts_columns', 'gutenberg_add_editorial_comments_column' );

/**
 * Render the editorial comments count for each row.
 *
 * Use a format similar to the core comments column. Each row shows a comment icon
 * with the count of resolved comments. A red dot with a number in it shows the count
 * of unresolved comments.
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
 * @since n.e.x.t.
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
		_n( '%s comment', '%s comments', $approved_comments ),
		$approved_comments_number
	);

	$approved_phrase = sprintf(
		/* translators: %s: Number of comments. */
		_n( '%s approved comment', '%s approved comments', $approved_comments ),
		$approved_comments_number
	);

	$pending_phrase = sprintf(
		/* translators: %s: Number of comments. */
		_n( '%s pending comment', '%s pending comments', $pending_comments ),
		$pending_comments_number
	);

	if ( ! $approved_comments && ! $pending_comments ) {
		// No comments at all.
		printf(
			'<span aria-hidden="true">&#8212;</span>' .
			'<span class="screen-reader-text">%s</span>',
			__( 'No comments' )
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
			__( 'No approved comments' ) :
			/* translators: Hidden accessibility text. */
			__( 'No comments' )
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
			__( 'No pending comments' ) :
			/* translators: Hidden accessibility text. */
			__( 'No comments' )
		);
	}
}

/**
 * Filter the editorial comment so it is sortable.
 */
function gutenberg_filter_edit_post_sortable_columns( $columns ) {
	$columns['editorial_comments'] = 'editorial_comments';
	return $columns;
}
add_filter( 'manage_edit-post_sortable_columns', 'gutenberg_filter_edit_post_sortable_columns' );
