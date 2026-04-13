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

if ( ! function_exists( '_wp_register_default_icon_collections' ) ) {
	/**
	 * Registers the default icon collections.
	 *
	 * @access private
	 */
	function _wp_register_default_icon_collections() {
		wp_register_icon_collection(
			'wordpress',
			array(
				'label'       => _x( 'WordPress', 'gutenberg' ),
				'description' => __( 'Default icon collection.', 'gutenberg' ),
			)
		);
	}
	add_action( 'init', '_wp_register_default_icon_collections', 0 );
}
