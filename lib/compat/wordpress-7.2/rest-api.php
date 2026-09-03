<?php
/**
 * WordPress 7.2 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the View Config REST API routes.
 *
 * Replaces the 7.1 registration so the route is served by the 7.2 controller.
 */
function gutenberg_register_view_config_controller_endpoints_7_2() {
	$view_config_controller = new Gutenberg_REST_View_Config_Controller_7_2();
	$view_config_controller->register_routes();
}
remove_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints', PHP_INT_MAX );
add_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints_7_2', PHP_INT_MAX );

/**
 * Registers the Templates and Template Parts REST API routes.
 *
 * Runs after the WordPress 7.0 filters of the same shape, so this controller
 * class wins.
 *
 * @see Gutenberg_REST_Templates_Controller_7_2
 *
 * @param array $args Array of arguments for registering a post type.
 * @return array Modified array of arguments.
 */
function gutenberg_modify_template_post_type_args_7_2( $args ) {
	$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_7_2';
	return $args;
}
add_filter( 'register_wp_template_post_type_args', 'gutenberg_modify_template_post_type_args_7_2' );
add_filter( 'register_wp_template_part_post_type_args', 'gutenberg_modify_template_post_type_args_7_2' );
