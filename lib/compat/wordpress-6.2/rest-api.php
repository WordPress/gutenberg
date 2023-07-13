<?php
/**
 * Overrides Core's wp-includes/rest-api.php and registers the new endpoint for WP 6.2.
 *
 * @package gutenberg
 */

/**
 * Registers the block pattern categories REST API routes.
 */
function gutenberg_register_rest_block_pattern_categories() {
	$block_patterns = new Gutenberg_REST_Block_Pattern_Categories_Controller();
	$block_patterns->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_block_pattern_categories' );

/**
 * Add extra collection params to pattern directory requests.
 *
 * @param array $query_params JSON Schema-formatted collection parameters.
 * @return array Updated parameters.
 */
function gutenberg_pattern_directory_collection_params_6_2( $query_params ) {
	$query_params['page'] = array(
		'description'       => __( 'Current page of the collection.', 'gutenberg' ),
		'type'              => 'integer',
		'default'           => 1,
		'sanitize_callback' => 'absint',
		'validate_callback' => 'rest_validate_request_arg',
		'minimum'           => 1,
	);

	$query_params['per_page'] = array(
		'description'       => __( 'Maximum number of items to be returned in result set.', 'gutenberg' ),
		'type'              => 'integer',
		'default'           => 100,
		'minimum'           => 1,
		'maximum'           => 100,
		'sanitize_callback' => 'absint',
		'validate_callback' => 'rest_validate_request_arg',
	);

	$query_params['offset'] = array(
		'description' => __( 'Offset the result set by a specific number of items.', 'gutenberg' ),
		'type'        => 'integer',
	);

	$query_params['order'] = array(
		'description' => __( 'Order sort attribute ascending or descending.', 'gutenberg' ),
		'type'        => 'string',
		'default'     => 'desc',
		'enum'        => array( 'asc', 'desc' ),
	);

	$query_params['orderby'] = array(
		'description' => __( 'Sort collection by post attribute.', 'gutenberg' ),
		'type'        => 'string',
		'default'     => 'date',
		'enum'        => array(
			'author',
			'date',
			'id',
			'include',
			'modified',
			'parent',
			'relevance',
			'slug',
			'include_slugs',
			'title',
			'favorite_count',
		),
	);

	return $query_params;
}
add_filter( 'rest_pattern_directory_collection_params', 'gutenberg_pattern_directory_collection_params_6_2' );

/**
 * Updates REST API response for the sidebars and marks them as 'inactive'.
 *
 * Note: This can be a part of the `prepare_item_for_response` in `class-wp-rest-sidebars-controller.php`.
 *
 * @param WP_REST_Response $response The sidebar response object.
 * @return WP_REST_Response $response Updated response object.
 */
function gutenberg_modify_rest_sidebars_response( $response ) {
	if ( wp_is_block_theme() ) {
		$response->data['status'] = 'inactive';
	}
	return $response;
}
add_filter( 'rest_prepare_sidebar', 'gutenberg_modify_rest_sidebars_response' );


/**
 * Add the `block_types` value to the `pattern-directory-item` schema.
 *
 * @since 6.2.0 Added 'block_types' property.
 */
function add_block_pattern_block_types_schema() {
	register_rest_field(
		'pattern-directory-item',
		'block_types',
		array(
			'schema' => array(
				'description' => __( 'The block types which can use this pattern.', 'gutenberg' ),
				'type'        => 'array',
				'uniqueItems' => true,
				'items'       => array( 'type' => 'string' ),
				'context'     => array( 'view', 'embed' ),
			),
		)
	);
}
add_filter( 'rest_api_init', 'add_block_pattern_block_types_schema' );


/**
 * Add the `block_types` value into the API response.
 *
 * @since 6.2.0 Added 'block_types' property.
 *
 * @param WP_REST_Response $response    The response object.
 * @param object           $raw_pattern The unprepared pattern.
 */
function filter_block_pattern_response( $response, $raw_pattern ) {
	$data                = $response->get_data();
	$data['block_types'] = array_map( 'sanitize_text_field', $raw_pattern->meta->wpop_block_types );
	$response->set_data( $data );
	return $response;
}
add_filter( 'rest_prepare_block_pattern', 'filter_block_pattern_response', 10, 2 );


/**
 * Registers the block pattern directory.
 */
function gutenberg_register_rest_pattern_directory() {
	$pattern_directory_controller = new Gutenberg_REST_Pattern_Directory_Controller_6_2();
	$pattern_directory_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_pattern_directory' );
