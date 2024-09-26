<?php
/**
 * Plugin Name: Gutenberg Test Block Bindings
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-block-bindings
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_block_bindings_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-block-bindings',
		plugins_url( 'block-bindings/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-private-apis',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'block-bindings/index.js' ),
		true
	);
}

add_action( 'init', 'enqueue_block_bindings_plugin_script' );

/**
* Register custom fields and custom block bindings sources.
*/
function gutenberg_test_block_bindings_registration() {
	// Register custom block bindings sources.
	register_block_bindings_source(
		'core/server-source',
		array(
			'label'              => 'Server Source',
			'get_value_callback' => function () {},
		)
	);

	// Register "movie" custom post type.
	register_post_type(
		'movie',
		array(
			'label'        => 'Movie',
			'public'       => true,
			'supports'     => array( 'title', 'editor', 'comments', 'revisions', 'trackbacks', 'author', 'excerpt', 'page-attributes', 'thumbnail', 'custom-fields', 'post-formats' ),
			'has_archive'  => true,
			'show_in_rest' => true,
		)
	);

	// Register custom fields.
	register_meta(
		'post',
		'text_custom_field',
		array(
			'show_in_rest' => true,
			'type'         => 'string',
			'single'       => true,
			'default'      => 'Value of the text custom field',
		)
	);
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
	register_meta(
		'post',
		'empty_field',
		array(
			'show_in_rest' => true,
			'type'         => 'string',
			'single'       => true,
			'default'      => '',
		)
	);
	register_meta(
		'post',
		'_protected_field',
		array(
			'type'         => 'string',
			'show_in_rest' => true,
			'single'       => true,
			'default'      => 'protected field value',
		)
	);
	register_meta(
		'post',
		'show_in_rest_false_field',
		array(
			'show_in_rest' => false,
			'type'         => 'string',
			'single'       => true,
			'default'      => 'show_in_rest false field value',
		)
	);
}
add_action( 'init', 'gutenberg_test_block_bindings_registration' );
