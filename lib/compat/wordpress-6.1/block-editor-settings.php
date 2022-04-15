<?php
/**
 * Adds styles and __experimentalFeatures to the block editor settings.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_add_theme_dev_mode( $settings ) {
	$settings['themeDevMode'] = defined('THEME_DEV_MODE') && THEME_DEV_MODE;

	return $settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_add_theme_dev_mode', PHP_INT_MAX );
