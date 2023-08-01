<?php
/**
 * Fonts Library initialization.
 *
 * This file contains fonts library init calls.
 *
 * @package    Gutenberg
 * @subpackage Fonts Library
 * @since      X.X.X
 */

/**
 * Registers the routes for the objects of the controller.
 */
function fonts_library_register_routes() {
	$fonts_library = new WP_REST_Fonts_Library_Controller();
	$fonts_library->register_routes();
	$fonts_library->register_post_type();
}

add_action( 'rest_api_init', 'fonts_library_register_routes' );
