<?php
/**
 * Server-side rendering of the `core/details` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/details` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the details block markup.
 */
function render_block_core_details( $attributes, $content, $block ) {
	// If not using dynamic content, return the default saved content
	$use_dynamic_content = isset( $attributes['useDynamicContent'] ) && $attributes['useDynamicContent'];

	if ( ! $use_dynamic_content || ! isset( $block->context['postId'] ) ) {
		return $content;
	}

	// Get post data from context
	$post_id = $block->context['postId'];
	$post    = get_post( $post_id );

	if ( ! $post ) {
		return $content;
	}

	// Get post title and content
	$title        = get_the_title( $post_id );
	$post_content = apply_filters( 'the_content', get_the_content( null, false, $post_id ) );

	// Get block attributes
	$show_content = isset( $attributes['showContent'] ) && $attributes['showContent'];
	$name_attr    = isset( $attributes['name'] ) && $attributes['name'] ? $attributes['name'] : '';

	// Build wrapper attributes
	$wrapper_attributes = get_block_wrapper_attributes();

	// Build the open attribute
	$open_attr = $show_content ? ' open' : '';

	// Build the name attribute
	$name_html = $name_attr ? ' name="' . esc_attr( $name_attr ) . '"' : '';

	// Build the details block markup
	return sprintf(
		'<details %1$s%2$s%3$s><summary>%4$s</summary><div class="wp-block-details__content">%5$s</div></details>',
		$wrapper_attributes,
		$open_attr,
		$name_html,
		esc_html( $title ),
		$post_content
	);
}

/**
 * Registers the `core/details` block on the server.
 *
 * @return void
 */
function register_block_core_details() {
	register_block_type_from_metadata(
		__DIR__ . '/details',
		array(
			'render_callback' => 'render_block_core_details',
		)
	);
}
add_action( 'init', 'register_block_core_details' );
