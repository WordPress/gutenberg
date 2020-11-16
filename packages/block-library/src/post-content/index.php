<?php
/**
 * Server-side rendering of the `core/post-content` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-content` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post content of the current post.
 */
function render_block_core_post_content( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	if ( gutenberg_process_this_content( $block->context['postId'], $block->name ) ) {
		if ('revision' === $block->context['postType']) {
			return '';
		}

		$wrapper_attributes = get_block_wrapper_attributes(array('class' => 'entry-content'));

		$html = '<div ' . $wrapper_attributes . '>' .
			apply_filters('the_content', str_replace(']]>', ']]&gt;', get_the_content(null, false, $block->context['postId']))) .
			'</div>';
		gutenberg_clear_processed_content();
	} else {
		$html = gutenberg_report_recursion_error();
	}
	return $html;
}

/**
 * Registers the `core/post-content` block on the server.
 */
function register_block_core_post_content() {
	register_block_type_from_metadata(
		__DIR__ . '/post-content',
		array(
			'render_callback' => 'render_block_core_post_content',
		)
	);
}
add_action( 'init', 'register_block_core_post_content' );
