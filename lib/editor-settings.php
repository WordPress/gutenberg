<?php
/**
 * Utilities to manage editor settings.
 *
 * @package gutenberg
 */

/**
 * Returns editor settings that are common to all editors:
 * post, site, widgets, and navigation.
 *
 * All these settings are already part of core,
 * see edit-form-blocks.php
 *
 * @return array Common editor settings.
 */
function gutenberg_get_common_block_editor_settings() {
	$max_upload_size = wp_max_upload_size();
	if ( ! $max_upload_size ) {
		$max_upload_size = 0;
	}

	$available_image_sizes = array();
	// This filter is documented in wp-admin/includes/media.php.
	$image_size_names = apply_filters(
		'image_size_names_choose',
		array(
			'thumbnail' => __( 'Thumbnail', 'gutenberg' ),
			'medium'    => __( 'Medium', 'gutenberg' ),
			'large'     => __( 'Large', 'gutenberg' ),
			'full'      => __( 'Full Size', 'gutenberg' ),
		)
	);
	foreach ( $image_size_names as $image_size_slug => $image_size_name ) {
		$available_image_sizes[] = array(
			'slug' => $image_size_slug,
			'name' => $image_size_name,
		);
	};

	$settings = array(
		'__unstableEnableFullSiteEditingBlocks' => gutenberg_is_fse_theme(),
		'disableCustomColors'                   => get_theme_support( 'disable-custom-colors' ),
		'disableCustomFontSizes'                => get_theme_support( 'disable-custom-font-sizes' ),
		'disableCustomGradients'                => get_theme_support( 'disable-custom-gradients' ),
		'enableCustomLineHeight'                => get_theme_support( 'custom-line-height' ),
		'enableCustomUnits'                     => get_theme_support( 'custom-units' ),
		'enableCustomSpacing'                   => get_theme_support( 'custom-spacing' ),
		'imageSizes'                            => $available_image_sizes,
		'isRTL'                                 => is_rtl(),
		'maxUploadFileSize'                     => $max_upload_size,
	);

	$color_palette = current( (array) get_theme_support( 'editor-color-palette' ) );
	if ( false !== $color_palette ) {
		$settings['colors'] = $color_palette;
	}

	$font_sizes = current( (array) get_theme_support( 'editor-font-sizes' ) );
	if ( false !== $font_sizes ) {
		$settings['fontSizes'] = $font_sizes;
	}

	$gradient_presets = current( (array) get_theme_support( 'editor-gradient-presets' ) );
	if ( false !== $gradient_presets ) {
		$settings['gradients'] = $gradient_presets;
	}

	return $settings;
}

/**
 * Extends the block editor with settings that are only in the plugin.
 *
 * @param array $settings Existing editor settings.
 *
 * @return array Filtered settings.
 */
function gutenberg_extend_post_editor_settings( $settings ) {
	$image_default_size = get_option( 'image_default_size', 'large' );
	$image_sizes        = wp_list_pluck( $settings['imageSizes'], 'slug' );

	$settings['imageDefaultSize'] = in_array( $image_default_size, $image_sizes, true ) ? $image_default_size : 'large';
	$settings['__unstableEnableFullSiteEditingBlocks'] = gutenberg_is_fse_theme();

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_extend_post_editor_settings' );

/**
 * Initialize a block-based editor.
 *
 * @param string $editor_name          Editor name.
 * @param string $editor_script_handle Editor script handle.
 * @param array  $settings {
 *      Elements to initialize a block-based editor.
 *
 *      @type array  $preload_paths        Array of paths to preload.
 *      @type string $initializer_name     Editor initialization function name.
 *      @type array  $editor_settings      Editor settings.
 * }
 * @return void
 */
function gutenberg_initialize_editor( $editor_name, $editor_script_handle, $settings ) {

	$defaults = array(
		'preload_paths'    => array(),
		'initializer_name' => 'initialize',
		'editor_settings'  => array(),
	);

	$settings = wp_parse_args( $settings, $defaults );

	/**
	 * Preload common data by specifying an array of REST API paths that will be preloaded.
	 *
	 * Filters the array of paths that will be preloaded.
	 *
	 * @param string[] $preload_paths Array of paths to preload.
	 */
	$preload_paths = apply_filters( "{$editor_name}_preload_paths", $settings['preload_paths'] );

	$preload_data = array_reduce(
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
		"wp-{$editor_script_handle}",
		sprintf(
			'wp.domReady( function() {
				wp.%s.%s( "%s", %s );
			} );',
			lcfirst( str_replace( '-', '', ucwords( $editor_script_handle, '-' ) ) ),
			$settings['initializer_name'],
			str_replace( '_', '-', $editor_name ),
			wp_json_encode( $settings['editor_settings'] )
		)
	);

	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( get_block_editor_server_block_settings() ) . ');'
	);

}
