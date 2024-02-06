<?php
/**
 * Plugin Name: Gutenberg Test Block Bindings
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-block-bindings
 */

/**
* Register custom fields.
*/
function gutenberg_test_block_bindings_register_custom_fields() {
	register_meta(
		'post',
		'text_custom_field',
		array(
			'show_in_rest' => true,
			'type'         => 'string',
			'single'       => true,
			'default'      => 'Value of the text_custom_field',
		)
	);
	// TODO: Change url.
	register_meta(
		'post',
		'url_custom_field',
		array(
			'show_in_rest' => true,
			'type'         => 'string',
			'single'       => true,
			'default'      => '#url-custom-field',
		)
	);
}
add_action( 'init', 'gutenberg_test_block_bindings_register_custom_fields' );
