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

if ( ! function_exists( 'sanitize_font_family_content' ) ) {
	/**
	 * Sanitize font family content.
	 *
	 * @param array $data                An array of slashed and processed post data.
	 * @param array $postarr             An array of sanitized (and slashed) but otherwise unmodified post data.
	 * @param array $unsanitized_postarr An array of slashed yet *unsanitized* and unprocessed post data as originally passed to wp_insert_post().
	 *
	 * @return array The post data that will be inserted in the database.
	 */
	function sanitize_font_family_content( $data, $postarr, $unsanitized_postarr ) {
		// Check if the post type is 'wp_font_family'.
		if ( isset( $postarr['post_type'] ) && 'wp_font_family' === $postarr['post_type'] ) {
			$data['post_content'] = WP_Font_Family_Utils::sanitize( $unsanitized_postarr['post_content'] );
		}
		// Return the (possibly modified) data.
		return $data;
	}

	add_filter( 'wp_insert_post_data', 'sanitize_font_family_content', 10, 3 );
}

$default_font_collection = array(
	'id'          => 'default-font-collection',
	'name'        => 'Google Fonts',
	'description' => __( 'Add from Google Fonts. Fonts are copied to and served from your site.', 'gutenberg' ),
	'src'         => 'https://s.w.org/images/fonts/16.7/collections/google-fonts-with-preview.json',
);

wp_register_font_collection( $default_font_collection );
