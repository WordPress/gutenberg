<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Overrides `/settings` REST API routes.
 *
 * Note: Needs to be high priority than `create_initial_rest_routes`
 * to override the default settings routes.
 */
function gutenberg_register_rest_settings_routes() {
	$settings = new Gutenberg_REST_Settings_Controller();
	$settings->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_settings_routes', 100 );
