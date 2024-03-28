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
function gutenberg_create_initial_post_types() {
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
}

/**
 * Initializes REST routes.
 *
 * @global string $wp_version The WordPress version string.
 */
function gutenberg_create_initial_rest_routes() {
	global $wp_version;

	// Runs only if the Font Library is not available in core ( i.e. in core < 6.5-alpha ).
	if ( version_compare( $wp_version, '6.5-alpha', '<' ) ) {
		$font_collections_controller = new WP_REST_Font_Collections_Controller();
		$font_collections_controller->register_routes();
	}
}

add_action( 'rest_api_init', 'gutenberg_create_initial_rest_routes' );

/**
 * Initializes REST routes and post types.
 *
 * @global string $wp_version The WordPress version string.
 */
function gutenberg_init_font_library() {
	global $wp_version;

	// Runs only if the Font Library is not available in core ( i.e. in core < 6.5-alpha ).
	if ( version_compare( $wp_version, '6.5-alpha', '<' ) ) {
		gutenberg_create_initial_post_types();
	}
}

add_action( 'init', 'gutenberg_init_font_library' );


if ( ! function_exists( 'wp_register_font_collection' ) ) {
	/**
	 * Registers a new font collection in the font library.
	 *
	 * See {@link https://schemas.wp.org/trunk/font-collection.json} for the schema
	 * the font collection data must adhere to.
	 *
	 * @since 6.5.0
	 *
	 * @param string $slug Font collection slug. May only contain alphanumeric characters, dashes,
	 *                     and underscores. See sanitize_title().
	 * @param array  $args {
	 *     Font collection data.
	 *
	 *     @type string       $name          Required. Name of the font collection shown in the Font Library.
	 *     @type string       $description   Optional. A short descriptive summary of the font collection. Default empty.
	 *     @type array|string $font_families Required. Array of font family definitions that are in the collection,
	 *                                       or a string containing the path or URL to a JSON file containing the font collection.
	 *     @type array        $categories    Optional. Array of categories, each with a name and slug, that are used by the
	 *                                       fonts in the collection. Default empty.
	 * }
	 * @return WP_Font_Collection|WP_Error A font collection if it was registered
	 *                                     successfully, or WP_Error object on failure.
	 */
	function wp_register_font_collection( string $slug, array $args ) {
		return WP_Font_Library::get_instance()->register_font_collection( $slug, $args );
	}
}

if ( ! function_exists( 'wp_unregister_font_collection' ) ) {
	/**
	 * Unregisters a font collection from the Font Library.
	 *
	 * @since 6.5.0
	 *
	 * @param string $slug Font collection slug.
	 * @return bool True if the font collection was unregistered successfully, else false.
	 */
	function wp_unregister_font_collection( string $slug ) {
		return WP_Font_Library::get_instance()->unregister_font_collection( $slug );
	}
}

function gutenberg_register_font_collections() {
	if ( null !== WP_Font_Library::get_instance()->get_font_collection( 'google-fonts' ) ) {
		return;
	}
	wp_register_font_collection(
		'google-fonts',
		array(
			'name'          => _x( 'Google Fonts', 'font collection name', 'gutenberg' ),
			'description'   => __( 'Install from Google Fonts. Fonts are copied to and served from your site.', 'gutenberg' ),
			'font_families' => 'https://s.w.org/images/fonts/wp-6.5/collections/google-fonts-with-preview.json',
			'categories'    => array(
				array(
					'name' => _x( 'Sans Serif', 'font category', 'gutenberg' ),
					'slug' => 'sans-serif',
				),
				array(
					'name' => _x( 'Display', 'font category', 'gutenberg' ),
					'slug' => 'display',
				),
				array(
					'name' => _x( 'Serif', 'font category', 'gutenberg' ),
					'slug' => 'serif',
				),
				array(
					'name' => _x( 'Handwriting', 'font category', 'gutenberg' ),
					'slug' => 'handwriting',
				),
				array(
					'name' => _x( 'Monospace', 'font category', 'gutenberg' ),
					'slug' => 'monospace',
				),
			),
		)
	);
}
add_action( 'init', 'gutenberg_register_font_collections', 11 );

// @core-merge: This code should probably go into Core's src/wp-includes/fonts.php.
if ( ! function_exists( 'wp_get_font_dir' ) ) {
	/**
	 * Retrieves font uploads directory information.
	 *
	 * Same as wp_font_dir() but "light weight" as it doesn't attempt to create the font uploads directory.
	 * Intended for use in themes, when only 'basedir' and 'baseurl' are needed, generally in all cases
	 * when not uploading files.
	 *
	 * @since 6.5.0
	 *
	 * @see wp_font_dir()
	 *
	 * @return array See wp_font_dir() for description.
	 */
	function wp_get_font_dir() {
		return wp_font_dir( false );
	}
}

