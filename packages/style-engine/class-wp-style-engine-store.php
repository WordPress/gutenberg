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
	 * Gather internals.
	 */
	public function __construct( $layers = array() ) {
		foreach ( $layers as $layer ) {
			$this->registered_styles[ $layer ] = array();
		}
	}

	/**
	 * Register a style
	 *
	 * @param string $layer Unique key for a layer.
	 * @param string $key Unique key for a $style_data object.
	 * @param array  $style_data Associative array of style information.
	 * @return boolean Whether registration was successful.
	 */
	public function register( $layer, $key, $style_data ) {
		if ( empty( $layer ) || empty( $key ) || empty( $style_data ) ) {
			return false;
		}

		if ( isset( $this->registered_styles[ $layer ][ $key ] ) ) {
			$style_data = array_unique( array_merge( $this->registered_styles[ $layer ][ $key ], $style_data ) );
		}
		$this->registered_styles[ $layer ][ $key ] = $style_data;
		return true;
	}

	/**
	 * Retrieves style data from the store. If neither $layer nor $key are provided,
	 * this method will return everything in the store.
	 *
	 * @param string $layer Optional unique key for a layer to return all styles for a layer.
	 * @param string $key Optional unique key for a $style_data object to return a single style object.
	 *
	 * @return array Registered styles
	 */
	public function get( $layer = null, $key = null ) {
		if ( isset( $this->registered_styles[ $layer ][ $key ] ) ) {
			return $this->registered_styles[ $layer ][ $key ];
		}

		if ( isset( $this->registered_styles[ $layer ] ) ) {
			return $this->registered_styles[ $layer ];
		}

		return $this->registered_styles;
	}
}
