<?php
/**
 * Server-side rendering of the `core/comment-template` block.
 *
 * @package WordPress
 */

/**
 * Convert the flat array of comments to a nested array
 * containing comments with a `comment_children` property.
 *
 * @param WP_Comment[] $comments  - Array of comments.
 * @return array
 */
function block_core_comment_template_convert_to_tree( $comments ) {
	$table = array();

	// If there are no comments, we can return early an empty array.
	if ( empty( $comments ) ) {
		return array();
	}

	// First we create an associative array of the form:
	// [commentId] => [...comment, comment_children: [] ].
	foreach ( $comments as $comment ) {
		$comment_with_children                     = (array) $comment;
		$comment_with_children['comment_children'] = array();
		$table[ $comment->comment_ID ]             = $comment_with_children;
	}

	$tree = array();

	foreach ( $comments as $comment ) {
		if ( ! empty( $comment->comment_parent ) ) {
			// If the comment has a "parent", then find that parent in the table that
			// we have created above and push the current comment to the array of its
			// children.
			$table[ $comment->comment_parent ]['comment_children'][] = $table[ $comment->comment_ID ];
		} else {
			// Otherwise, if the comment has no parent (also works if parent is 0/"0")
			// that means that it's a top-level comment. So we can find it in the table
			// and push it to the final tree.
			//
			// We have to push by reference using `=&` because this top-level comment might
			// still have other children. This way, if we add another comment to the
			// children of the current comment (in the `if` branch), it will be
			// updated in the final tree.
			$tree[] =& $table[ $comment->comment_ID ];
		}
	}

	return $tree;
}

/**
 * Function that recursively renders a list of nested comments.
 *
 * @param WP_Comment[] $comments    The array of comments.
 * @param WP_Block     $block           Block instance.
 * @return string
 */
function block_core_comment_template_render_comments( $comments, $block ) {
	$content = '';
	foreach ( $comments as $comment ) {

		$block_content = ( new WP_Block(
			$block->parsed_block,
			array(
				'commentId' => $comment['comment_ID'],
			)
		) )->render( array( 'dynamic' => false ) );

		// If the comment has children, recurse to create the HTML for the nested comments.
		if ( ! empty( $comment['comment_children'] ) ) {
			$inner_content  = block_core_comment_template_render_comments(
				$comment['comment_children'],
				$block
			);
			$block_content .= sprintf( '<ol>%1$s</ol>', $inner_content );
		}

		$content .= '<li>' . $block_content . '</li>';
	}

	return $content;

}

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

	$number = $block->context['queryPerPage'];

	// Get an array of comments for the current post.
	$comments = get_approved_comments( $post_id, array( 'number' => $number ) );

	if ( count( $comments ) === 0 ) {
		return '';
	}

	// Convert the flat array of comments to a nested array of arrays with a
	// `comment_children` property.
	$comment_tree = block_core_comment_template_convert_to_tree( $comments );

	$wrapper_attributes = get_block_wrapper_attributes();

	return sprintf(
		'<ol %1$s>%2$s</ol>',
		$wrapper_attributes,
		block_core_comment_template_render_comments( $comment_tree, $block )
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
