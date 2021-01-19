<?php
/**
 * Server-side rendering of the `core/pages` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/pages` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the pages list/dropdown markup.
 */
function render_block_core_pages( $attributes ) {
	static $block_id = 0;
	$block_id++;

	$walker = new Walker_Pages_Block;

	$args = array(
		'echo'     => false,
		'title_li' => '',
		'walker'   => $walker,
	);

	$wrapper_markup = '<ul %1$s>%2$s</ul>';
	$items_markup   = wp_list_pages( $args );

	$classes = 'wp-block-page-list';

	if ( isset( $attributes['showSubmenuIcon'] ) && $attributes['showSubmenuIcon'] ) {
		$classes .= ' show-submenu-icons';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $classes ) );

	return sprintf(
		$wrapper_markup,
		$wrapper_attributes,
		$items_markup
	);
}

/**
 * Registers the `core/pages` block on server.
 */
function register_block_core_pages() {
	register_block_type_from_metadata(
		__DIR__ . '/pages',
		array(
			'render_callback' => 'render_block_core_pages',
		)
	);
}
add_action( 'init', 'register_block_core_pages' );
