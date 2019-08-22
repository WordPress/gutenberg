<?php
/**
 * Server-side rendering of the `core/navigation-menu` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/navigation-menu` block on server.
 *
 * @param array $attributes The block attributes.
 * @param array $content The saved content.
 * @param array $block The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_navigation_menu( $attributes, $content, $block ) {
	return prepare_navigation( $block );
}

/**
 * Adds parent and child relatin to innerBlocks
 *
 * @param array  $block The block.
 * @param string $block_tree the current tree.
 *
 * @return string Returns the block with ids and parents for innerBlocks.
 */
function prepare_navigation( $block, $block_tree = '' ) {
	foreach ( (array) $block['innerBlocks'] as $key => $menu_item ) {
		$block_tree .= '<li>' . $menu_item['innerContent'][0];
		if ( count( (array) $menu_item['innerBlocks'] ) > 0 ) {
			$block_tree .= prepare_navigation( $menu_item, '' );
		}
		$block_tree .= '</li>';
	}
	return '<ul>' . $block_tree . '</ul>';
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
