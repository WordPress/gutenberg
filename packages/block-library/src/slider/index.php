<?php
/**
 * Server-side rendering of the `core/slider` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/slider` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider( $attributes, $content, $block ) {
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	unset( $attributes, $block );

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'data-wp-interactive' => 'core/slider',
		)
	);

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Registers the `core/slider` block on the server.
 */
function register_block_core_slider() {
	register_block_type_from_metadata(
		__DIR__ . '/slider',
		array(
			'render_callback' => 'render_block_core_slider',
		)
	);
}
add_action( 'init', 'register_block_core_slider' );
