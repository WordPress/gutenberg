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
			'read_private_posts'     => 'edit_theme_options',
			'create_posts'           => 'edit_theme_options',
			'publish_posts'          => 'edit_theme_options',
			'edit_posts'             => 'edit_theme_options',
			'edit_others_posts'      => 'edit_theme_options',
			'edit_published_posts'   => 'edit_theme_options',
			'delete_posts'           => 'edit_theme_options',
			'delete_others_posts'    => 'edit_theme_options',
			'delete_published_posts' => 'edit_theme_options',
		),
		'map_meta_cap'                   => true,
		'query_var'                      => false,
		'show_in_rest'                   => true,
		'rest_base'                      => 'font-families',
		'rest_controller_class'          => 'WP_REST_Font_Families_Controller',
		// Disable autosave endpoints for font families.
		'autosave_rest_controller_class' => 'stdClass',
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
				'read_private_posts'     => 'edit_theme_options',
				'create_posts'           => 'edit_theme_options',
				'publish_posts'          => 'edit_theme_options',
				'edit_posts'             => 'edit_theme_options',
				'edit_others_posts'      => 'edit_theme_options',
				'edit_published_posts'   => 'edit_theme_options',
				'delete_posts'           => 'edit_theme_options',
				'delete_others_posts'    => 'edit_theme_options',
				'delete_published_posts' => 'edit_theme_options',
			),
			'map_meta_cap'                   => true,
			'query_var'                      => false,
			'show_in_rest'                   => true,
			'rest_base'                      => 'font-families/(?P<font_family_id>[\d]+)/font-faces',
			'rest_controller_class'          => 'WP_REST_Font_Faces_Controller',
			// Disable autosave endpoints for font faces.
			'autosave_rest_controller_class' => 'stdClass',
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
	 * @param string   $slug_or_file Font collection slug or path/url to a JSON file defining the font collection.
	 * @param string[] $args {
	 *     Optional. Font collection associative array of configuration options.
	 *
	 *     @type string $name           Name of the font collection.
	 *     @type string $description    Description of the font collection.
	 *     @type array  $font_families  Array of font family definitions that are in the collection.
	 *     @type array  $categories     Array of categories for the fonts that are in the collection.
	 * }
	 * @return WP_Font_Collection|WP_Error A font collection is it was registered
	 *                                     successfully, else WP_Error.
	 */
	function wp_register_font_collection( $slug, $args = array() ) {
		return WP_Font_Library::register_font_collection( $slug, $args );
	}
}

if ( ! function_exists( 'wp_register_font_collection_from_json' ) ) {
	/**
	 * Registers a new Font Collection from a json file in the Font Library.
	 *
	 * @since 6.5.0
	 *
	 * @param string $file_or_url File path or URL to a JSON file containing the font collection data.
	 * @return WP_Font_Collection|WP_Error A font collection if registration was successful, else WP_Error.
	 */
	function wp_register_font_collection_from_json( $file_or_url ) {
		return WP_Font_Library::register_font_collection_from_json( $file_or_url );
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

// TODO: update to production font collection URL.
wp_register_font_collection_from_json( 'https://raw.githubusercontent.com/WordPress/google-fonts-to-wordpress-collection/01aa57731575bd13f9db8d86ab80a2d74e28a1ac/releases/gutenberg-17.6/collections/google-fonts-with-preview.json' );

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
if ( ! function_exists( '_wp_after_delete_font_family' ) ) {
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
	function _wp_after_delete_font_family( $post_id, $post ) {
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
	add_action( 'deleted_post', '_wp_after_delete_font_family', 10, 2 );
}

if ( ! function_exists( '_wp_before_delete_font_face' ) ) {
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
	function _wp_before_delete_font_face( $post_id, $post ) {
		if ( 'wp_font_face' !== $post->post_type ) {
			return;
		}

		$font_files = get_post_meta( $post_id, '_wp_font_face_file', false );

		foreach ( $font_files as $font_file ) {
			wp_delete_file( wp_get_font_dir()['path'] . '/' . $font_file );
		}
	}
	add_action( 'before_delete_post', '_wp_before_delete_font_face', 10, 2 );
}

// @core-merge: Do not merge this back compat function, it is for supporting a legacy font family format only in Gutenberg.
/**
 * Convert legacy font family posts to the new format.
 *
 * @return void
 */
function gutenberg_convert_legacy_font_family_format() {
	if ( get_option( 'gutenberg_font_family_format_converted' ) ) {
		return;
	}

	$font_families = new WP_Query(
		array(
			'post_type'              => 'wp_font_family',
			// Set a maximum, but in reality there will be far less than this.
			'posts_per_page'         => 999,
			'update_post_term_cache' => false,
		)
	);

	foreach ( $font_families->get_posts() as $font_family ) {
		$already_converted = get_post_meta( $font_family->ID, '_gutenberg_legacy_font_family', true );
		if ( $already_converted ) {
			continue;
		}

		// Stash the old font family content in a meta field just in case we need it.
		update_post_meta( $font_family->ID, '_gutenberg_legacy_font_family', $font_family->post_content );

		$font_family_json = json_decode( $font_family->post_content, true );
		if ( ! $font_family_json ) {
			continue;
		}

		$font_faces = $font_family_json['fontFace'] ?? array();
		unset( $font_family_json['fontFace'] );

		// Save wp_font_face posts within the family.
		foreach ( $font_faces as $font_face ) {
			$args                 = array();
			$args['post_type']    = 'wp_font_face';
			$args['post_title']   = WP_Font_Utils::get_font_face_slug( $font_face );
			$args['post_name']    = sanitize_title( $args['post_title'] );
			$args['post_status']  = 'publish';
			$args['post_parent']  = $font_family->ID;
			$args['post_content'] = wp_json_encode( $font_face );

			$font_face_id = wp_insert_post( wp_slash( $args ) );

			$file_urls = (array) $font_face['src'] ?? array();

			foreach ( $file_urls as $file_url ) {
				// continue if the file is not local.
				if ( false === strpos( $file_url, site_url() ) ) {
					continue;
				}

				$relative_path = basename( $file_url );
				update_post_meta( $font_face_id, '_wp_font_face_file', $relative_path );
			}
		}

		// Update the font family post to remove the font face data.
		$args               = array();
		$args['ID']         = $font_family->ID;
		$args['post_title'] = $font_family_json['name'] ?? '';
		$args['post_name']  = sanitize_title( $font_family_json['slug'] );

		unset( $font_family_json['name'] );
		unset( $font_family_json['slug'] );

		$args['post_content'] = wp_json_encode( $font_family_json );

		wp_update_post( wp_slash( $args ) );
	}

	update_option( 'gutenberg_font_family_format_converted', true );
}
add_action( 'init', 'gutenberg_convert_legacy_font_family_format' );
