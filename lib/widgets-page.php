<?php
/**
 * Bootstraping the Gutenberg widgets page.
 *
 * @package gutenberg
 */

/**
 * The main entry point for the Gutenberg widgets page.
 *
 * @since 5.2.0
 */
function the_gutenberg_widgets() {
	?>
	<div
		id="widgets-editor"
		class="blocks-widgets-container"
	>
	</div>
	<?php
}

/**
 * Initialize the Gutenberg widgets page.
 *
 * @since 5.2.0
 *
 * @param string $hook Page.
 */
function gutenberg_widgets_init( $hook ) {
	if ( 'widgets.php' === $hook ) {
		wp_enqueue_style( 'wp-block-library' );
		wp_enqueue_style( 'wp-block-library-theme' );
		wp_add_inline_style(
			'wp-block-library-theme',
			'.block-widget-form .widget-control-save { display: none; }'
		);
		return;
	}
	if ( ! in_array( $hook, array( 'appearance_page_gutenberg-widgets' ), true ) ) {
		return;
	}

	$current_screen = get_current_screen();
	/**
	 * Make the WP Screen object aware that this is a block editor page.
	 * Since custom blocks check whether the screen is_block_editor,
	 * this is required for custom blocks to be loaded and for responsive embeds
	 * to work.
	 * See wp_enqueue_registered_block_scripts_and_styles in wp-includes/script-loader.php
	 */
	$current_screen->is_block_editor( true );

	$initializer_name = 'initialize';

	// Media settings.
	$max_upload_size = wp_max_upload_size();
	if ( ! $max_upload_size ) {
		$max_upload_size = 0;
	}

	/** This filter is documented in wp-admin/includes/media.php */
	$image_size_names = apply_filters(
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

	$settings = array_merge(
		array(
			'imageSizes'        => $available_image_sizes,
			'isRTL'             => is_rtl(),
			'maxUploadFileSize' => $max_upload_size,
		),
		gutenberg_get_legacy_widget_settings()
	);

	// This purposefully does not rely on apply_filters( 'block_editor_settings', $settings, null );
	// Applying that filter would bring over multitude of features from the post editor, some of which
	// may be undesirable. Instead of using that filter, we simply pick just the settings that are needed.
	$settings = gutenberg_experimental_global_styles_settings( $settings );
	$settings = gutenberg_extend_block_editor_styles( $settings );

	$preload_paths = array(
		array( '/wp/v2/media', 'OPTIONS' ),
		'/wp/v2/sidebars?context=edit&per_page=-1',
		'/wp/v2/widgets?context=edit&per_page=-1',
	);
	$preload_data  = array_reduce(
		$preload_paths,
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

	wp_add_inline_script(
		'wp-edit-widgets',
		sprintf(
			'wp.domReady( function() {
				wp.editWidgets.%s( "widgets-editor", %s );
			} );',
			$initializer_name,
			wp_json_encode( gutenberg_experiments_editor_settings( $settings ) )
		)
	);

	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( get_block_editor_server_block_settings() ) . ');'
	);

	wp_enqueue_script( 'wp-edit-widgets' );
	wp_enqueue_script( 'admin-widgets' );
	wp_enqueue_script( 'wp-format-library' );
	wp_enqueue_style( 'wp-edit-widgets' );
	wp_enqueue_style( 'wp-format-library' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_widgets_init' );
