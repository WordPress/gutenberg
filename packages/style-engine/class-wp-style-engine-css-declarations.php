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
		$value = trim( $value );
		if ( '' === $value ) {
			return;
		}

		// Add the declaration property/value pair.
		$this->declarations[ $property ] = $value;
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
			$filtered_declaration = esc_html( safecss_filter_attr( "{$property}: {$value}" ) );
			if ( $filtered_declaration ) {
				$declarations_output .= $filtered_declaration . '; ';
			}
		}
		return rtrim( $declarations_output );
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
