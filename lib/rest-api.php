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
 * Registers the Global Styles REST API routes.
 */
function gutenberg_register_global_styles_endpoints() {
	$global_styles_controller = new WP_REST_Global_Styles_Controller_Gutenberg();
	$global_styles_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_global_styles_endpoints' );

if ( ! function_exists( 'gutenberg_register_edit_site_export_controller_endpoints' ) ) {
	/**
	 * Registers the Edit Site Export REST API routes.
	 */
	function gutenberg_register_edit_site_export_controller_endpoints() {
		$edit_site_export_controller = new WP_REST_Edit_Site_Export_Controller_Gutenberg();
		$edit_site_export_controller->register_routes();
	}
}

add_action( 'rest_api_init', 'gutenberg_register_edit_site_export_controller_endpoints' );
