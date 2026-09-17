<?php
/**
 * Loads the stylesheet for the MathML that `@wordpress/latex-to-mathml`
 * produces, for the Math block and the inline math format.
 *
 * @package gutenberg
 */

/**
 * Enqueues the MathML stylesheet when a rendered block contains a `math` element.
 *
 * The inline math format puts MathML inside any block with rich text, so the
 * stylesheet cannot be tied to the Math block alone.
 *
 * @param string $block_content The block content.
 * @return string The block content, unchanged.
 */
function gutenberg_enqueue_mathml_style( $block_content ) {
	if (
		! is_string( $block_content ) ||
		! str_contains( $block_content, '<math' ) ||
		wp_style_is( 'wp-latex-to-mathml', 'enqueued' )
	) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( $processor->next_tag( 'MATH' ) ) {
		wp_enqueue_style( 'wp-latex-to-mathml' );
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_enqueue_mathml_style' );

/**
 * Enqueues the MathML stylesheet in the editor, where it is copied into the
 * canvas iframe with the other block assets.
 */
function gutenberg_enqueue_mathml_style_in_editor() {
	if ( is_admin() ) {
		wp_enqueue_style( 'wp-latex-to-mathml' );
	}
}
add_action( 'enqueue_block_assets', 'gutenberg_enqueue_mathml_style_in_editor' );
