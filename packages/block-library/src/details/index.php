<?php
/**
 * Server-side rendering of the `core/details` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/details` block on the server.
 *
 * @since 6.9.0 Added support for dynamic content in Query Loop.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the details block markup.
 */
function render_block_core_details( $attributes, $content, $block ) {
	$use_dynamic_content = isset( $attributes['useDynamicContent'] ) && $attributes['useDynamicContent'];

	if ( ! $use_dynamic_content || ! isset( $block->context['postId'] ) ) {
		return $content;
	}

	$post_id = $block->context['postId'];
	$post    = get_post( $post_id );

	if ( ! $post ) {
		return $content;
	}

	$title = get_the_title( $post_id );

	/**
	 * Filters the post content.
	 *
	 * @since 6.9.0
	 *
	 * @param string $post_content The post content.
	 */
	$post_content = apply_filters( 'the_content', get_the_content( null, false, $post_id ) );

	$show_content = isset( $attributes['showContent'] ) && $attributes['showContent'];
	$name_attr    = isset( $attributes['name'] ) && $attributes['name'] ? $attributes['name'] : '';

	$wrapper_attributes = get_block_wrapper_attributes();
	$open_attr          = $show_content ? ' open' : '';
	$name_html          = $name_attr ? ' name="' . esc_attr( $name_attr ) . '"' : '';

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
 * Sets fetchpriority="low" on all IMG tags within a collapsed Details block.
 *
 * Images in a collapsed Details block are hidden until expanded, so they should
 * not compete with critical rendering path resources such as the LCP image.
 *
 * @since 7.0.0
 *
 * @param string $block_content The block content.
 * @param array  $block         The full block, including name and attributes.
 * @return string Modified HTML with fetchpriority="low" on all IMG tags when showContent is false.
 */
function block_core_details_set_img_fetchpriority_low( $block_content, array $block ): string {
	if ( ! is_string( $block_content ) ) {
		return '';
	}

	if ( $block['attrs']['showContent'] ?? false ) {
		return $block_content;
	}

	$tags = new WP_HTML_Tag_Processor( $block_content );
	while ( $tags->next_tag( 'IMG' ) ) {
		$tags->set_attribute( 'fetchpriority', 'low' );
	}
	return $tags->get_updated_html();
}

add_filter( 'render_block_core/details', 'block_core_details_set_img_fetchpriority_low', 10, 2 );

/**
 * Registers the `core/details` block on the server.
 *
 * @since 6.9.0
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
