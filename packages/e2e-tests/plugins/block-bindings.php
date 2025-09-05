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
			'type'  => 'string',
		),
		'url_field'   => array(
			'label' => 'URL Field Label',
			'value' => $testing_url,
			'type'  => 'string',
		),
		'empty_field' => array(
			'label' => 'Empty Field Label',
			'value' => '',
			'type'  => 'string',
		),
	);

	// Enqueue a custom script for the plugin.
	wp_enqueue_script(
		'gutenberg-test-block-bindings',
		plugins_url( 'block-bindings/index.js', __FILE__ ),
		array(
			'wp-blocks',
			'wp-block-editor',
			'wp-components',
			'wp-compose',
			'wp-element',
			'wp-hooks',
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
		'testing/complete-source',
		array(
			'label'              => 'Complete Source',
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

	// Register global custom fields.
	register_meta(
		'post',
		'text_custom_field',
		array(
			'default'      => 'Value of the text custom field',
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
	register_meta(
		'post',
		'url_custom_field',
		array(
			'default'      => '#url-custom-field',
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
	// Register different types of custom fields for testing.
	register_meta(
		'post',
		'string_custom_field',
		array(
			'label'        => 'String custom field',
			'default'      => '',
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
	register_meta(
		'post',
		'object_custom_field',
		array(
			'label'        => 'Object custom field',
			'show_in_rest' => array(
				'schema' => array(
					'type'       => 'object',
					'properties' => array(
						'foo' => array(
							'type' => 'string',
						),
					),
				),
			),
			'single'       => true,
			'type'         => 'object',
		)
	);
	register_meta(
		'post',
		'array_custom_field',
		array(
			'label'        => 'Array custom field',
			'show_in_rest' => array(
				'schema' => array(
					'type'  => 'array',
					'items' => array(
						'type' => 'string',
					),
				),
			),
			'single'       => true,
			'type'         => 'array',
			'default'      => array(),
		)
	);
	register_meta(
		'post',
		'number',
		array(
			'label'        => 'Number custom field',
			'type'         => 'number',
			'show_in_rest' => true,
			'single'       => true,
			'default'      => 5.5,
		)
	);
	register_meta(
		'post',
		'integer',
		array(
			'label'        => 'Integer custom field',
			'type'         => 'integer',
			'show_in_rest' => true,
			'single'       => true,
			'default'      => 5,
		)
	);
	register_meta(
		'post',
		'boolean',
		array(
			'label'        => 'Boolean custom field',
			'type'         => 'boolean',
			'show_in_rest' => true,
			'single'       => true,
			'default'      => true,
		)
	);

	// Register CPT custom fields.
	register_meta(
		'post',
		'movie_field',
		array(
			'label'          => 'Movie field label',
			'default'        => 'Movie field default value',
			'object_subtype' => 'movie',
			'show_in_rest'   => true,
			'single'         => true,
			'type'           => 'string',
		)
	);
	register_meta(
		'post',
		'field_with_only_label',
		array(
			'label'          => 'Field with only label',
			'object_subtype' => 'movie',
			'show_in_rest'   => true,
			'single'         => true,
			'type'           => 'string',
		)
	);
	register_meta(
		'post',
		'field_without_label_or_default',
		array(
			'object_subtype' => 'movie',
			'show_in_rest'   => true,
			'single'         => true,
			'type'           => 'string',
		)
	);
	register_meta(
		'post',
		'_protected_field',
		array(
			'default'        => 'Protected field value',
			'object_subtype' => 'movie',
			'show_in_rest'   => true,
			'single'         => true,
			'type'           => 'string',
		)
	);
	register_meta(
		'post',
		'show_in_rest_false_field',
		array(
			'default'        => 'show_in_rest false field value',
			'object_subtype' => 'movie',
			'show_in_rest'   => false,
			'single'         => true,
			'type'           => 'string',
		)
	);
}
add_action( 'init', 'gutenberg_test_block_bindings_registration' );
