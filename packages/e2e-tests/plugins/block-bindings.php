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
		'text_field'          => array(
			'label' => 'Text Field Label',
			'value' => 'Text Field Value',
			'type'  => 'string',
		),
		'url_field'           => array(
			'label' => 'URL Field Label',
			'value' => $testing_url,
			'type'  => 'string',
		),
		'empty_field'         => array(
			'label' => 'Empty Field Label',
			'value' => '',
			'type'  => 'string',
		),
		'number_custom_field' => array(
			'label' => 'Number Custom Field Label',
			'value' => 10.5,
			'type'  => 'number',
		),
	);

	// Enqueue a custom script for the plugin.
	wp_enqueue_script(
		'gutenberg-test-block-bindings',
		plugins_url( 'block-bindings/index.js', __FILE__ ),
		array(
			'wp-blocks',
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
				return $fields_list[ $source_args['key'] ]['value'];
			},
			'uses_context'       => array( 'postType', 'postId' ),
		)
	);
	register_block_bindings_source(
		'testing/server-only-source',
		array(
			'label'              => 'Server Source',
			'get_value_callback' => function () {},
		)
	);

	/*
	 * Inner-blocks example/test binding sources.
	 *
	 * The frontend counterpart of the JS sources registered in
	 * `block-bindings/index.js`. These resolve the reserved `innerBlocks`
	 * attribute to a fixed serialized block-markup string (and `null` for any
	 * other attribute), proving the inner-block binding mechanism on the server
	 * independently of `core/pattern-overrides`.
	 *
	 * They are deliberately CONTEXT-FREE: no `uses_context` is declared and the
	 * value is resolved purely from the fixture, so resolution is identical
	 * whether the bound block is top-level (`$parent_block === null`) or nested.
	 * The fixture string is duplicated verbatim from the JS plugin so the
	 * editor (`parse()`) and the frontend (`parse_blocks()`) produce the same
	 * inner blocks for the same source state.
	 */
	$inner_blocks_fixture = "<!-- wp:paragraph -->\n<p>Source Paragraph 1</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Source Paragraph 2</p>\n<!-- /wp:paragraph -->";

	$inner_blocks_get_value = function ( $source_args, $block_instance, $attribute_name ) use ( $inner_blocks_fixture ) {
		if ( 'innerBlocks' === $attribute_name ) {
			return $inner_blocks_fixture;
		}
		return null;
	};

	register_block_bindings_source(
		'testing/inner-blocks-source',
		array(
			'label'              => 'Inner Blocks Source',
			'get_value_callback' => $inner_blocks_get_value,
		)
	);
	register_block_bindings_source(
		'testing/inner-blocks-source-read-only',
		array(
			'label'              => 'Inner Blocks Source (Read Only)',
			'get_value_callback' => $inner_blocks_get_value,
		)
	);
	register_block_bindings_source(
		'testing/inner-blocks-source-absence',
		array(
			'label'              => 'Inner Blocks Source (Absence)',
			'get_value_callback' => function () {
				return null;
			},
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
		'number_custom_field',
		array(
			'label'        => 'Number custom field',
			'type'         => 'number',
			'show_in_rest' => true,
			'single'       => true,
			'default'      => 0.5,
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
			'default'      => 3,
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
