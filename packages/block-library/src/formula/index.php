<?php
/**
 * Server-side rendering of the `core/formula` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/formula` block on server.
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block rendered content.
 *
 * @return string Returns the formula block markup.
 */
function render_block_core_formula( $attributes, $content ) {
	return '<p>Formula!</p>';
}

/**
 * Registers the `core/cover` block renderer on server.
 */
function register_block_core_formula() {
	register_block_type_from_metadata(
		__DIR__ . '/formula',
		array(
			'render_callback' => 'formula',
		)
	);
}
add_action( 'init', 'register_block_core_formula' );
