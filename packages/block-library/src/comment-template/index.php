<?php
/**
 * Server-side rendering of the `core/comment-template` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comment-template` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the HTML representing the comments using the layout
 * defined by the block's inner blocks.
 */
function render_block_core_comment_template( $attributes, $content, $block ) {

	$post_id = $block->context['postId'];

	// Bail out early if the post ID is not set for some reason.
	if ( ! isset( $post_id ) ) {
		return '';
	}

	$per_page = $block->context['queryPerPage'];
	// Get an array of comments for the current post.

	$page = (int) get_query_var( 'cpage' );

	$comment_args = array(
		'number'                    => $per_page,
		'orderby'                   => 'comment_date_gmt',
		'order'                     => 'ASC',
		'status'                    => 'approve',
		'post_id'                   => $post_id,
		'no_found_rows'             => false,
		'update_comment_meta_cache' => false,
		'offset'                    => 0,
	);

	if ( $page ) {
		$comment_args['offset'] = ( $page - 1 ) * $per_page;
	} else {
		$top_level_args = array(
			'count'   => true,
			'orderby' => false,
			'post_id' => $post_id,
			'status'  => 'approve',
		);

		// We are not taking into account nested comments yet
		$comment_count = get_comments( $top_level_args );

		$comment_args['offset'] = ( ceil( $comment_count / $per_page ) - 1 ) * $per_page;
	}

	$comments = get_comments( $comment_args );

	if ( count( $comments ) === 0 ) {
		return '';
	}

	$content = '';
	foreach ( $comments as $comment ) {
		$block_content = ( new WP_Block(
			$block->parsed_block,
			array(
				'commentId' => $comment->comment_ID,
			)
		) )->render( array( 'dynamic' => false ) );
		$content      .= '<li>' . $block_content . '</li>';
	}

	return sprintf(
		'<ul>%1$s</ul>',
		$content
	);
}

/**
 * Registers the `core/comment-template` block on the server.
 */
function register_block_core_comment_template() {
	register_block_type_from_metadata(
		__DIR__ . '/comment-template',
		array(
			'render_callback'   => 'render_block_core_comment_template',
			'skip_inner_blocks' => true,
		)
	);
}
add_action( 'init', 'register_block_core_comment_template' );
