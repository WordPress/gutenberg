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
 * Return the correct template for the site's home page.
 *
 * @return array|null A template object, or null if none could be found
 */
function gutenberg_edit_site_resolve_home_template() {
	// Return early if we already have template in URL.
	if ( ! empty( $_GET['postType'] ) ) {
		return null;
	}

	$show_on_front = get_option( 'show_on_front' );
	$front_page_id = get_option( 'page_on_front' );

	if ( 'page' === $show_on_front && $front_page_id ) {
		return array(
			'postType' => 'page',
			'postId'   => $front_page_id,
		);
	}

	$hierarchy = array( 'front-page', 'home', 'index' );
	$template  = gutenberg_resolve_template( 'site', $hierarchy, '' );

	if ( ! $template ) {
		return null;
	}

	return array(
		'postType' => 'wp_template',
		'postId'   => $template->id,
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

	if ( gutenberg_is_edit_site_list_page() ) {
		$post_type = get_post_type_object( $_GET['postType'] );

		if ( ! $post_type ) {
			wp_die( __( 'Invalid post type.', 'gutenberg' ) );
		}
	}

	// Default to is-fullscreen-mode to avoid rendering wp-admin navigation menu while loading and
	// having jumps in the UI.
	add_filter(
		'admin_body_class',
		static function( $classes ) {
			return "$classes is-fullscreen-mode";
		}
	);

	$indexed_template_types = array();
	foreach ( get_default_block_template_types() as $slug => $template_type ) {
		$template_type['slug']    = (string) $slug;
		$indexed_template_types[] = $template_type;
	}

	$custom_settings = array(
		'siteUrl'                              => site_url(),
		'postsPerPage'                         => get_option( 'posts_per_page' ),
		'styles'                               => gutenberg_get_editor_styles(),
		'defaultTemplateTypes'                 => $indexed_template_types,
		'defaultTemplatePartAreas'             => get_allowed_block_template_part_areas(),
		'__experimentalHomeTemplate'           => gutenberg_edit_site_resolve_home_template(),
		'__experimentalBlockPatterns'          => WP_Block_Patterns_Registry::get_instance()->get_all_registered(),
		'__experimentalBlockPatternCategories' => WP_Block_Pattern_Categories_Registry::get_instance()->get_all_registered(),
	);

	/**
	 * Make the WP Screen object aware that this is a block editor page.
	 * Since custom blocks check whether the screen is_block_editor,
	 * this is required for custom blocks to be loaded.
	 * See wp_enqueue_registered_block_scripts_and_styles in wp-includes/script-loader.php
	 */
	$current_screen->is_block_editor( true );

	$site_editor_context     = new WP_Block_Editor_Context();
	$settings                = get_block_editor_settings( $custom_settings, $site_editor_context );
	$active_global_styles_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
	$active_theme            = wp_get_theme()->get_stylesheet();
	gutenberg_initialize_editor(
		'edit_site_editor',
		'edit-site',
		array(
			'preload_paths'    => array_merge(
				array(
					array( '/wp/v2/media', 'OPTIONS' ),
					'/',
					'/wp/v2/types?context=edit',
					'/wp/v2/types/wp_template?context=edit',
					'/wp/v2/types/wp_template-part?context=edit',
					'/wp/v2/taxonomies?context=edit',
					'/wp/v2/pages?context=edit',
					'/wp/v2/categories?context=edit',
					'/wp/v2/posts?context=edit',
					'/wp/v2/tags?context=edit',
					'/wp/v2/templates?context=edit&per_page=-1',
					'/wp/v2/template-parts?context=edit&per_page=-1',
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

	register_setting(
		'reading',
		'page_for_posts',
		array(
			'show_in_rest' => true,
			'type'         => 'number',
			'description'  => __( 'The ID of the page that should display the latest posts', 'gutenberg' ),
		)
	);
}
add_action( 'init', 'register_site_editor_homepage_settings', 10 );

/**
 * Tells the script loader to load the scripts and styles of custom block on site editor screen.
 *
 * @param bool $is_block_editor_screen Current decision about loading block assets.
 * @return bool Filtered decision about loading block assets.
 */
function gutenberg_site_editor_load_block_editor_scripts_and_styles( $is_block_editor_screen ) {
	return ( is_callable( 'get_current_screen' ) && get_current_screen() && 'appearance_page_gutenberg-edit-site' === get_current_screen()->base )
		? true
		: $is_block_editor_screen;
}
add_filter( 'should_load_block_editor_scripts_and_styles', 'gutenberg_site_editor_load_block_editor_scripts_and_styles' );
