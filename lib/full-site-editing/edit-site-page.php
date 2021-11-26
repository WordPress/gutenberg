<?php
/**
 * Bootstrapping the Gutenberg Edit Site Page.
 *
 * @package gutenberg
 */

/**
 * The main entry point for the Gutenberg Edit Site Page.
 *
 * @since 7.2.0
 */
function gutenberg_edit_site_page() {
	?>
	<div
		id="edit-site-editor"
		class="edit-site"
	>
	</div>
	<?php
}

/**
 * Checks whether the provided page is one of allowed Site Editor pages.
 *
 * @param string $page Page to check.
 *
 * @return bool True for Site Editor pages, false otherwise.
 */
function gutenberg_is_edit_site_page( $page ) {
	return 'appearance_page_gutenberg-edit-site' === $page;
}

/**
 * Checks whether the provided page is the templates list page.
 *
 * @return bool True for Site Editor pages, false otherwise.
 */
function gutenberg_is_edit_site_list_page() {
	return isset( $_GET['postType'] ) && ! isset( $_GET['postId'] );
}

/**
 * Load editor styles (this is copied from edit-form-blocks.php).
 * Ideally the code is extracted into a reusable function.
 *
 * @return array Editor Styles Setting.
 */
function gutenberg_get_editor_styles() {
	global $editor_styles;

	// Ideally the code is extracted into a reusable function.
	$styles = array();

	if ( $editor_styles && current_theme_supports( 'editor-styles' ) ) {
		foreach ( $editor_styles as $style ) {
			if ( preg_match( '~^(https?:)?//~', $style ) ) {
				$response = wp_remote_get( $style );
				if ( ! is_wp_error( $response ) ) {
					$styles[] = array(
						'css' => wp_remote_retrieve_body( $response ),
					);
				}
			} else {
				$file = get_theme_file_path( $style );
				if ( is_file( $file ) ) {
					$styles[] = array(
						'css'     => file_get_contents( $file ),
						'baseURL' => get_theme_file_uri( $style ),
					);
				}
			}
		}
	}

	return $styles;
}

/**
 * Preloads data for the templates list page.
 *
 * @param WP_Post_Type $post_type The post type that the list page will show.
 */
function gutenberg_edit_site_list_preload_data( $post_type ) {
	$posts_path = "/wp/v2/$post_type->rest_base?context=edit&per_page=-1";
	$path       = untrailingslashit( $posts_path );
	$path_parts = parse_url( $path );
	$request    = new WP_REST_Request( 'GET', $path_parts['path'] );

	if ( ! empty( $path_parts['query'] ) ) {
		parse_str( $path_parts['query'], $query_params );
		$request->set_query_params( $query_params );
	}

	$dynamic_preload_requests = array();
	$response                 = rest_do_request( $request );

	if ( 200 === $response->status ) {
		$server = rest_get_server();
		$posts  = (array) $server->response_to_data( $response, false );

		foreach ( $posts as $post_data ) {
			if ( ! empty( $post_data['author'] ) ) {
				$author_id                  = $post_data['author'];
				$dynamic_preload_requests[] = "/wp/v2/users/$author_id?context=edit";
			}

			if ( 'wp_template' === $post_data['type'] || 'wp_template_part' === $post_data['type'] ) {
				$has_theme_origin_or_source =
					( ! empty( $post_data['source'] ) && 'theme' === $post_data['source'] ) ||
					( ! empty( $post_data['origin'] ) && 'theme' === $post_data['origin'] );

				if ( $has_theme_origin_or_source ) {
					$theme_id                   = $post_data['theme'];
					$dynamic_preload_requests[] = "/wp/v2/themes/$theme_id?context=edit";
				}

				$has_plugin_origin_or_source =
					( ! empty( $post_data['source'] ) && 'plugin' === $post_data['source'] ) ||
					( ! empty( $post_data['origin'] ) && 'plugin' === $post_data['origin'] );

				if ( $has_plugin_origin_or_source ) {
					$plugin_id                  = $post_data['theme'];
					$dynamic_preload_requests[] = "/wp/v2/plugins/$plugin_id?context=edit";
				}
			}
		}
	}

	$preload_data = array_reduce(
		array_merge(
			array(
				'/',
				"/wp/v2/types/$post_type->name?context=edit",
				'/wp/v2/types?context=edit',
				$posts_path,
			),
			array_unique( $dynamic_preload_requests )
		),
		'rest_preload_api_request',
		array()
	);

	wp_add_inline_script(
		'wp-api-fetch',
		sprintf(
			'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );',
			wp_json_encode( $preload_data )
		),
		'after'
	);
}

/**
 * Initialize the Gutenberg Templates List Page.
 *
 * @param array $settings The editor settings.
 */
function gutenberg_edit_site_list_init( $settings ) {
	wp_enqueue_script( 'wp-edit-site' );
	wp_enqueue_style( 'wp-edit-site' );
	wp_enqueue_media();

	$post_type = get_post_type_object( $_GET['postType'] );

	if ( ! $post_type ) {
		wp_die( __( 'Invalid post type.', 'gutenberg' ) );
	}

	gutenberg_edit_site_list_preload_data( $post_type );

	wp_add_inline_script(
		'wp-edit-site',
		sprintf(
			'wp.domReady( function() {
				wp.editSite.initializeList( "%s", "%s", %s );
			} );',
			'edit-site-editor',
			$post_type->name,
			wp_json_encode( $settings )
		)
	);
}

