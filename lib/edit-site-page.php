<?php
/**
 * Bootstraping the Gutenberg Edit Site Page.
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
	return 'toplevel_page_gutenberg-edit-site' === $page;
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
	$styles = array(
		array(
			'css' => file_get_contents(
				ABSPATH . WPINC . '/css/dist/editor/editor-styles.css'
			),
		),
	);

	/* translators: Use this to specify the CSS font family for the default font. */
	$locale_font_family = esc_html_x( 'Noto Serif', 'CSS Font Family for Editor Font', 'gutenberg' );
	$styles[]           = array(
		'css' => "body { font-family: '$locale_font_family' }",
	);

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
 * Initialize the Gutenberg Edit Site Page.
 *
 * @since 7.2.0
 *
 * @param string $hook Page.
 */
function gutenberg_edit_site_init( $hook ) {
	global $current_screen, $post;

	if ( ! gutenberg_is_edit_site_page( $hook ) ) {
		return;
	}

	/**
	 * Make the WP Screen object aware that this is a block editor page.
	 * Since custom blocks check whether the screen is_block_editor,
	 * this is required for custom blocks to be loaded.
	 * See wp_enqueue_registered_block_scripts_and_styles in wp-includes/script-loader.php
	 */
	$current_screen->is_block_editor( true );

	$settings = array_merge(
		gutenberg_get_common_block_editor_settings(),
		array(
			'alignWide'            => get_theme_support( 'align-wide' ),
			'siteUrl'              => site_url(),
			'postsPerPage'         => get_option( 'posts_per_page' ),
			'styles'               => gutenberg_get_editor_styles(),
			'defaultTemplateTypes' => gutenberg_get_indexed_default_template_types(),
		)
	);
	$settings = gutenberg_experimental_global_styles_settings( $settings );
	$settings = gutenberg_extend_settings_block_patterns( $settings );

	// Preload block editor paths.
	// most of these are copied from edit-forms-blocks.php.
	$preload_paths = array(
		'/?context=edit',
		'/wp/v2/types?context=edit',
		'/wp/v2/taxonomies?context=edit',
		'/wp/v2/pages?context=edit',
		'/wp/v2/themes?status=active',
		array( '/wp/v2/media', 'OPTIONS' ),
	);
	$preload_data  = array_reduce(
		$preload_paths,
		'rest_preload_api_request',
		array()
	);
	wp_add_inline_script(
		'wp-api-fetch',
		sprintf( 'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );', wp_json_encode( $preload_data ) ),
		'after'
	);

	// Initialize editor.
	wp_add_inline_script(
		'wp-edit-site',
		sprintf(
			'wp.domReady( function() {
				wp.editSite.initialize( "edit-site-editor", %s );
			} );',
			wp_json_encode( $settings )
		)
	);

	wp_add_inline_script(
		'wp-blocks',
		sprintf( 'wp.blocks.unstable__bootstrapServerSideBlockDefinitions( %s );', wp_json_encode( get_block_editor_server_block_settings() ) ),
		'after'
	);

	wp_add_inline_script(
		'wp-blocks',
		sprintf( 'wp.blocks.setCategories( %s );', wp_json_encode( get_block_categories( $post ) ) ),
		'after'
	);

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

	wp_enqueue_script( 'wp-edit-site' );
	wp_enqueue_script( 'wp-format-library' );
	wp_enqueue_style( 'wp-edit-site' );
	wp_enqueue_style( 'wp-format-library' );
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
