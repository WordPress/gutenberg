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
	add_theme_support(
		'editor-color-palette',
		array(
			array(
				'name'  => __( 'Accent Color', 'gutenberg' ),
				'slug'  => 'accent',
				'color' => '#cd2653',
			),
			array(
				'name'  => __( 'Primary', 'gutenberg' ),
				'slug'  => 'primary',
				'color' => '#0073a8',
			),
			array(
				'name'  => __( 'Secondary', 'gutenberg' ),
				'slug'  => 'secondary',
				'color' => '#005075',
			),
			array(
				'name'  => __( 'Subtle Background', 'gutenberg' ),
				'slug'  => 'subtle-background',
				'color' => '#dcd7ca',
			),
			array(
				'name'  => __( 'Background Color', 'gutenberg' ),
				'slug'  => 'background',
				'color' => '#' . 'f5efe0',
			),
		)
	);

	add_theme_support(
		'editor-font-sizes',
		array(
			array(
				'name'      => _x( 'Small', 'Name of the small font size in the block editor', 'gutenberg' ),
				'shortName' => _x( 'S', 'Short name of the small font size in the block editor.', 'gutenberg' ),
				'size'      => 18,
				'slug'      => 'small',
			),
			array(
				'name'      => _x( 'Regular', 'Name of the regular font size in the block editor', 'gutenberg' ),
				'shortName' => _x( 'M', 'Short name of the regular font size in the block editor.', 'gutenberg' ),
				'size'      => 21,
				'slug'      => 'normal',
			),
			array(
				'name'      => _x( 'Large', 'Name of the large font size in the block editor', 'gutenberg' ),
				'shortName' => _x( 'L', 'Short name of the large font size in the block editor.', 'gutenberg' ),
				'size'      => 26.25,
				'slug'      => 'large',
			),
			array(
				'name'      => _x( 'Larger', 'Name of the larger font size in the block editor', 'gutenberg' ),
				'shortName' => _x( 'XL', 'Short name of the larger font size in the block editor.', 'gutenberg' ),
				'size'      => 32,
				'slug'      => 'larger',
			),
		)
	);
}
add_action( 'init', 'normalize_theme_init' );
