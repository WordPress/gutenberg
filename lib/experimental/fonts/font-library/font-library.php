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
		'labels'                         => array(
			'name'          => __( 'Font Families', 'gutenberg' ),
			'singular_name' => __( 'Font Family', 'gutenberg' ),
		),
		'public'                         => false,
		'_builtin'                       => true, /* internal use only. don't use this when registering your own post type. */
		'hierarchical'                   => false,
		'capabilities'                   => array(
			'read'                   => 'edit_theme_options',
			'read_post'              => 'edit_theme_options',
			'read_private_posts'     => 'edit_theme_options',
			'create_posts'           => 'edit_theme_options',
			'publish_posts'          => 'edit_theme_options',
			'edit_post'              => 'edit_theme_options',
			'edit_posts'             => 'edit_theme_options',
			'edit_others_posts'      => 'edit_theme_options',
			'edit_published_posts'   => 'edit_theme_options',
			'delete_post'            => 'edit_theme_options',
			'delete_posts'           => 'edit_theme_options',
			'delete_others_posts'    => 'edit_theme_options',
			'delete_published_posts' => 'edit_theme_options',
		),
		'map_meta_cap'                   => false,
		'query_var'                      => false,
		'show_in_rest'                   => true,
		'rest_base'                      => 'font-families',
		'rest_controller_class'          => 'WP_REST_Font_Families_Controller',
		'autosave_rest_controller_class' => 'WP_REST_Autosave_Fonts_Controller',
	);
	register_post_type( 'wp_font_family', $args );

	register_post_type(
		'wp_font_face',
		array(
			'labels'                         => array(
				'name'          => __( 'Font Faces', 'gutenberg' ),
				'singular_name' => __( 'Font Face', 'gutenberg' ),
			),
			'public'                         => false,
			'_builtin'                       => true, /* internal use only. don't use this when registering your own post type. */
			'hierarchical'                   => false,
			'capabilities'                   => array(
				'read'                   => 'edit_theme_options',
				'read_post'              => 'edit_theme_options',
				'read_private_posts'     => 'edit_theme_options',
				'create_posts'           => 'edit_theme_options',
				'publish_posts'          => 'edit_theme_options',
				'edit_post'              => 'edit_theme_options',
				'edit_posts'             => 'edit_theme_options',
				'edit_others_posts'      => 'edit_theme_options',
				'edit_published_posts'   => 'edit_theme_options',
				'delete_post'            => 'edit_theme_options',
				'delete_posts'           => 'edit_theme_options',
				'delete_others_posts'    => 'edit_theme_options',
				'delete_published_posts' => 'edit_theme_options',
			),
			'map_meta_cap'                   => false,
			'query_var'                      => false,
			'show_in_rest'                   => true,
			'rest_base'                      => 'font-faces',
			'rest_controller_class'          => 'WP_REST_Font_Faces_Controller',
			'autosave_rest_controller_class' => 'WP_REST_Autosave_Fonts_Controller',
		)
	);

	// @core-merge: This code will go into Core's `create_initial_rest_routes()`.
	$font_collections_controller = new WP_REST_Font_Collections_Controller();
	$font_collections_controller->register_routes();
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
	 *     @type string $src            The font collection's data as a JSON file path.
	 *     @type array  $data           The font collection's data as a PHP array.
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
	'slug'        => 'default-font-collection',
	'name'        => 'Google Fonts',
	'description' => __( 'Add from Google Fonts. Fonts are copied to and served from your site.', 'gutenberg' ),
	'src'         => 'https://s.w.org/images/fonts/16.7/collections/google-fonts-with-preview.json',
);

wp_register_font_collection( $default_font_collection );

// @core-merge: This code should probably go into Core's src/wp-includes/functions.php.
if ( ! function_exists( 'wp_get_font_dir' ) ) {
	/**
	 * Returns an array containing the current fonts upload directory's path and URL.
	 *
	 * @since 6.5.0
	 *
	 * @param array $defaults {
	 *     Array of information about the upload directory.
	 *
	 *     @type string       $path    Base directory and subdirectory or full path to the fonts upload directory.
	 *     @type string       $url     Base URL and subdirectory or absolute URL to the fonts upload directory.
	 *     @type string       $subdir  Subdirectory
	 *     @type string       $basedir Path without subdir.
	 *     @type string       $baseurl URL path without subdir.
	 *     @type string|false $error   False or error message.
	 * }
	 *
	 * @return array $defaults {
	 *     Array of information about the upload directory.
	 *
	 *     @type string       $path    Base directory and subdirectory or full path to the fonts upload directory.
	 *     @type string       $url     Base URL and subdirectory or absolute URL to the fonts upload directory.
	 *     @type string       $subdir  Subdirectory
	 *     @type string       $basedir Path without subdir.
	 *     @type string       $baseurl URL path without subdir.
	 *     @type string|false $error   False or error message.
	 * }
	 */
	function wp_get_font_dir( $defaults = array() ) {
		// Multi site path
		$site_path = '';
		if ( is_multisite() && ! ( is_main_network() && is_main_site() ) ) {
			$site_path = '/sites/' . get_current_blog_id();
		}

		// Sets the defaults.
		$defaults['path']    = path_join( WP_CONTENT_DIR, 'fonts' ) . $site_path;
		$defaults['url']     = untrailingslashit( content_url( 'fonts' ) ) . $site_path;
		$defaults['subdir']  = '';
		$defaults['basedir'] = path_join( WP_CONTENT_DIR, 'fonts' ) . $site_path;
		$defaults['baseurl'] = untrailingslashit( content_url( 'fonts' ) ) . $site_path;
		$defaults['error']   = false;

		// Filters the fonts directory data.
		return apply_filters( 'font_dir', $defaults );
	}
}

// @core-merge: Filters should go in `src/wp-includes/default-filters.php`,
// functions in a general file for font library.
if ( ! function_exists( '_wp_delete_font_family' ) ) {
	/**
	 * Deletes child font faces when a font family is deleted.
	 *
	 * @access private
	 * @since 6.5.0
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 * @return void
	 */
	function _wp_delete_font_family( $post_id, $post ) {
		if ( 'wp_font_family' !== $post->post_type ) {
			return;
		}

		$font_faces = get_children(
			array(
				'post_parent' => $post_id,
				'post_type'   => 'wp_font_face',
			)
		);

		foreach ( $font_faces as $font_face ) {
			wp_delete_post( $font_face->ID, true );
		}
	}
	add_action( 'deleted_post', '_wp_delete_font_family', 10, 2 );
}

if ( ! function_exists( '_wp_delete_font_face' ) ) {
	/**
	 * Deletes associated font files when a font face is deleted.
	 *
	 * @access private
	 * @since 6.5.0
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 * @return void
	 */
	function _wp_delete_font_face( $post_id, $post ) {
		if ( 'wp_font_face' !== $post->post_type ) {
			return;
		}

		$font_files = get_post_meta( $post_id, '_wp_font_face_files', false );

		foreach ( $font_files as $font_file ) {
			wp_delete_file( wp_get_font_dir()['path'] . '/' . $font_file );
		}
	}
	add_action( 'before_delete_post', '_wp_delete_font_face', 10, 2 );
}
