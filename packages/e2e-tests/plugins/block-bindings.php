<?php
/**
 * Plugin Name: Gutenberg Test Block Bindings
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-block-bindings
 */

/**
 * Code necessary for testing block bindings:
 * - Enqueues a custom script to register sources in the client.
 * - Registers sources in the server.
 * - Registers a custom post type and custom fields.
 */
function gutenberg_test_block_bindings_registration() {
	// Define fields list.
	$upload_dir  = wp_upload_dir();
	$testing_url = $upload_dir['url'] . '/1024x768_e2e_test_image_size.jpeg';
	$fields_list = array(
		'text_field'  => array(
			'label' => 'Text Field Label',
			'value' => 'Text Field Value',
		),
		'url_field'   => array(
			'label' => 'URL Field Label',
			'value' => $testing_url,
		),
		'empty_field' => array(
			'label' => 'Empty Field Label',
			'value' => '',
		),
	);

	// Enqueue a custom script for the plugin.
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

	// Pass data to the script.
	wp_localize_script(
		'gutenberg-test-block-bindings',
		'testingBindings',
		array(
			'fieldsList' => $fields_list,
		)
	);

	// Register custom block bindings sources.
	register_block_bindings_source(
		'testing/get-values',
		array(
			'label'              => 'Get Values',
			'get_value_callback' => function ( $source_args ) use ( $fields_list ) {
				if ( ! isset( $source_args['key'] ) || ! isset( $fields_list[ $source_args['key'] ] ) ) {
					return null;
				}
				return $fields_list[ $source_args['key'] ]['value']; },
		)
	);
	register_block_bindings_source(
		'testing/server-only-source',
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
