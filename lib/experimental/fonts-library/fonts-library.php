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

add_action( 'init', array( 'WP_Fonts_Library', 'define_fonts_directory' ) );
add_action( 'init', array( 'WP_Fonts_Library', 'create_fonts_directory' ) );

/**
 * Registers the routes for the objects of the controller.
 */
function fonts_library_register_routes() {
	$fonts_library = new WP_REST_Fonts_Library_Controller();
	$fonts_library->register_routes();
	$fonts_library->register_post_type();
}

add_action( 'rest_api_init', 'fonts_library_register_routes' );
