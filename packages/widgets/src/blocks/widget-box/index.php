<?php
/**
 * Server-side rendering of the `core/widget-box` block.
 *
 * @package WordPress
 */


function render_block_core_widget_box( $attributes, $content, $block ) {
	$inner_blocks = $block->inner_blocks;

	if ( empty( $inner_blocks ) ) {
		return '';
	}

	$inner_blocks_html = '';
	foreach ( $block->inner_blocks as $inner_block ) {
		$inner_blocks_html .= $inner_block->render();
	}

	return sprintf(
		'<div>%1$s</div>',
		$inner_blocks_html
	);

}

/**
 * Registers the 'core/widget-box' block.
 */
function register_block_core_widget_box() {
	register_block_type_from_metadata(
		__DIR__ . '/widget-box',
		array(
			'render_callback' => 'render_block_core_widget_box',
		)
	);
}

add_action( 'init', 'register_block_core_widget_box' );
