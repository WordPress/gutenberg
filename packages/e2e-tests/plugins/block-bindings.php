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
			'default'      => 'https://wpmovies.dev/wp-content/uploads/2023/03/3bhkrj58Vtu7enYsRolD1fZdja1-683x1024.jpg',
		)
	);
}
add_action( 'init', 'gutenberg_test_block_bindings_register_custom_fields' );