// @core-merge: This code should probably go into Core's src/wp-includes/fonts.php.
if ( ! function_exists( 'wp_font_dir' ) ) {
	/**
	 * Returns an array containing the current fonts upload directory's path and URL.
	 *
	 * @since 6.5.0
	 *
	 * @param bool $create_dir Optional. Whether to check and create the font uploads directory. Default true.
	 * @return array {
	 *     Array of information about the font upload directory.
	 *
	 *     @type string       $path    Base directory and subdirectory or full path to the fonts upload directory.
	 *     @type string       $url     Base URL and subdirectory or absolute URL to the fonts upload directory.
	 *     @type string       $subdir  Subdirectory
	 *     @type string       $basedir Path without subdir.
	 *     @type string       $baseurl URL path without subdir.
	 *     @type string|false $error   False or error message.
	 * }
	 */
	function wp_font_dir( $create_dir = true ) {
		/*
		 * Allow extenders to manipulate the font directory consistently.
		 *
		 * Ensures the upload_dir filter is fired both when calling this function
		 * directly and when the upload directory is filtered in the Font Face
		 * REST API endpoint.
		 */
		add_filter( 'upload_dir', '_wp_filter_font_directory' );
		$font_dir = wp_upload_dir( null, $create_dir, false );
		remove_filter( 'upload_dir', '_wp_filter_font_directory' );
		return $font_dir;
	}
}

// @core-merge: This code should probably go into Core's src/wp-includes/fonts.php.
if ( ! function_exists( '_wp_filter_font_directory' ) ) {
	/**
	 * Returns the font directory for use by the font library.
	 *
	 * This function is a callback for the {@see 'upload_dir'} filter. It is not
	 * intended to be called directly. Use wp_get_font_dir() instead.
	 *
	 * The function can be used when extending the font library to modify the upload
	 * destination for font files via the upload_dir filter. The recommended way to
	 * do this is:
	 *
	 * ```php
	 * add_filter( 'upload_dir', '_wp_filter_font_directory' );
	 * // Your code to upload or sideload a font file.
	 * remove_filter( 'upload_dir', '_wp_filter_font_directory' );
	 * ```
	 *
	 * @since 6.5.0
	 * @access private
	 *
	 * @param string $font_dir The font directory.
	 * @return string The modified font directory.
	 */
	function _wp_filter_font_directory( $font_dir ) {
		if ( doing_filter( 'font_dir' ) ) {
			// Avoid an infinite loop.
			return $font_dir;
		}

		$site_path = '';
		if ( is_multisite() && ! ( is_main_network() && is_main_site() ) ) {
			$site_path = '/sites/' . get_current_blog_id();
		}

		$font_dir = array(
			'path'    => path_join( WP_CONTENT_DIR, 'fonts' ) . $site_path,
			'url'     => untrailingslashit( content_url( 'fonts' ) ) . $site_path,
			'subdir'  => '',
			'basedir' => path_join( WP_CONTENT_DIR, 'fonts' ) . $site_path,
			'baseurl' => untrailingslashit( content_url( 'fonts' ) ) . $site_path,
			'error'   => false,
		);

		/**
		 * Filters the fonts directory data.
		 *
		 * This filter allows developers to modify the fonts directory data.
		 *
		 * @since 6.5.0
		 *
		 * @param array $font_dir {
		 *     Array of information about the font upload directory.
		 *
		 *     @type string       $path    Base directory and subdirectory or full path to the fonts upload directory.
		 *     @type string       $url     Base URL and subdirectory or absolute URL to the fonts upload directory.
		 *     @type string       $subdir  Subdirectory
		 *     @type string       $basedir Path without subdir.
		 *     @type string       $baseurl URL path without subdir.
		 *     @type string|false $error   False or error message.
		 * }
		 */
		return apply_filters( 'font_dir', $font_dir );
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
	 */
	function _wp_before_delete_font_face( $post_id, $post ) {
		if ( 'wp_font_face' !== $post->post_type ) {
			return;
		}

		$font_files = get_post_meta( $post_id, '_wp_font_face_file', false );
		$font_dir   = wp_get_font_dir()['path'];

		foreach ( $font_files as $font_file ) {
			wp_delete_file( $font_dir . '/' . $font_file );
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

		$font_faces = isset( $font_family_json['fontFace'] ) ? $font_family_json['fontFace'] : array();
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

			$file_urls = (array) ( isset( $font_face['src'] ) ? $font_face['src'] : array() );

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
		$args['post_title'] = isset( $font_family_json['name'] ) ? $font_family_json['name'] : '';
		$args['post_name']  = sanitize_title( $font_family_json['slug'] );

		unset( $font_family_json['name'] );
		unset( $font_family_json['slug'] );

		$args['post_content'] = wp_json_encode( $font_family_json );

		wp_update_post( wp_slash( $args ) );
	}

	update_option( 'gutenberg_font_family_format_converted', true );
}
add_action( 'init', 'gutenberg_convert_legacy_font_family_format' );
