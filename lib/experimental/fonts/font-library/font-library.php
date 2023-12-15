<?php
/**
 * Font Library initialization.
 *
 * This file contains Font Library init calls.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.5.0
 */

/**
 * Registers the routes for the objects of the controller.
 *
 * This function will not be merged into Core. However, the
 * code in the function will be. @core-merge annotation
 * provides instructions on where the could needs to go
 * in Core.
 *
 * @since 6.5.0
 */
function gutenberg_init_font_library_routes() {
	// @core-merge: This code will go into Core's `create_initial_post_types()`.
	$args = array(
		'public'       => false,
		'_builtin'     => true,  /* internal use only. don't use this when registering your own post type. */
		'label'        => 'Font Library',
		'show_in_rest' => true,
		'rest_base'    => 'font-families',
	);
	register_post_type( 'wp_font_family', $args );

	// @core-merge: This code will go into Core's `create_initial_rest_routes()`.
	$font_library_controller = new WP_REST_Font_Library_Controller();
	$font_library_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_init_font_library_routes' );

/**
 * Removes some default endpoints for the Font Library added when registering the wp_font_family post type.
 *
 * @core-merge: This code needs to be removed after the Font Library API redesign.
 *
 * @param array $endpoints The default endpoints.
 * @return array The modified endpoints.
 */
function remove_font_families_default_endpoints( $endpoints ) {
	unset( $endpoints['/wp/v2/font-families/(?P<id>[\d]+)'] );
	unset( $endpoints['/wp/v2/font-families/(?P<id>[\d]+)/autosaves'] );
	unset( $endpoints['/wp/v2/font-families/(?P<parent>[\d]+)/autosaves/(?P<id>[\d]+)'] );

	// Removes the default POST endpoint for the wp_font_family post type to use just the custom one.
	foreach ( $endpoints['/wp/v2/font-families'] as $endpoint => $details ) {
		if ( ! isset( $details['args']['font_families'] ) && isset( $details['methods'] ) && $details['methods'] === 'POST' ) {
			unset( $endpoints['/wp/v2/font-families'][ $endpoint ] );
		}
	}

	return $endpoints;
}

add_filter( 'rest_endpoints', 'remove_font_families_default_endpoints' );

if ( ! function_exists( 'wp_register_font_collection' ) ) {
	/**
	 * Registers a new Font Collection in the Font Library.
	 *
	 * @since 6.5.0
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
