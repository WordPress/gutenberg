<?php
/**
 * WP_Style_Engine_Store
 *
 * Registers and stores styles to be processed or rendered on the frontend.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_Store' ) ) {
	return;
}

/**
 * Registers and stores styles to be processed or rendered on the frontend.
 *
 * For each style category we could have a separate object, e.g.,
 * $global_style_store = new WP_Style_Engine_Store();
 * $block_supports_style_store = new WP_Style_Engine_Store();
 *
 * @access private
 */
class WP_Style_Engine_Store {
	/**
	 * Registered styles.
	 *
	 * @var WP_Style_Engine_Store|null
	 */
	private $registered_styles = array();

	/**
	 * Register a style
	 *
	 * @param string $key Unique key for a $style_data object.
	 * @param array  $style_data Associative array of style information.
	 * @return void
	 */
	public function register( $key, $style_data ) {
		if ( empty( $key ) || empty( $style_data ) ) {
			return;
		}

		if ( isset( $this->registered_styles[ $key ] ) ) {
			$style_data = array_unique( array_merge( $this->registered_styles[ $key ], $style_data ) );
		}
		$this->registered_styles[ $key ] = $style_data;
	}

	/**
	 * Retrieves style data from the store.
	 *
	 * @param string $key Optional unique key for a $style_data object to return a single style object.
	 *
	 * @return array Registered styles
	 */
	public function get( $key = null ) {
		if ( isset( $this->registered_styles[ $key ] ) ) {
			return $this->registered_styles[ $key ];
		}
		return $this->registered_styles;
	}
}
