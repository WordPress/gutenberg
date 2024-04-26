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

if ( ! function_exists( 'wp_api_template_access_controller' ) ) {
	/**
	 * Hook in to the template and template part post types and modify the
	 * access control for the rest endpoint to allow lower user roles to access
	 * the templates and template parts.
	 *
	 * @param array  $args Current registered post type args.
	 * @param string $post_type Name of post type.
	 *
	 * @return array
	 */
	function wp_api_template_access_controller( $args, $post_type ) {
		if ( 'wp_template' === $post_type || 'wp_template_part' === $post_type ) {
			$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_6_6';
		}
		return $args;
	}
}
add_filter( 'register_post_type_args', 'wp_api_template_access_controller', 10, 2 );

/**
 * Adds the post classes to the REST API response.
 *
 * @param WP_REST_Response $response    Response object.
 * @param WP_Post          $post    Post object.
 *
 * @return WP_REST_Response Response object.
 */
function gutenberg_add_post_class_to_api_response( $response, $post ) {
	$response->data['post_class'] = get_post_class( '', $post->ID );

	return $response;
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
