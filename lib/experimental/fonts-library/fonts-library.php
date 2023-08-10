<?php
/**
 * Fonts Library initialization.
 *
 * This file contains fonts library init calls.
 *
 * @package    WordPress
 * @subpackage Fonts Library
 * @since      6.4.0
 */

if ( ! function_exists( 'fonts_library_init' ) ) {
	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @since 6.4.0
	 */
	function fonts_library_init() {
		WP_Fonts_Library::register_post_type();
		$fonts_library_controller = new WP_REST_Fonts_Library_Controller();
		$fonts_library_controller->register_routes();
	}

	add_action( 'rest_api_init', 'fonts_library_init' );
}

