<?php
/**
 * WP_Style_Engine_CSS_Declarations
 *
 * Holds, sanitizes and prints CSS rules declarations
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_CSS_Declarations' ) ) {
	return;
}

/**
 * Holds, sanitizes, processes and prints CSS styles rules declarations for the style engine.
 *
 * @access private
 */
class WP_Style_Engine_CSS_Declarations {

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
		if ( empty( $property ) || ! is_string( $property ) || ( empty( $value ) && 0 !== $value && '0' !== $value ) ) {
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
		if ( empty( $value ) && 0 !== $value && '0' !== $value ) {
			return;
		}

		// Add the style.
		$this->styles[ $property ] = (string) $value;
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
}
