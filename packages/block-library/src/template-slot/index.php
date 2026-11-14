<?php
/**
 * Server-side rendering of the `core/template-slot` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/template-slot` block on the server.
 *
 * The block holds what a template shows when it is rendered on its own. When
 * a template rendered inside this one takes its place, the blocks of that
 * template are put in the block instead, before it is rendered. Either way its
 * inner blocks are already rendered into `$content`, so the block only adds
 * its wrapper, which carries its layout and the rest of its block supports.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    The rendered inner blocks.
 * @return string Returns the inner blocks in the block's wrapper, or an empty string when there are none.
 */
function render_block_core_template_slot( $attributes, $content ) {
	if ( '' === trim( $content ) ) {
		return '';
	}

	return sprintf(
		'<div %1$s>%2$s</div>',
		get_block_wrapper_attributes(),
		$content
	);
}

/**
 * Registers the `core/template-slot` block on the server.
 */
function register_block_core_template_slot() {
	register_block_type_from_metadata(
		__DIR__ . '/template-slot',
		array(
			'render_callback' => 'render_block_core_template_slot',
		)
	);
}
add_action( 'init', 'register_block_core_template_slot' );
