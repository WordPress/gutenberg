<?php
/**
 * WordPress 7.3 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the View Config REST API routes.
 *
 * Replaces the 7.2 registration so the route is served by the 7.3 controller.
 */
function gutenberg_register_view_config_controller_endpoints_7_3() {
	$view_config_controller = new Gutenberg_REST_View_Config_Controller_7_3();
	$view_config_controller->register_routes();
}
remove_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints_7_2', PHP_INT_MAX );
add_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints_7_3', PHP_INT_MAX );
