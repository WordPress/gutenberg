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
	 * An array of CSS Rules objects.
	 *
	 * @static
	 *
	 * @var WP_Style_Engine_CSS_Rule[]
	 */
	protected static $rules = array();

	/**
	 * Get an array of all rules.
	 *
	 * @static
	 *
	 * @return WP_Style_Engine_CSS_Rule[]
	 */
	public static function get_all_rules() {
		return static::$rules;
	}

	/**
	 * Get a WP_Style_Engine_CSS_Rule object by its selector.
	 *
	 * @static
	 *
	 * @param string $selector The CSS selector.
	 */
	public static function get_rule( $selector ) {

		$selector = trim( $selector );

		// Bail early if there is no selector.
		if ( empty( $selector ) ) {
			return;
		}

		// Create the rule if it doesn't exist.
		if ( empty( static::$rules[ $selector ] ) ) {
			static::$rules[ $selector ] = new WP_Style_Engine_CSS_Rule( $selector );
		}

		return static::$rules[ $selector ];
	}
}
