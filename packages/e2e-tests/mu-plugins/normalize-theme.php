<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Normalize Theme
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-normalize-theme
 */

/**
 * Fixes colors and font sizes so that tests
 * are consistent across different themes.
 */
function normalize_theme_init() {
	remove_theme_support( 'editor-color-palette' );
	remove_theme_support( 'editor-font-sizes' );
}
add_action( 'init', 'normalize_theme_init' );
