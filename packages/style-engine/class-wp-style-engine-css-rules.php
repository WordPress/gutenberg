<?php
/**
 * WP_Style_Engine_CSS_Rules
 *
 * Holds, sanitizes and prints CSS rules.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_CSS_Rules' ) ) {
	return;
}

/**
 * Holds, sanitizes, processes and prints CSS styles rules for the style engine.
 *
 * @access private
 */
class WP_Style_Engine_CSS_Rules {

	/**
	 * An array of styles (property => value pairs).
	 *
	 * @var array
	 */
	protected $styles = array();

	/**
	 * Add a single declaration.
	 *
	 * @param string $property The CSS property.
	 * @param string $value    The CSS value.
	 *
	 * @return void
	 */
	public function add_declaration( $property, $value ) {
		// Sanity check.
		if ( empty( $property ) || ! is_string( $property ) || empty( $value ) ) {
			return;
		}

		// Sanitize the property.
		$property = $this->sanitize_property( $property );
		// Bail early if the property is empty.
		if ( empty( $property ) ) {
			return;
		}

		// Trim the value. If empty, bail early.
		$value = trim( $value );
		if ( empty( $value ) ) {
			return;
		}

		// Add the style.
		$this->styles[ $property ] = $value;
	}

	/**
	 * Add multiple declarations.
	 *
	 * @param array $declarations An array of declarations.
	 *
	 * @return void
	 */
	public function add_declarations( $declarations ) {
		// Remove empty declarations.
		$declarations = array_filter( $declarations );

		// Loop declarations and add them.
		foreach ( $declarations as $property => $value ) {
			if ( empty( $property ) || empty( $value ) ) {
				continue;
			}
			$this->add_declaration( $property, $value );
		}
	}

	/**
	 * Get the styles array.
	 *
	 * @return array
	 */
	public function get_styles() {
		return $this->styles;
	}

	/**
	 * Get the CSS styles.
	 *
	 * @return string The CSS styles.
	 */
	public function get_styles_string() {
		$styles_array = $this->get_styles();
		$styles       = '';
		foreach ( $styles_array as $property => $value ) {
			$styles .= esc_html( safecss_filter_attr( "{$property}: {$value}" ) ) . '; ';
		}
		return rtrim( $styles );
	}

	/**
	 * Sanitize property names.
	 *
	 * @param string $property The CSS property.
	 *
	 * @return string The sanitized property name.
	 */
	protected function sanitize_property( $property ) {
		return sanitize_key( $property );
	}

	/**
	 * Add declarations from a CSS string.
	 *
	 * @param string $css A string of declarations.
	 * @return void
	 */
	public function add_declarations_from_string( $css ) {
		$this->add_declarations( $this->parse_declarations_string( $css ) );
	}

	/**
	 * Parse CSS string declarations to an array.
	 *
	 * @param string $css The CSS string.
	 *
	 * @return array An array of declarations.
	 */
	protected function parse_declarations_string( $css ) {
		$declarations = array();
		$parts        = explode( ';', $css );
		foreach ( $parts as $part ) {
			if ( empty( $part ) ) {
				continue;
			}
			$part        = trim( $part );
			$declaration = explode( ':', $part );
			if ( count( $declaration ) === 2 ) {
				$declarations[ $declaration[0] ] = $declaration[1];
			}
		}

		return $declarations;
	}
}
