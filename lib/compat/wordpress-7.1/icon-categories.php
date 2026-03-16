<?php
/**
 * WordPress 7.1 icon categories compatibility APIs.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'register_icon_category' ) ) {
	/**
	 * Registers an icon category.
	 *
	 * @param string $category_name       Category name.
	 * @param array  $category_properties Category properties.
	 * @return bool True if registered, false otherwise.
	 */
	function register_icon_category( $category_name, $category_properties ) {
		return Gutenberg_Icon_Categories_Registry_7_1::get_instance()->register( $category_name, $category_properties );
	}
}

if ( ! function_exists( 'unregister_icon_category' ) ) {
	/**
	 * Unregisters an icon category.
	 *
	 * @param string $category_name Category name.
	 * @return bool True if unregistered, false otherwise.
	 */
	function unregister_icon_category( $category_name ) {
		return Gutenberg_Icon_Categories_Registry_7_1::get_instance()->unregister( $category_name );
	}
}

if ( ! function_exists( '_register_core_icon_categories' ) ) {
	/**
	 * Registers core icon categories.
	 *
	 * @internal
	 */
	function _register_core_icon_categories() {

		$categories = array(
			'content'    => array(
				'label'       => _x( 'Content', 'icon category', 'gutenberg' ),
				'description' => __( 'Icons for blocks, posts, and document content.', 'gutenberg' ),
			),
			'formatting' => array(
				'label'       => _x( 'Formatting', 'icon category', 'gutenberg' ),
				'description' => __( 'Icons for text styling and alignment.', 'gutenberg' ),
			),
			'navigation' => array(
				'label'       => _x( 'Navigation', 'icon category', 'gutenberg' ),
				'description' => __( 'Icons for menus, arrows, and site structure.', 'gutenberg' ),
			),
			'layout'     => array(
				'label'       => _x( 'Layout', 'icon category', 'gutenberg' ),
				'description' => __( 'Icons for structural elements and grid positioning.', 'gutenberg' ),
			),
			'actions'    => array(
				'label'       => _x( 'Actions', 'icon category', 'gutenberg' ),
				'description' => __( 'Icons for functional commands like add, delete, and save.', 'gutenberg' ),
			),
			'interface'  => array(
				'label'       => _x( 'Interface', 'icon category', 'gutenberg' ),
				'description' => __( 'Icons for system states, settings, and UI controls.', 'gutenberg' ),
			),
			'commerce'   => array(
				'label'       => _x( 'Commerce', 'icon category', 'gutenberg' ),
				'description' => __( 'Icons for shops, payments, and shopping carts.', 'gutenberg' ),
			),
		);

		foreach ( $categories as $slug => $properties ) {
			register_icon_category( $slug, $properties );
		}
	}

	add_action( 'init', '_register_core_icon_categories' );
}
