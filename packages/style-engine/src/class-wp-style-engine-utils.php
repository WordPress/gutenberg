<?php
/**
 * WP_Style_Engine_Utils
 *
 * Utility functions for Style Engine, including theme.json compatibility helpers.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Style_Engine_Utils' ) ) {

	/**
	 * Utility class for Style Engine.
	 *
	 * This class provides utility functions for the Style Engine, including
	 * format conversion helpers for compatibility with theme.json structures.
	 *
	 * @access private
	 */
	final class WP_Style_Engine_Utils {

		/**
		 * Normalizes CSS declarations to associative array format.
		 *
		 * Detects and converts theme.json format (array of arrays with 'name' and 'value' keys)
		 * to associative array format. If already in associative format, returns as-is.
		 *
		 * @since 7.0.0
		 *
		 * @param array $declarations CSS declarations in either format.
		 * @return array Associative array of property => value pairs.
		 */
		public static function normalize_declarations( $declarations ) {
			if ( empty( $declarations ) || ! is_array( $declarations ) ) {
				return array();
			}

			// Check if this is theme.json format (indexed array with 'name' and 'value' keys).
			$first_key = array_key_first( $declarations );
			if ( is_numeric( $first_key ) && isset( $declarations[ $first_key ]['name'], $declarations[ $first_key ]['value'] ) ) {
				// Convert from theme.json format to associative array.
				return static::convert_theme_json_declarations( $declarations );
			}

			// Already in associative array format.
			return $declarations;
		}

		/**
		 * Converts declarations from theme.json format to style engine format.
		 *
		 * Converts from theme.json's array-of-arrays format:
		 *   array(array('name' => 'color', 'value' => 'red'), ...)
		 * To style engine's associative array format:
		 *   array('color' => 'red', ...)
		 *
		 * @since 7.0.0
		 *
		 * @param array $declarations Array of declarations with 'name' and 'value' keys.
		 * @return array Associative array of property => value pairs.
		 */
		public static function convert_theme_json_declarations( $declarations ) {
			if ( empty( $declarations ) || ! is_array( $declarations ) ) {
				return array();
			}

			$associative = array();
			foreach ( $declarations as $declaration ) {
				if ( isset( $declaration['name'], $declaration['value'] ) ) {
					$associative[ $declaration['name'] ] = $declaration['value'];
				}
			}
			return $associative;
		}
	}
}
