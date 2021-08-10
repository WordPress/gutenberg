<?php
/**
 * Server-side rendering of the `core/widget-box` block.
 *
 * @package WordPress
 */


function render_block_core_widget_box() {
    return '<p>Hello rendered</p>';
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