/**
 * Initialize the Gutenberg Site Editor.
 *
 * @since 7.2.0
 *
 * @param string $hook Page.
 */
function gutenberg_edit_site_init( $hook ) {
	global $current_screen, $post, $editor_styles;

	if ( ! gutenberg_is_edit_site_page( $hook ) ) {
		return;
	}

	// Default to is-fullscreen-mode to avoid rendering wp-admin navigation menu while loading and
	// having jumps in the UI.
	add_filter(
		'admin_body_class',
		static function( $classes ) {
			return "$classes is-fullscreen-mode";
		}
	);

	$custom_settings = array(
		'siteUrl'                              => site_url(),
		'postsPerPage'                         => get_option( 'posts_per_page' ),
		'styles'                               => gutenberg_get_editor_styles(),
		'defaultTemplateTypes'                 => gutenberg_get_indexed_default_template_types(),
		'defaultTemplatePartAreas'             => get_allowed_block_template_part_areas(),
		'__experimentalBlockPatterns'          => WP_Block_Patterns_Registry::get_instance()->get_all_registered(),
		'__experimentalBlockPatternCategories' => WP_Block_Pattern_Categories_Registry::get_instance()->get_all_registered(),
	);

	if ( gutenberg_is_edit_site_list_page() ) {
		return gutenberg_edit_site_list_init( $custom_settings );
	}

	/**
	 * Make the WP Screen object aware that this is a block editor page.
	 * Since custom blocks check whether the screen is_block_editor,
	 * this is required for custom blocks to be loaded.
	 * See wp_enqueue_registered_block_scripts_and_styles in wp-includes/script-loader.php
	 */
	$current_screen->is_block_editor( true );

	$site_editor_context     = new WP_Block_Editor_Context();
	$settings                = gutenberg_get_block_editor_settings( $custom_settings, $site_editor_context );
	$active_global_styles_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_custom_post_type_id();
	$active_theme            = wp_get_theme()->get_stylesheet();
	gutenberg_initialize_editor(
		'edit_site_editor',
		'edit-site',
		array(
			'preload_paths'    => array_merge(
				gutenberg_get_navigation_areas_paths_to_preload(),
				array(
					array( '/wp/v2/media', 'OPTIONS' ),
					'/',
					'/wp/v2/types?context=edit',
					'/wp/v2/taxonomies?context=edit',
					'/wp/v2/pages?context=edit',
					'/wp/v2/categories?context=edit',
					'/wp/v2/posts?context=edit',
					'/wp/v2/tags?context=edit',
					'/wp/v2/templates?context=edit',
					'/wp/v2/template-parts?context=edit',
					'/wp/v2/settings',
					'/wp/v2/themes?context=edit&status=active',
					'/wp/v2/global-styles/' . $active_global_styles_id . '?context=edit',
					'/wp/v2/global-styles/' . $active_global_styles_id,
					'/wp/v2/global-styles/themes/' . $active_theme,
				)
			),
			'initializer_name' => 'initializeEditor',
			'editor_settings'  => $settings,
		)
	);

	wp_add_inline_script(
		'wp-blocks',
		sprintf( 'wp.blocks.setCategories( %s );', wp_json_encode( get_block_categories( $post ) ) ),
		'after'
	);

	wp_enqueue_script( 'wp-edit-site' );
	wp_enqueue_script( 'wp-format-library' );
	wp_enqueue_style( 'wp-edit-site' );
	wp_enqueue_style( 'wp-format-library' );
	wp_enqueue_media();

	if (
		current_theme_supports( 'wp-block-styles' ) ||
		( ! is_array( $editor_styles ) || count( $editor_styles ) === 0 )
	) {
		wp_enqueue_style( 'wp-block-library-theme' );
	}

	/**
	 * Fires after block assets have been enqueued for the editing interface.
	 *
	 * Call `add_action` on any hook before 'admin_enqueue_scripts'.
	 *
	 * In the function call you supply, simply use `wp_enqueue_script` and
	 * `wp_enqueue_style` to add your functionality to the block editor.
	 *
	 * @since 5.0.0
	 */

	do_action( 'enqueue_block_editor_assets' );

}
add_action( 'admin_enqueue_scripts', 'gutenberg_edit_site_init' );

/**
 * Register a core site setting for front page information.
 */
function register_site_editor_homepage_settings() {
	register_setting(
		'reading',
		'show_on_front',
		array(
			'show_in_rest' => true,
			'type'         => 'string',
			'description'  => __( 'What to show on the front page', 'gutenberg' ),
		)
	);

	register_setting(
		'reading',
		'page_on_front',
		array(
			'show_in_rest' => true,
			'type'         => 'number',
			'description'  => __( 'The ID of the page that should be displayed on the front page', 'gutenberg' ),
		)
	);
}
add_action( 'init', 'register_site_editor_homepage_settings', 10 );

/**
 * Sets the HTML <title> in the Site Editor list page to be the title of the CPT
 * being edited, e.g. 'Templates'.
 */
function gutenberg_set_site_editor_list_page_title() {
	global $title;
	if ( gutenberg_is_edit_site_list_page() ) {
		$post_type = get_post_type_object( $_GET['postType'] );
		if ( $post_type ) {
			$title = $post_type->labels->name;
		}
	}
}
add_action( 'load-appearance_page_gutenberg-edit-site', 'gutenberg_set_site_editor_list_page_title' );
