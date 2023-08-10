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

if ( ! function_exists( 'gutenberg_init_fonts_library' ) ) {
	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * This function will not be merged into Core. However, the
	 * code in the function will be. @core-merge annotation
	 * provides instructions on where the could needs to go
	 * in Core.
	 *
	 * @since 6.4.0
	 */
	function gutenberg_init_fonts_library() {
		// @core-merge: This code will not go into Core. Rather,
		// the code in the static method goes into Core's `create_initial_post_types()`.
		WP_Fonts_Library::register_post_type();

		// @core-merge: This code will go into Core's `create_initial_rest_routes()`.
		$fonts_library_controller = new WP_REST_Fonts_Library_Controller();
		$fonts_library_controller->register_routes();
	}

	add_action( 'rest_api_init', 'gutenberg_init_fonts_library' );
}

