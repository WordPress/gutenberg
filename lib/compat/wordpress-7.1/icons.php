<?php
/**
 * Icons API functions.
 *
 * @package Gutenberg
 */

if ( ! function_exists( 'wp_register_icon_collection' ) ) {
	/**
	 * Registers a new icon collection.
	 *
	 * @param string $slug Icon collection slug.
	 * @param array  $args {
	 *     Arguments for registering an icon collection.
	 *
	 *     @type string $label       Required. A human-readable label for the icon collection.
	 *     @type string $description Optional. A human-readable description for the icon collection.
	 *     @type array  $categories  Optional. An array of categories. Each category is an array
	 *                               with `name` and `slug` keys.
	 * }
	 * @return bool True if the icon collection was registered successfully, else false.
	 */
	function wp_register_icon_collection( $slug, $args ) {
		return WP_Icon_Collections_Registry::get_instance()->register( $slug, $args );
	}
}

if ( ! function_exists( 'wp_unregister_icon_collection' ) ) {
	/**
	 * Unregisters an icon collection.
	 *
	 * @param string $slug Icon collection slug.
	 * @return bool True if the icon collection was unregistered successfully, else false.
	 */
	function wp_unregister_icon_collection( $slug ) {
		return WP_Icon_Collections_Registry::get_instance()->unregister( $slug );
	}
}

/**
 * Registers the default icon collections for Gutenberg.
 */
function gutenberg_register_icon_collections() {
	wp_register_icon_collection(
		'wordpress',
		array(
			'label'       => _x( 'WordPress', 'gutenberg' ),
			'description' => __( 'Default icon collection.', 'gutenberg' ),
		)
	);
}

if ( has_action( 'init', '_wp_register_default_icon_collections' ) ) {
	remove_action( 'init', '_wp_register_default_icon_collections' );
}
add_action( 'init', 'gutenberg_register_icon_collections', 0 );

/**
 * Registers the default core icons from the Gutenberg manifest.
 */
function gutenberg_register_icons() {
	$icons_directory = gutenberg_dir_path() . 'packages/icons/src';
	$icons_directory = trailingslashit( $icons_directory );
	$manifest_path   = $icons_directory . 'manifest.php';

	if ( ! is_readable( $manifest_path ) ) {
		wp_trigger_error(
			__FUNCTION__,
			__( 'Core icon collection manifest is missing or unreadable.', 'gutenberg' )
		);
		return;
	}

	$collection = include $manifest_path;

	if ( empty( $collection ) ) {
		wp_trigger_error(
			__FUNCTION__,
			__( 'Core icon collection manifest is empty or invalid.', 'gutenberg' )
		);
		return;
	}

	$registry        = WP_Icons_Registry_Gutenberg::get_instance();
	$register_method = new ReflectionMethod( WP_Icons_Registry_Gutenberg::class, 'register' );
	/*
	 * ReflectionMethod::setAccessible is:
	 * - redundant as of 8.1.0, which made all properties accessible
	 * - deprecated as of 8.5.0
	 * - needed until 8.1.0, as method `register` is protected
	 */
	if ( PHP_VERSION_ID < 80100 ) {
		$register_method->setAccessible( true );
	}

	foreach ( $collection as $icon_name => $icon_data ) {
		if (
			empty( $icon_data['filePath'] )
			|| ! is_string( $icon_data['filePath'] )
		) {
			_doing_it_wrong(
				__FUNCTION__,
				__( 'Core icon collection manifest must provide valid a "filePath" for each icon.', 'gutenberg' ),
				'7.0.0'
			);
			return;
		}

		$register_method->invoke(
			$registry,
			'core/' . $icon_name,
			array(
				'label'      => $icon_data['label'],
				'filePath'   => $icons_directory . $icon_data['filePath'],
				'collection' => 'wordpress',
			)
		);
	}
}

if ( has_action( 'init', '_wp_register_default_icons' ) ) {
	remove_action( 'init', '_wp_register_default_icons' );
}
add_action( 'init', 'gutenberg_register_icons', 0 );
