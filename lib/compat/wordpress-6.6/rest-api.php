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
 * Registers the REST route for retrieving the post classes of a post.
 */
function gutenberg_register_post_class_rest_route() {
	register_rest_route(
		'wp/v2',
		'/postclass/(?P<id>\d+)',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => '__return_true',
			'callback'            => 'gutenberg_get_post_classes',
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_post_class_rest_route' );

/**
 * Callback function for the REST route.
 *
 * @param WP_REST_Request $request Current request.
 */
function gutenberg_get_post_classes( WP_REST_Request $request ) {
	$id               = (int) $request['id'];
	$post             = get_post( $id );
	$post_type        = get_post_type( $post );
	$valid_post_types = get_post_types(
		array(
			'public'       => true,
			'show_in_rest' => true,
		)
	);

	if ( ! in_array( $post_type, $valid_post_types, true ) ) {
		return new WP_Error( 'rest_post_invalid_id', __( 'Invalid post ID.' ), array( 'status' => 404 ) );
	}

	$controller = new WP_REST_Posts_Controller( $post_type );

	$check = $controller->get_item_permissions_check( $request );

	if ( true !== $check ) {
		return $check;
	}

	// Get the post classes and return them
	$post_classes = get_post_class( '', $id );

	return $post_classes;
}
