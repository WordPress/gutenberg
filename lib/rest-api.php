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
 * Overrides the REST controller for the `wp_global_styles` post type.
 *
 * @param array $args Array of arguments for registering a post type.
 *                          See the register_post_type() function for accepted arguments.
 *
 * @return array Array of arguments for registering a post type.
 */
function gutenberg_override_global_styles_endpoint( array $args ): array {
	$args['rest_controller_class']   = 'WP_REST_Global_Styles_Controller_Gutenberg';
	$args['late_route_registration'] = true;
	$args['show_in_rest']            = true;
	$args['rest_base']               = 'global-styles';

	return $args;
}
add_filter( 'register_wp_global_styles_post_type_args', 'gutenberg_override_global_styles_endpoint' );

/**
 * Registers the Edit Site Export REST API routes.
 */
function gutenberg_register_edit_site_export_controller_endpoints() {
	$edit_site_export_controller = new WP_REST_Edit_Site_Export_Controller_Gutenberg();
	$edit_site_export_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_edit_site_export_controller_endpoints' );

/**
 * Registers the Icons Registry REST API routes.
 */
if ( gutenberg_is_experiment_enabled( 'gutenberg-svg-icon-registry' ) ) {
	function gutenberg_register_icon_controller_endpoints() {
		$icons_registry = new WP_REST_Icons_Controller();
		$icons_registry->register_routes();
	}
	add_action( 'rest_api_init', 'gutenberg_register_icon_controller_endpoints' );
}

/**
 * Filters REST API post responses to remove taxonomy term creation links
 * when the user lacks the required capability.
 *
 * This ensures that users without 'manage_categories' capability cannot
 * create new terms in the block editor, addressing issue #50194.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     Post object.
 * @param WP_REST_Request  $request  Request object (unused but required by filter signature).
 * @return WP_REST_Response Modified response object.
 */
function gutenberg_filter_post_term_creation_links( $response, $post, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	// Get all taxonomies for this post type.
	$taxonomies = get_object_taxonomies( $post->post_type, 'objects' );

	foreach ( $taxonomies as $taxonomy ) {
		$create_link_relation = 'https://api.w.org/action-create-' . $taxonomy->rest_base;

		// Check if the user has the capability to create terms.
		// The 'manage_terms' capability controls term creation for taxonomies.
		if ( ! current_user_can( $taxonomy->cap->manage_terms ) ) {
			$response->remove_link( $create_link_relation );
		}

		// Also remove assign link if user cannot assign terms.
		$assign_link_relation = 'https://api.w.org/action-assign-' . $taxonomy->rest_base;
		if ( ! current_user_can( $taxonomy->cap->assign_terms ) ) {
			$response->remove_link( $assign_link_relation );
		}
	}

	return $response;
}

/**
 * Registers filters for all post types on REST API init.
 *
 * This runs after post types are registered to ensure all filters are applied.
 */
function gutenberg_register_term_creation_filters() {
	foreach ( get_post_types( array( 'show_in_rest' => true ), 'names' ) as $post_type ) {
		add_filter( "rest_prepare_{$post_type}", 'gutenberg_filter_post_term_creation_links', 10, 3 );
	}
}
add_action( 'rest_api_init', 'gutenberg_register_term_creation_filters' );
