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
function render_block_core_block( $attributes ) {
	if ( empty( $attributes['ref'] ) ) {
		return '';
	}

	$shared_block = get_post( $attributes['ref'] );
	if ( ! $shared_block ) {
		return '';
	}

	if ( 'wp_block' !== $shared_block->post_type ) {
		return '';
	}

	// TODO: Does this correctly handle scheduled blocks?
	if ( 'publish' !== $shared_block->post_status ) {
		return '';
	}

	// TODO: Not sure how to support this
	if ( $shared_block->post_password ) {
		return '';
	}

	$blocks = gutenberg_parse_blocks( $shared_block->post_content );

	$html = '';
	foreach ( $blocks as $block ) {
		$html .= gutenberg_render_block( $block );
	}
	return $html;
}

register_block_type( 'core/block', array(
	'attributes'      => array(
		'ref' => array(
			'type' => 'number',
		),
	),

	'render_callback' => 'render_block_core_block',
) );
