<?php
/**
 * Server-side rendering of the `core/math` block.
 *
 * @package WordPress
 */

/**
 * Enqueues the Math block's stylesheet when a rendered block contains MathML.
 *
 * The stylesheet styles the MathML that temml produces, and the inline math
 * format produces the same MathML inside any block with rich text. When block
 * assets load on demand, only a rendered Math block enqueues its stylesheet,
 * so every block's output is checked for a `math` element.
 *
 * @since 7.2.0
 *
 * @param string $block_content The block content.
 * @return string The block content, unchanged.
 */
function block_core_math_enqueue_style( $block_content ) {
	if (
		! is_string( $block_content ) ||
		! str_contains( $block_content, '<math' ) ||
		wp_style_is( 'wp-block-math', 'enqueued' )
	) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( $processor->next_tag( 'MATH' ) ) {
		wp_enqueue_style( 'wp-block-math' );
	}

	return $block_content;
}
add_filter( 'render_block', 'block_core_math_enqueue_style' );

/**
 * Registers the `core/math` block on server.
 *
 * @since 7.2.0
 */
function register_block_core_math() {
	register_block_type_from_metadata( __DIR__ . '/math' );
}
add_action( 'init', 'register_block_core_math' );
