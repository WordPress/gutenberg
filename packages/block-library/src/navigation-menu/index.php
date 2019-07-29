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
function render_block_navigation_menu( $attributes, $content ) {
	return "Content";
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
				'hierarchy'        => array(
					'type'    => 'array',
					'default' => array(),
					'items'   => array(
						'type' => 'object',
					),
				),
			),
			'render_callback' => 'render_block_navigation_menu',
		)
	);
}

add_action( 'init', 'register_block_core_navigation_menu' );
