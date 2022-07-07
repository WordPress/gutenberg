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

		// Bail early if there is no selector.
		if ( empty( $selector ) ) {
			return;
		}

		// If the selector is already stored, return it.
		if ( isset( static::$rules[ $selector ] ) ) {
			return static::$rules[ $selector ];
		}

		// Create the selector if it doesn't exist.
		// To do that, first deconstruct the selector to its parts
		// and build the hierarchy of selector objects prior to storing it.
		$selector_parts = static::deconstruct_selector( $selector );
		$full_selector  = '';
		foreach ( $selector_parts as $key => $selector_part ) {
			// Get the parent object if needed.
			$parent = 0 === $key ? null : static::get_rule( $selector_parts[ $full_selector ] );
			// Compile the full selector for the store.
			$full_selector .= ( 0 === strpos( $selector_part, '&' ) ) ? substr( $selector_part, 1 ) : ' ' . $selector_part;
			if ( 0 === $key ) {
				$full_selector = ltrim( $full_selector );
			}
			// Create the rule if it doesn't exist.
			if ( empty( static::$rules[ $full_selector ] ) ) {
				static::$rules[ $full_selector ] = new WP_Style_Engine_CSS_Rule( $selector_part, $parent );
			}
		}

		return static::$rules[ $selector ];
	}

	/**
	 * Deconstruct a selector to its parts.
	 *
	 * @static
	 *
	 * @param string $selector The CSS selector.
	 *
	 * @return array An array of selector parts.
	 */
	public static function deconstruct_selector( $selector ) {
		$selector = trim( $selector );

		// Split selector parts on space characters.
		$parts = explode( ' ', $selector );
		$parts = array_map( 'trim', $parts );

		// Remove empty parts.
		$parts = array_filter( $parts );

		// Split parts on ':' characters.
		$parts = static::deconstruct_selector_array_on_character( $parts, ':' );

		return $parts;
	}

	/**
	 * Expands and re-structures an array based on a character.
	 *
	 * @static
	 *
	 * @param array  $array The array to expand.
	 * @param string $character The character to expand on.
	 *
	 * @return array The expanded array.
	 */
	public static function deconstruct_selector_array_on_character( $array, $character ) {
		$new_array = array();
		foreach ( $array as $value ) {
			if ( strpos( $value, $character ) === false ) {
				$new_array[] = $value;
				continue;
			}

			// Use "SPLIT_CHARACTER" as a delimiter.
			$value = str_replace( $character, "SPLIT_CHARACTER$character", $value );

			// Pseudo-selectors are a special case.
			if ( ':' === $character ) {
				$value = str_replace( ':', '&:', $value );
			}

			$value     = explode( 'SPLIT_CHARACTER', $value );
			$new_array = array_merge( $new_array, $value );
		}
		return $new_array;
	}
}
