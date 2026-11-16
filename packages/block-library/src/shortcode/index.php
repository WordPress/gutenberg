<?php
/**
 * Server-side rendering of the `core/shortcode` block.
 *
 * @package WordPress
 */

/**
 * Performs wpautop() on the shortcode block content.
 *
 * @since 5.0.0
 * @since 7.3.0 Skips wpautop() when the shortcodes have already been expanded.
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 *
 * @return string Returns the block content.
 */
function render_block_core_shortcode( $attributes, $content ) {
	/*
	 * Block templates expand shortcodes before rendering blocks, so the content
	 * can already be the HTML output of a shortcode. Running wpautop() on that
	 * markup can break it, for example by adding stray closing paragraph tags.
	 */
	if ( str_contains( $content, '<' ) && ! preg_match( '/' . get_shortcode_regex() . '/', $content ) ) {
		return $content;
	}

	return wpautop( $content );
}

/**
 * Registers the `core/shortcode` block on server.
 *
 * @since 5.0.0
 */
function register_block_core_shortcode() {
	register_block_type_from_metadata(
		__DIR__ . '/shortcode',
		array(
			'render_callback' => 'render_block_core_shortcode',
		)
	);
}
add_action( 'init', 'register_block_core_shortcode' );
