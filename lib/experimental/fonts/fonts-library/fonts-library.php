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
	// @core-merge: This code will go into Core's `create_initial_post_types()`.
	$args = array(
		'public'       => true,
		'label'        => 'Font Library',
		'show_in_rest' => true,
	);
	register_post_type( 'wp_font_family', $args );

	// @core-merge: This code will go into Core's `create_initial_rest_routes()`.
	$fonts_library_controller = new WP_REST_Fonts_Library_Controller();
	$fonts_library_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_init_fonts_library' );

