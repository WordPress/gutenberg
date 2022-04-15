<?php
/**
 * Overrides Core's wp-includes/rest-api.php and registers the new endpoint for WP 6.0.
 *
 * @package gutenberg
 */

 /**
 * Registers the Edit Site's Save theme REST API routes.
 *
 * @return void
 */
function gutenberg_register_edit_site_save_theme_endpoint() {
	$editor_settings = new Gutenberg_REST_Edit_Site_Export_Controller_6_1();
	$editor_settings->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_edit_site_save_theme_endpoint' );
