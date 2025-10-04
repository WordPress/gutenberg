<?php
/**
 * Icon registration examples using WP_Icons_Registry.
 *
 * @package Gutenberg
 */

/**
 * Example: Register icons from a directory.
 */
function gutenberg_register_icons_from_directory() {
	if ( ! class_exists( 'WP_Icons_Registry' ) ) {
		return;
	}

	$registry        = WP_Icons_Registry::get_instance();
	$icons_directory = __DIR__ . '/../../packages/icons/src/library/';

	if ( ! is_dir( $icons_directory ) ) {
		return;
	}

	// Get all SVG files from the directory
	$svg_files = glob( $icons_directory . '*.svg' );

	foreach ( $svg_files as $svg_file ) {
		$icon_name   = basename( $svg_file, '.svg' );
		$svg_content = file_get_contents( $svg_file );

		if ( false === $svg_content ) {
			continue;
		}

		// Create a human-readable title from the filename
		$title = ucwords( str_replace( array( '-', '_' ), ' ', $icon_name ) );

		$registry->register(
			$icon_name,
			array(
				'title'   => $title,
				'content' => $svg_content,
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_register_icons_from_directory' );

/**
 * Example to register custom icons.
 */
function gutenberg_register_custom_icons() {
	if ( ! class_exists( 'WP_Icons_Registry' ) ) {
		return;
	}
	$registry = WP_Icons_Registry::get_instance();
	$registry->register(
		'my-custom-icon',
		array(
			'title'   => 'Custom Icon',
			'content' => '<svg fill="red" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>',
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_custom_icons' );
