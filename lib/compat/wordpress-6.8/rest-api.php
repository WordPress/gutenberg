<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

// When querying terms for a given taxonomy in the REST API, respect the default
// query arguments set for that taxonomy upon registration.
function gutenberg_respect_taxonomy_default_args_in_rest_api( $args ) {
	// If a `post` argument is provided, the Terms controller will use
	// `wp_get_object_terms`, which respects the default query arguments,
	// so we don't need to do anything.
	if ( ! empty( $args['post'] ) ) {
		return $args;
	}

	$t = get_taxonomy( $args['taxonomy'] );
	if ( isset( $t->args ) && is_array( $t->args ) ) {
		$args = array_merge( $args, $t->args );
	}
	return $args;
}
add_action(
	'registered_taxonomy',
	function ( $taxonomy ) {
		add_filter( "rest_{$taxonomy}_query", 'gutenberg_respect_taxonomy_default_args_in_rest_api' );
	}
);
add_action(
	'unregistered_taxonomy',
	function ( $taxonomy ) {
		remove_filter( "rest_{$taxonomy}_query", 'gutenberg_respect_taxonomy_default_args_in_rest_api' );
	}
);

/**
 * Adds the default template part areas to the REST API index.
 *
 * This function exposes the default template part areas through the WordPress REST API.
 * Note: This function backports into the wp-includes/rest-api/class-wp-rest-server.php file.
 *
 * @param WP_REST_Response $response REST API response.
 * @return WP_REST_Response Modified REST API response with default template part areas.
 */
function gutenberg_add_default_template_part_areas_to_index( WP_REST_Response $response ) {
	$response->data['default_template_part_areas'] = get_allowed_block_template_part_areas();
	return $response;
}
add_filter( 'rest_index', 'gutenberg_add_default_template_part_areas_to_index' );

/**
 * Adds the default template types to the REST API index.
 *
 * This function exposes the default template types through the WordPress REST API.
 * Note: This function backports into the wp-includes/rest-api/class-wp-rest-server.php file.
 *
 * @param WP_REST_Response $response REST API response.
 * @return WP_REST_Response Modified REST API response with default template part areas.
 */
function gutenberg_add_default_template_types_to_index( WP_REST_Response $response ) {
	$indexed_template_types = array();
	foreach ( get_default_block_template_types() as $slug => $template_type ) {
		$template_type['slug']    = (string) $slug;
		$indexed_template_types[] = $template_type;
	}

	$response->data['default_template_types'] = $indexed_template_types;
	return $response;
}
add_filter( 'rest_index', 'gutenberg_add_default_template_types_to_index' );

/**
 * Adds `ignore_sticky` parameter to the post collection endpoint.
 *
 * Note: Backports into the wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php file.
 *
 * @param array        $query_params JSON Schema-formatted collection parameters.
 * @param WP_Post_Type $post_type    Post type object.
 * @return array
 */
function gutenberg_modify_post_collection_param( $query_params, WP_Post_Type $post_type ) {
	if ( 'post' === $post_type->name && ! isset( $query_params['ignore_sticky'] ) ) {
		$query_params['ignore_sticky'] = array(
			'description' => __( 'Whether to ignore sticky posts or not.' ),
			'type'        => 'boolean',
			'default'     => false,
		);
	}

	return $query_params;
}
add_filter( 'rest_post_collection_params', 'gutenberg_modify_post_collection_param', 10, 2 );

/**
 * Modify posts query based on `ignore_sticky` parameter.
 *
 * Note: Backports into the wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php file.
 *
 * @param array           $prepared_args Array of arguments for WP_User_Query.
 * @param WP_REST_Request $request       The REST API request.
 * @return array Modified arguments
 */
function gutenberg_modify_post_collection_query( $args, WP_REST_Request $request ) {
	/*
	 * Honor the original REST API `post__in` behavior. Don't prepend sticky posts
	 * when `post__in` has been specified.
	 */
	if ( isset( $request['ignore_sticky'] ) && empty( $args['post__in'] ) ) {
		$args['ignore_sticky_posts'] = $request['ignore_sticky'];
	}

	return $args;
}
add_filter( 'rest_post_query', 'gutenberg_modify_post_collection_query', 10, 2 );
