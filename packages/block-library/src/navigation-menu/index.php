<?php
/**
 * Server-side rendering of the `core/navigation-menu` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/navigation-menu` block on server.
 *
 * @see WP_Widget
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_navigation_menu( $attributes, $content, $block ) {
	return sprintf( 'Navigation menu with %d items', count( $block['innerBlocks'] ) );
}

/**
 * Register legacy widget block.
 */
function register_block_core_navigation_menu() {
	register_block_type(
		'core/navigation-menu',
		array(
			'category'        => 'layout',
			'attributes'      => array(
				'automaticallyAdd' => array(
					'type'    => 'boolean',
					'default' => 'false',
				),
			),
			'render_callback' => 'render_block_navigation_menu',
		)
	);
}

add_action( 'init', 'register_block_core_navigation_menu' );
