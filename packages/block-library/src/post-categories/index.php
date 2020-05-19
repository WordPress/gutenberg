<?php
/**
 * Server-side rendering of the `core/post-categories` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-categories` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post categories for the current post wrapped inside "a" tags.
 */
function render_block_core_post_categories( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$class = 'wp-block-post-categories';

	if ( isset( $attributes['align'] ) ) {
		$class .= " align{$attributes['align']}";
	}

	if ( isset( $attributes['className'] ) ) {
		$class .= " {$attributes['className']}";
	}

	$post_categories = get_the_category( $block->context['postId'] );
	if ( ! empty( $post_categories ) ) {
		$output = '';
		foreach ( $post_categories as $category ) {
			$output .= '<a href="' . get_category_link( $category->term_id ) . '">' . $category->name . '</a>' . ', ';
		}
		return sprintf(
			'<div class="%1$s"><span class="screen-reader-text">' . __( 'Categories' ) . '</span> %2$s</div>',
			esc_attr( $class ),
			trim( $output, ', ' )
		);

	}
}

/**
 * Registers the `core/post-categories` block on the server.
 */
function register_block_core_post_categories() {
	register_block_type_from_metadata(
		__DIR__ . '/post-categories',
		array(
			'render_callback' => 'render_block_core_post_categories',
		)
	);
}
add_action( 'init', 'register_block_core_post_categories' );
