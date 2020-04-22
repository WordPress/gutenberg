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
 *
 * @param string $page The page name the function is being called for, `'gutenberg_customizer'` for the Customizer.
 */
function the_gutenberg_widgets( $page = 'gutenberg_page_gutenberg-widgets' ) {
	?>
	<div
		id="widgets-editor"
		class="blocks-widgets-container
		<?php
		echo 'gutenberg_customizer' === $page
			? ' is-in-customizer'
			: '';
		?>
		"
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
	if ( 'gutenberg_page_gutenberg-widgets' !== $hook && 'gutenberg_customizer' !== $hook ) {
			return;
	}

	$initializer_name = 'gutenberg_page_gutenberg-widgets' === $hook
		? 'initialize'
		: 'customizerInitialize';

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
			'disableCustomColors'    => get_theme_support( 'disable-custom-colors' ),
			'disableCustomFontSizes' => get_theme_support( 'disable-custom-font-sizes' ),
			'imageSizes'             => $available_image_sizes,
			'isRTL'                  => is_rtl(),
			'maxUploadFileSize'      => $max_upload_size,
		),
		gutenberg_get_legacy_widget_settings()
	);

	list( $color_palette, ) = (array) get_theme_support( 'editor-color-palette' );
	list( $font_sizes, )    = (array) get_theme_support( 'editor-font-sizes' );

	if ( false !== $color_palette ) {
		$settings['colors'] = $color_palette;
	}

	if ( false !== $font_sizes ) {
		$settings['fontSizes'] = $font_sizes;
	}

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
