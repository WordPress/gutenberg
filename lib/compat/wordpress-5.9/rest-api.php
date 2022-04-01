<?php
/**
 * Extends the REST API endpoints.
 *
 * @package gutenberg
 */

/**
 * Exposes the site logo to the Gutenberg editor through the WordPress REST
 * API. This is used for fetching this information when user has no rights
 * to update settings.
 *
 * @since 10.9
 *
 * @param WP_REST_Response $response Response data served by the WordPress REST index endpoint.
 * @return WP_REST_Response
 */
function gutenberg_register_site_logo_to_rest_index( $response ) {
	$site_logo_id                = get_theme_mod( 'custom_logo' );
	$response->data['site_logo'] = $site_logo_id;
	if ( $site_logo_id ) {
		$response->add_link(
			'https://api.w.org/featuredmedia',
			rest_url( 'wp/v2/media/' . $site_logo_id ),
			array(
				'embeddable' => true,
			)
		);
	}
	return $response;
}

add_filter( 'rest_index', 'gutenberg_register_site_logo_to_rest_index' );

/**
 * Filters WP_User_Query arguments when querying users via the REST API.
 *
 * Allow using the has_published_post argument.
 *
 * @param array           $prepared_args Array of arguments for WP_User_Query.
 * @param WP_REST_Request $request       The REST API request.
 *
 * @return array Returns modified $prepared_args.
 */
function gutenberg_rest_user_query_has_published_posts( $prepared_args, $request ) {
	if ( ! empty( $request['has_published_posts'] ) ) {
		$prepared_args['has_published_posts'] = ( true === $request['has_published_posts'] )
			? get_post_types( array( 'show_in_rest' => true ), 'names' )
			: (array) $request['has_published_posts'];
	}
	return $prepared_args;
}
add_filter( 'rest_user_query', 'gutenberg_rest_user_query_has_published_posts', 10, 2 );

/**
 * Filters REST API collection parameters for the users controller.
 *
 * @param array $query_params JSON Schema-formatted collection parameters.
 *
 * @return array Returns the $query_params with "has_published_posts".
 */
function gutenberg_rest_user_collection_params_has_published_posts( $query_params ) {
	$query_params['has_published_posts'] = array(
		'description' => __( 'Limit result set to users who have published posts.', 'gutenberg' ),
		'type'        => array( 'boolean', 'array' ),
		'items'       => array(
			'type' => 'string',
			'enum' => get_post_types( array( 'show_in_rest' => true ), 'names' ),
		),
	);
	return $query_params;
}
add_filter( 'rest_user_collection_params', 'gutenberg_rest_user_collection_params_has_published_posts' );
