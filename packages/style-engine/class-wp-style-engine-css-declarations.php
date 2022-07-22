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
 * Holds, sanitizes, processes and prints CSS declarations for the style engine.
 *
 * @access private
 */
class WP_Style_Engine_CSS_Declarations {

	/**
	 * An array of CSS declarations (property => value pairs).
	 *
	 * @var array
	 */
	protected $declarations = array();

	/**
	 * Constructor for this object.
	 *
	 * If a `$declarations` array is passed, it will be used to populate
	 * the initial $declarations prop of the object by calling add_declarations().
	 *
	 * @param array $declarations An array of declarations (property => value pairs).
	 */
	public function __construct( $declarations = array() ) {
		if ( empty( $declarations ) ) {
			return;
		}
		$this->add_declarations( $declarations );
	}

	/**
	 * Add a single declaration.
	 *
	 * @param string $property The CSS property.
	 * @param string $value    The CSS value.
	 *
	 * @return void
	 */
	public function add_declaration( $property, $value ) {

		// Sanitize the property.
		$property = $this->sanitize_property( $property );
		// Bail early if the property is empty.
		if ( empty( $property ) ) {
			return;
		}

		// Trim the value. If empty, bail early.
		$value = $this->sanitize_value( $value );
		if ( '' === $value ) {
			return;
		}

		// Add the declaration property/value pair.
		$this->declarations[ $property ] = $value;
	}

	/**
	 * Remove a single declaration.
	 *
	 * @param string $property The CSS property.
	 *
	 * @return void
	 */
	public function remove_declaration( $property ) {
		unset( $this->declarations[ $property ] );
	}

	/**
	 * Add multiple declarations.
	 *
	 * @param array $declarations An array of declarations.
	 *
	 * @return void
	 */
	public function add_declarations( $declarations ) {
		foreach ( $declarations as $property => $value ) {
			$this->add_declaration( $property, $value );
		}
	}

	/**
	 * Remove multiple declarations.
	 *
	 * @param array $declarations An array of properties.
	 *
	 * @return void
	 */
	public function remove_declarations( $declarations = array() ) {
		foreach ( $declarations as $property ) {
			$this->remove_declaration( $property );
		}
	}

	/**
	 * Get the declarations array.
	 *
	 * @return array
	 */
	public function get_declarations() {
		return $this->declarations;
	}

	/**
	 * Filters and compiles the CSS declarations.
	 *
	 * @return string The CSS declarations.
	 */
	public function get_declarations_string() {
		$declarations_array  = $this->get_declarations();
		$declarations_output = '';

		foreach ( $declarations_array as $property => $value ) {
			// Account for CSS variables.
			if ( 0 === strpos( $property, '--' ) || ( 'display' === $property && 'none' !== $value ) ) {
				$declarations_output .= "{$property}:{$value};";
				continue;
			}
			$filtered_declaration = safecss_filter_attr( "{$property}:{$value}" );
			if ( $filtered_declaration ) {
				$declarations_output .= $filtered_declaration . ';';
			}
		}
		return $declarations_output;
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
	 * Sanitize values.
	 *
	 * @param string $value The CSS value.
	 *
	 * @return string The sanitized value.
	 */
	protected function sanitize_value( $value ) {
		// Escape HTML.
		$value = esc_html( $value );
		// Fix quotes to account for URLs.
		$value = str_replace( array( '&#039;', '&#39;', '&#034;', '&#34;', '&quot;', '&apos;' ), array( "'", "'", '"', '"', '"', "'" ), $value );
		return trim( $value );
	}
}
