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

	// If the `queryPerPage` is set, use that. Otherwise, use the value
	// from the site settings. If those are not available for some reason,
	// use `50` (it's the same as the default value of commentsPerPage).
	if ( isset( $block->context['queryPerPage'] ) ) {
		$number = $block->context['queryPerPage'];
	} else {
		$number = get_option( 'comments_per_page', 50 );
	}

	// Get an array of comments for the current post.
	$comments = get_approved_comments( $post_id, array( 'number' => $number ) );

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
