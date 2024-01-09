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
		'public'                         => false,
		'_builtin'                       => true,  /* internal use only. don't use this when registering your own post type. */
		'label'                          => 'Font Family',
		'show_in_rest'                   => true,
		'rest_base'                      => 'font-families',
		'rest_controller_class'          => 'WP_REST_Font_Families_Controller',
		'autosave_rest_controller_class' => 'WP_REST_Autosave_Font_Families_Controller',
	);
	register_post_type( 'wp_font_family', $args );

	register_post_type(
		'wp_font_face',
		array(
			'labels'       => array(
				'name'          => __( 'Font Faces', 'gutenberg' ),
				'singular_name' => __( 'Font Face', 'gutenberg' ),
			),
			'public'       => false,
			'_builtin'     => true,                              /* internal use only. don't use this when registering your own post type. */
			'hierarchical' => false,
			'show_in_rest' => false,
			'rest_base'    => 'font-faces',
			// TODO: Add custom font capability
			'capabilities' => array(
				'read'                   => 'edit_theme_options',
				'read_post'              => 'edit_theme_options',
				'read_private_posts'     => 'edit_theme_options',
				'create_posts'           => 'edit_theme_options',
				'edit_post'              => 'edit_theme_options',
				'edit_posts'             => 'edit_theme_options',
				'publish_posts'          => 'edit_theme_options',
				'edit_published_posts'   => 'edit_theme_options',
				'delete_posts'           => 'edit_theme_options',
				'delete_post'            => 'edit_theme_options',
				'delete_published_posts' => 'edit_theme_options',
				'edit_others_posts'      => 'edit_theme_options',
				'delete_others_posts'    => 'edit_theme_options',
			),
			'map_meta_cap' => false,
			'query_var'    => false,
		)
	);

	// @core-merge: This code will go into Core's `create_initial_rest_routes()`.
	$font_collections_controller = new WP_REST_Font_Collections_Controller();
	$font_collections_controller->register_routes();

	$font_faces_controller = new WP_REST_Font_Faces_Controller();
	$font_faces_controller->register_routes();
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

if ( ! function_exists( 'wp_unregister_font_collection' ) ) {
	/**
	 * Unregisters a font collection from the Font Library.
	 *
	 * @since 6.5.0
	 *
	 * @param string $collection_id The font collection ID.
	 */
	function wp_unregister_font_collection( $collection_id ) {
		WP_Font_Library::unregister_font_collection( $collection_id );
	}

}

$default_font_collection = array(
	'id'          => 'default-font-collection',
	'name'        => 'Google Fonts',
	'description' => __( 'Add from Google Fonts. Fonts are copied to and served from your site.', 'gutenberg' ),
	'src'         => 'https://s.w.org/images/fonts/16.7/collections/google-fonts-with-preview.json',
);

wp_register_font_collection( $default_font_collection );
