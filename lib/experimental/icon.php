<?php
/**
 * Icon registration using WP_Icons_Registry.
 *
 * @package Gutenberg
 */

/**
 * Register core icons from the `@wordpress/icons` package.
 */
function gutenberg_register_core_icons() {
	if ( ! class_exists( 'WP_Icons_Registry' ) ) {
		return;
	}

	$registry        = WP_Icons_Registry::get_instance();
	$icons_directory = __DIR__ . '/../../packages/icons/src/library/';

	if ( ! is_dir( $icons_directory ) ) {
		return;
	}

	$svg_files = glob( $icons_directory . '*.svg' );

	foreach ( $svg_files as $svg_file ) {
		$icon_name   = basename( $svg_file, '.svg' );
		$svg_content = file_get_contents( $svg_file );

		if ( false === $svg_content ) {
			continue;
		}

		$title = ucwords( str_replace( array( '-', '_' ), ' ', $icon_name ) );

		$registry->register(
			'core/' . $icon_name,
			array(
				'title'   => $title,
				'content' => $svg_content,
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_register_core_icons' );

/**
 * Example to register custom icons.
 */
function gutenberg_custom_register_custom_icons() {
	if ( ! class_exists( 'WP_Icons_Registry' ) ) {
		return;
	}
	$registry = WP_Icons_Registry::get_instance();
	$registry->register(
		'custom/my-custom-icon',
		array(
			'title'   => 'Custom Icon',
			'content' => '<svg fill="red" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>',
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_custom_register_custom_icons' );
