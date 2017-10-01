<?php
/**
 * Server-side rendering of the `core/reusable-block` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/reusable-block` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function gutenberg_render_block_core_reusable_block( $attributes ) {
	$reusable_blocks = get_posts( array(
		'post_type' => 'gb_reusable_block',
		'name'      => $attributes['ref'],
	) );

	if ( empty( $reusable_blocks ) ) {
		return '';
	}

	$reusable_block = array_shift( $reusable_blocks );

	$blocks = gutenberg_parse_blocks( $reusable_block->post_content );

	if ( empty( $blocks ) ) {
		return '';
	}

	$block = array_shift( $blocks );
	$block_name = $block['blockName'];
	$block_attributes = $block['attrs'];
	$block_content = $block['rawContent'];

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
	if ( $block_type ) {
		return $block_type->render( $block_attributes, $block_content );
	} else {
		return $block_content;
	}
}

register_block_type( 'core/reusable-block', array(
	'attributes'      => array(
		'ref' => array(
			'type' => 'string',
		),
	),

	'render_callback' => 'gutenberg_render_block_core_reusable_block',
) );
