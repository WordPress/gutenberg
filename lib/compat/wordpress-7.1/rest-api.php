<?php
/**
 * WordPress 7.1 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the Icons REST API routes.
 */
function gutenberg_register_icons_controller_endpoints() {
	$icons_controller = new Gutenberg_REST_Icons_Controller_7_1();
	$icons_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_icons_controller_endpoints', PHP_INT_MAX );
