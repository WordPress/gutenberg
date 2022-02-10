<?php
/**
 * Server-side rendering of the `core/comment-form` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comment-form` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the HTML representing the comments using the layout
 * defined by the block's inner blocks.
 */
function render_block_core_comment_form( $attributes, $content, $block ) {
	// Bail out early if the post ID is not set for some reason.
	if ( empty( $block->context['postId'] ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	$form_contents = <<<END
	<label for="name">Name:</label>

	<input type="text" id="name" name="name" required size="10">
	END;

	return sprintf(
		'<form %1$s>%2$s</form>',
		$wrapper_attributes,
		$form_contents
	);
}

/**
 * Registers the `core/comment-form` block on the server.
 */
function register_block_core_comment_form() {
	register_block_type_from_metadata(
		__DIR__ . '/comment-form',
		array(
			'render_callback'   => 'render_block_core_comment_form',
			'skip_inner_blocks' => true,
		)
	);
}
add_action( 'init', 'register_block_core_comment_form' );
