<?php
/**
 * Server-side rendering of the `core/block` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/block` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function gutenberg_render_block_core_reusable_block( $attributes ) {
	if ( empty( $attributes['ref'] ) ) {
		return '';
	}

	$reusable_block = get_post( $attributes['ref'] );
	if ( ! $reusable_block || 'wp_block' !== $reusable_block->post_type ) {
		return '';
	}

	$blocks = gutenberg_parse_blocks( $reusable_block->post_content );

	$block = array_shift( $blocks );
	if ( ! $block ) {
		return '';
	}

	return gutenberg_render_block( $block );
}

register_block_type( 'core/block', array(
	'attributes'      => array(
		'ref' => array(
			'type' => 'number',
		),
	),

	'render_callback' => 'gutenberg_render_block_core_reusable_block',
) );
