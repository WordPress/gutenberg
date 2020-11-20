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
	$settings['__unstableEnableFullSiteEditingBlocks'] = gutenberg_is_fse_theme();
	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_extend_post_editor_settings' );
