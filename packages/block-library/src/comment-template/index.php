<?php
/**
 * Server-side rendering of the `core/comment-template` block.
 *
 * @package WordPress
 */

function render_block_core_comment_template( $attributes, $content, $block ) {

	// Get an array of comments for the current post.
	$comments = get_approved_comments(get_the_ID());

	if (count($comments) == 0) {
		return '';
	}
	
	$content = '';
	foreach ( $comments as $comment ) {
		$block_content = (
			new WP_Block(
				$block->parsed_block,
				array(
					'commentId'  => $comment->comment_ID
				)
			)
		)->render( array( 'dynamic' => false ) );
		$content .= '<li>' . $block_content . '</li>';
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