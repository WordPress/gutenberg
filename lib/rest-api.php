<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the Global Styles REST API routes.
 */
function gutenberg_register_global_styles_endpoints() {
	$global_styles_controller = new WP_REST_Global_Styles_Controller_Gutenberg();
	$global_styles_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_global_styles_endpoints' );

/**
 * Adds the post classes to the REST API response.
 *
 * @param WP_REST_Response $data    Response object.
 * @param WP_Post          $post    Post object.
 *
 * @return WP_REST_Response Response object.
 */
function gutenberg_add_post_class_to_api_response( $data, $post ) {
	$data->data['post_class'] = get_post_class( '', $post->ID );

	return $data;
}

/**
 * Adds the post classes to all post types in the REST API.
 */
function gutenberg_add_post_class_to_all_post_types() {
	$post_types = get_post_types( array( 'public' => true ), 'names' );

	foreach ( $post_types as $post_type ) {
		add_filter( "rest_prepare_{$post_type}", 'gutenberg_add_post_class_to_api_response', 10, 3 );
	}
}
add_action( 'rest_api_init', 'gutenberg_add_post_class_to_all_post_types' );
