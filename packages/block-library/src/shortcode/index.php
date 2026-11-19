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
 * @since 7.3.0 Skips wpautop() when the shortcodes have already been expanded,
 *              and removes the paragraphs it adds around standalone shortcodes.
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 *
 * @return string Returns the block content.
 */
function render_block_core_shortcode( $attributes, $content ) {
	// Skip wpautop() on shortcode output that block templates have already expanded.
	if ( str_contains( $content, '<' ) && ! preg_match( '/' . get_shortcode_regex() . '/', $content ) ) {
		return $content;
	}

	// Remove the paragraphs around standalone shortcodes, which the_content does but block widgets don't.
	return shortcode_unautop( wpautop( $content ) );
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
