<?php
/**
 * Block Editor API.
 *
 * @package Gutenberg
 * @subpackage Editor
 */

/**
 * Returns the classic theme supports settings for block editor.
 *
 * @since 6.2.0
 * @since 6.6.0 Add support for custom spacing sizes.
 *
 * @return array The classic theme supports settings.
 */
function gutenberg_get_classic_theme_supports_block_editor_settings() {
	$theme_settings = array(
		'disableCustomColors'    => get_theme_support( 'disable-custom-colors' ),
		'disableCustomFontSizes' => get_theme_support( 'disable-custom-font-sizes' ),
		'disableCustomGradients' => get_theme_support( 'disable-custom-gradients' ),
		'disableLayoutStyles'    => get_theme_support( 'disable-layout-styles' ),
		'enableCustomLineHeight' => get_theme_support( 'custom-line-height' ),
		'enableCustomSpacing'    => get_theme_support( 'custom-spacing' ),
		'enableCustomUnits'      => get_theme_support( 'custom-units' ),
	);

	// Theme settings.
	$color_palette = current( (array) get_theme_support( 'editor-color-palette' ) );
	if ( false !== $color_palette ) {
		$theme_settings['colors'] = $color_palette;
	}

	$font_sizes = current( (array) get_theme_support( 'editor-font-sizes' ) );
	if ( false !== $font_sizes ) {
		$theme_settings['fontSizes'] = $font_sizes;
	}

	$gradient_presets = current( (array) get_theme_support( 'editor-gradient-presets' ) );
	if ( false !== $gradient_presets ) {
		$theme_settings['gradients'] = $gradient_presets;
	}

	$spacing_sizes = current( (array) get_theme_support( 'editor-spacing-sizes' ) );
	if ( false !== $spacing_sizes ) {
		$theme_settings['spacingSizes'] = $spacing_sizes;
	}

	return $theme_settings;
}
