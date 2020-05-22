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

	//
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
	global $current_screen;

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

	// Get editor settings.
	$max_upload_size = wp_max_upload_size();
	if ( ! $max_upload_size ) {
		$max_upload_size = 0;
	}

	// This filter is documented in wp-admin/includes/media.php.
	$image_size_names      = apply_filters(
		'image_size_names_choose',
		array(
			'thumbnail' => __( 'Thumbnail', 'gutenberg' ),
			'medium'    => __( 'Medium', 'gutenberg' ),
			'large'     => __( 'Large', 'gutenberg' ),
			'full'      => __( 'Full Size', 'gutenberg' ),
		)
	);
	$available_image_sizes = array();
	foreach ( $image_size_names as $image_size_slug => $image_size_name ) {
		$available_image_sizes[] = array(
			'slug' => $image_size_slug,
			'name' => $image_size_name,
		);
	}

	$settings = array(
		'disableCustomColors'    => get_theme_support( 'disable-custom-colors' ),
		'disableCustomFontSizes' => get_theme_support( 'disable-custom-font-sizes' ),
		'imageSizes'             => $available_image_sizes,
		'isRTL'                  => is_rtl(),
		'maxUploadFileSize'      => $max_upload_size,
	);

	list( $color_palette, ) = (array) get_theme_support( 'editor-color-palette' );
	list( $font_sizes, )    = (array) get_theme_support( 'editor-font-sizes' );
	if ( false !== $color_palette ) {
		$settings['colors'] = $color_palette;
	}
	if ( false !== $font_sizes ) {
		$settings['fontSizes'] = $font_sizes;
	}

	$template_ids      = array();
	$template_part_ids = array();
	foreach ( get_template_types() as $template_type ) {
		// Skip 'embed' for now because it is not a regular template type.
		// Skip 'index' because it's a fallback that we handle differently.
		if ( in_array( $template_type, array( 'embed', 'index' ), true ) ) {
			continue;
		}

		$current_template = gutenberg_find_template_post_and_parts( $template_type );
		if ( isset( $current_template ) ) {
			$template_ids[ $current_template['template_post']->post_name ] = $current_template['template_post']->ID;
			$template_part_ids = $template_part_ids + $current_template['template_part_ids'];
		}
	}

	$current_template_id = $template_ids['front-page'];

	$settings['templateId']      = $current_template_id;
	$settings['homeTemplateId']  = $current_template_id;
	$settings['templateType']    = 'wp_template';
	$settings['templateIds']     = array_values( $template_ids );
	$settings['templatePartIds'] = array_values( $template_part_ids );
	$settings['styles']          = gutenberg_get_editor_styles();

	$settings['showOnFront'] = get_option( 'show_on_front' );
	$settings['page']        = array(
		'path'    => '/',
		'context' => 'page' === $settings['showOnFront'] ? array(
			'postType' => 'page',
			'postId'   => get_option( 'page_on_front' ),
		) : array(
			'query' => array(
				'categoryIds' => array(),
			),
		),
	);

	// This is so other parts of the code can hook their own settings.
	// Example: Global Styles.
	global $post;
	$settings = apply_filters( 'block_editor_settings', $settings, $post );

	// Preload block editor paths.
	// most of these are copied from edit-forms-blocks.php.
	$preload_paths = array(
		'/',
		'/wp/v2/types?context=edit',
		'/wp/v2/taxonomies?per_page=100&context=edit',
		'/wp/v2/pages?per_page=100&context=edit',
		'/wp/v2/themes?status=active',
		sprintf( '/wp/v2/templates/%s?context=edit', $current_template_id ),
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
			wp_json_encode( gutenberg_experiments_editor_settings( $settings ) )
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
