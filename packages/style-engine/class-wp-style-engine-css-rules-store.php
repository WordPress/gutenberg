<?php
/**
 * WP_Style_Engine_CSS_Rules_Store
 *
 * A store for WP_Style_Engine_CSS_Rule objects.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_CSS_Rules_Store' ) ) {
	return;
}

/**
 * Holds, sanitizes, processes and prints CSS declarations for the style engine.
 *
 * @access private
 */
class WP_Style_Engine_CSS_Rules_Store {

	/**
	 * An array of named WP_Style_Engine_CSS_Rules_Store objects.
	 *
	 * @static
	 *
	 * @var WP_Style_Engine_CSS_Rules_Store[]
	 */
	protected static $stores = array();

	/**
	 * An array of CSS Rules objects assigned to the store.
	 *
	 * @var WP_Style_Engine_CSS_Rule[]
	 */
	protected $rules = array();

	/**
	 * Get an instance of the store.
	 *
	 * @param string $store_name The name of the store.
	 *
	 * @return WP_Style_Engine_CSS_Rules_Store
	 */
	public static function get_store( $store_name = 'default' ) {
		if ( ! isset( static::$stores[ $store_name ] ) ) {
			static::$stores[ $store_name ] = new static( $store_name );
		}
		return static::$stores[ $store_name ];
	}
	/**
	 * Get an array of all rules.
	 *
	 * @return WP_Style_Engine_CSS_Rule[]
	 */
	public function get_all_rules() {
		return $this->rules;
	}

	/**
	 * Get a WP_Style_Engine_CSS_Rule object by its selector.
	 *
	 * @param string $selector The CSS selector.
	 */
	public function get_rule( $selector ) {

		$selector = trim( $selector );

		// Bail early if there is no selector.
		if ( empty( $selector ) ) {
			return;
		}

		// Create the rule if it doesn't exist.
		if ( empty( $this->rules[ $selector ] ) ) {
			$this->rules[ $selector ] = new WP_Style_Engine_CSS_Rule( $selector );
		}

		return $this->rules[ $selector ];
	}
}
