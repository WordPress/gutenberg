<?php
/**
 * WordPress 7.2 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the View Config REST API routes with the 7.2 controller.
 *
 * Replaces the registration made for 7.1, so that the endpoint is served by the
 * controller carrying the schema of this release.
 */
function gutenberg_register_view_config_controller_endpoints_7_2() {
	$view_config_controller = new Gutenberg_REST_View_Config_Controller_7_2();
	$view_config_controller->register_routes();
}
remove_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints', PHP_INT_MAX );
add_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints_7_2', PHP_INT_MAX );
