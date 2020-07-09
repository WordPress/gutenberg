<?php
/**
 * Server-side rendering of the `core/navigation-item` block.
 *
 * @package gutenberg
 */

function render_block_core_navigation_item( $attributes, $content, $block ) {
	$inner_blocks_html = '';
	foreach ( $block->inner_blocks as $inner_block ) {
		$inner_blocks_html .= $inner_block->render();
	}

	return sprintf(
		'<li class="wp-block-navigation-item">%s</li>',
		$inner_blocks_html
	);
}

function register_block_core_navigation_item() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation-item',
		array(
			'render_callback' => 'render_block_core_navigation_item',
		)
	);
}
add_action( 'init', 'register_block_core_navigation_item' );
