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

if ( ! function_exists( 'wp_register_icon' ) ) {
	/**
	 * Registers a new icon.
	 *
	 * @param string $icon_name Icon name (e.g. "arrow-left").
	 * @param array  $args {
	 *     List of properties for the icon.
	 *
	 *     @type string $label      Required. A human-readable label for the icon.
	 *     @type string $collection Optional. The slug of a registered icon collection that this icon belongs to.
	 *                              Defaults to "core" when omitted.
	 *     @type string $content    Optional. SVG markup for the icon.
	 *                              If not provided, the content will be retrieved from the `file_path` if set.
	 *                              If both `content` and `file_path` are not set, the icon will not be registered.
	 *     @type string $file_path  Optional. The full path to the file containing the icon content.
	 * }
	 * @return bool True if the icon was registered successfully, else false.
	 */
	function wp_register_icon( $icon_name, $args ) {
		return WP_Icons_Registry::get_instance()->register( $icon_name, $args );
	}
}

if ( ! function_exists( 'wp_unregister_icon' ) ) {
	/**
	 * Unregisters an icon.
	 *
	 * @param string $icon_name Icon name (e.g. "arrow-left").
	 * @param string $collection Slug of the collection the icon belongs to.
	 * @return bool True if the icon was unregistered successfully, else false.
	 */
	function wp_unregister_icon( $icon_name, $collection ) {
		return WP_Icons_Registry::get_instance()->unregister( $icon_name, $collection );
	}
}

/**
 * Registers the default icon collections for Gutenberg.
 */
function gutenberg_register_default_icon_collections() {
	wp_register_icon_collection(
		'core',
		array(
			'label'       => __( 'WordPress', 'gutenberg' ),
			'description' => __( 'Core icon collection.', 'gutenberg' ),
		)
	);
}

if ( has_action( 'init', '_wp_register_default_icon_collections' ) ) {
	remove_action( 'init', '_wp_register_default_icon_collections' );
}
add_action( 'init', 'gutenberg_register_default_icon_collections', 0 );

/**
 * Registers the default core icons from the Gutenberg manifest.
 */
function gutenberg_register_default_icons() {
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

	foreach ( $collection as $icon_name => $icon_data ) {
		if (
			empty( $icon_data['filePath'] )
			|| ! is_string( $icon_data['filePath'] )
		) {
			_doing_it_wrong(
				__FUNCTION__,
				__( 'Core icon collection manifest must provide a valid "filePath" for each icon.', 'gutenberg' ),
				'7.1.0'
			);
			return;
		}

		wp_register_icon(
			$icon_name,
			array(
				'label'      => $icon_data['label'],
				'file_path'  => $icons_directory . $icon_data['filePath'],
				'collection' => 'core',
			)
		);
	}
}

if ( has_action( 'init', '_wp_register_default_icons' ) ) {
	remove_action( 'init', '_wp_register_default_icons' );
}
add_action( 'init', 'gutenberg_register_default_icons' );
