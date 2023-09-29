<?php
/**
 * Font Library initialization.
 *
 * This file contains Font Library init calls.
 *
 * @package    WordPress
 * @subpackage Font Library
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
function gutenberg_init_font_library_routes() {
	// @core-merge: This code will go into Core's `create_initial_post_types()`.
	$args = array(
		'public'       => false,
		'_builtin'     => true,  /* internal use only. don't use this when registering your own post type. */
		'label'        => 'Font Library',
		'show_in_rest' => true,
	);
	register_post_type( 'wp_font_family', $args );

	// @core-merge: This code will go into Core's `create_initial_rest_routes()`.
	$font_library_controller = new WP_REST_Font_Library_Controller();
	$font_library_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_init_font_library_routes' );


if ( ! function_exists( 'wp_register_font_collection' ) ) {
	/**
	 * Registers a new Font Collection in the Font Library.
	 *
	 * @since 6.4.0
	 *
	 * @param string[] $config {
	 *     Font collection associative array of configuration options.
	 *
	 *     @type string $id             The font collection's unique ID.
	 *     @type string $src The font collection's data JSON file.
	 * }
	 * @return WP_Font_Collection|WP_Error A font collection is it was registered
	 *                                     successfully, else WP_Error.
	 */
	function wp_register_font_collection( $config ) {
		return WP_Font_Library::register_font_collection( $config );
	}
}


$default_font_collection = array(
	'id'          => 'default-font-collection',
	'name'        => 'Google Fonts',
	'description' => __( 'Add from Google Fonts. Fonts are copied to and served from your site.', 'gutenberg' ),
	'src'         => 'https://s.w.org/images/fonts/16.7/collections/google-fonts-with-preview.json',
);

wp_register_font_collection( $default_font_collection );
