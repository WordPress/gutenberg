<?php
/**
 * WordPress 7.3 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the Navigation fallback REST API route.
 *
 * Runs before Core's `create_initial_rest_routes()` (priority 99), so the
 * 7.3 controller's handler is registered first and serves the route.
 *
 * @see Gutenberg_REST_Navigation_Fallback_Controller_7_3
 */
function gutenberg_register_navigation_fallback_controller_endpoints_7_3() {
	$navigation_fallback_controller = new Gutenberg_REST_Navigation_Fallback_Controller_7_3();
	$navigation_fallback_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_navigation_fallback_controller_endpoints_7_3' );
