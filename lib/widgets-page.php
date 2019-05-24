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
	<div id="widgets-editor" class="blocks-widgets-container">
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
	if ( 'gutenberg_page_gutenberg-widgets' !== $hook ) {
			return;
	}

	// Media settings.
	$max_upload_size = wp_max_upload_size();
	if ( ! $max_upload_size ) {
		$max_upload_size = 0;
	}

	$settings = array_merge(
		array(
			'disableCustomColors'    => get_theme_support( 'disable-custom-colors' ),
			'disableCustomFontSizes' => get_theme_support( 'disable-custom-font-sizes' ),
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
			'wp.editWidgets.initialize( "widgets-editor", %s );',
			wp_json_encode( $settings )
		)
	);
	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( get_block_editor_server_block_settings() ) . ');'
	);
	wp_enqueue_script( 'wp-edit-widgets' );
	wp_enqueue_style( 'wp-edit-widgets' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_widgets_init' );
