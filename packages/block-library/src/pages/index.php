<?php
/**
 * Server-side rendering of the `core/pages` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/pages` block on server.
 *
 * @return string Returns the pages list/dropdown markup.
 */
function render_block_core_pages() {
	static $block_id = 0;
	$block_id++;

	$args = array(
		'echo'     => false,
		'title_li' => '',
	);

	$wrapper_markup = '<ul %1$s>%2$s</ul>';
	$items_markup   = wp_list_pages( $args );

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'wp-block-page-list' ) );

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
