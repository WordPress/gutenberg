<?php
/**
 * Renders the `core/navigation-link-list` block on server.
 *
 * @param array $block The parsed block.
 *
 * @return string Returns the block html.
 */
function render_block_core_navigation_link_list( $attributes, $content, $block ) {

	if ( empty( $block->inner_blocks ) ) {
		return '';
	}

	$inner_blocks_html = '';
	foreach ( $block->inner_blocks as $inner_block ) {
		$inner_blocks_html .= $inner_block->render();
	}

	return sprintf('<ul class="wp-block-navigation__container">%1$s</ul>', $inner_blocks_html);
}

/**
 * Register the navigation link list block.
 *
 * @uses render_block_core_navigation_link_list()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_navigation_link_list() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation-link-list',
		array(
			'render_callback' => 'render_block_core_navigation_link_list',
		)
	);
}

add_action( 'init', 'register_block_core_navigation_link_list' );