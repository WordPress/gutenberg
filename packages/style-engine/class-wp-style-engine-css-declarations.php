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
 * Holds, sanitizes, processes and prints CSS declarations for the Style Engine.
 *
 * @access private
 */
class WP_Style_Engine_CSS_Declarations {
	/**
	 * An array of valid CSS custom properties.
	 * CSS custom properties are permitted by safecss_filter_attr()
	 * since WordPress 6.1. See: https://core.trac.wordpress.org/ticket/56353.
	 *
	 * This whitelist exists so that the Gutenberg plugin maintains
	 * backwards compatibility with versions of WordPress < 6.1.
	 *
	 * It does not need to be backported to future versions of WordPress.
	 *
	 * @var array
	 */
	protected static $valid_custom_declarations = array(
		'--wp--style--unstable-gallery-gap' => 'gap',
	);

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
	 * @param string[] $declarations An associative array of CSS definitions, e.g., array( "$property" => "$value", "$property" => "$value" ).
	 */
	public function __construct( $declarations = array() ) {
		$this->add_declarations( $declarations );
	}

	/**
	 * Adds a single declaration.
	 *
	 * @param string $property The CSS property.
	 * @param string $value    The CSS value.
	 *
	 * @return WP_Style_Engine_CSS_Declarations Returns the object to allow chaining methods.
	 */
	public function add_declaration( $property, $value ) {
		// Sanitizes the property.
		$property = $this->sanitize_property( $property );
		// Bails early if the property is empty.
		if ( empty( $property ) ) {
			return $this;
		}

		// Trims the value. If empty, bail early.
		$value = trim( $value );
		if ( '' === $value ) {
			return $this;
		}

		// Adds the declaration property/value pair.
		$this->declarations[ $property ] = $value;

		return $this;
	}

	/**
	 * Removes a single declaration.
	 *
	 * @param string $property The CSS property.
	 *
	 * @return WP_Style_Engine_CSS_Declarations Returns the object to allow chaining methods.
	 */
	public function remove_declaration( $property ) {
		unset( $this->declarations[ $property ] );
		return $this;
	}

	/**
	 * Adds multiple declarations.
	 *
	 * @param array $declarations An array of declarations.
	 *
	 * @return WP_Style_Engine_CSS_Declarations Returns the object to allow chaining methods.
	 */
	public function add_declarations( $declarations ) {
		foreach ( $declarations as $property => $value ) {
			$this->add_declaration( $property, $value );
		}
		return $this;
	}

	/**
	 * Removes multiple declarations.
	 *
	 * @param array $properties An array of properties.
	 *
	 * @return WP_Style_Engine_CSS_Declarations Returns the object to allow chaining methods.
	 */
	public function remove_declarations( $properties = array() ) {
		foreach ( $properties as $property ) {
			$this->remove_declaration( $property );
		}
		return $this;
	}

	/**
	 * Gets the declarations array.
	 *
	 * @return array
	 */
	public function get_declarations() {
		return $this->declarations;
	}

	/**
	 * Filters a CSS property + value pair.
	 *
	 * @param string $property The CSS property.
	 * @param string $value    The value to be filtered.
	 * @param string $spacer   The spacer between the colon and the value. Defaults to an empty string.
	 *
	 * @return string The filtered declaration or an empty string.
	 */
	protected static function filter_declaration( $property, $value, $spacer = '' ) {
		$filtered_value = wp_strip_all_tags( $value, true );

		/**
		 * Allows a specific list of CSS custom properties starting with `--wp--`.
		 *
		 * CSS custom properties are permitted by safecss_filter_attr()
		 * since WordPress 6.1. See: https://core.trac.wordpress.org/ticket/56353.
		 *
		 * This condition exists so that the Gutenberg plugin maintains
		 * backwards compatibility with versions of WordPress < 6.1.
		 *
		 * It does not need to be backported to future versions of WordPress.
		 */
		if ( '' !== $filtered_value && isset( static::$valid_custom_declarations[ $property ] ) ) {
			return safecss_filter_attr( static::$valid_custom_declarations[ $property ] . ":{$spacer}{$value}" ) ?
				"{$property}:{$spacer}{$value}" : '';
		}

		// Allow `display` property to be used.
		if ( 'display' === $property && '' !== $filtered_value ) {
			return "display:{$spacer}{$filtered_value}";
		}

		if ( '' !== $filtered_value ) {
			return safecss_filter_attr( "{$property}:{$spacer}{$filtered_value}" );
		}
		return '';
	}

	/**
	 * Filters and compiles the CSS declarations.
	 *
	 * @param bool   $should_prettify Whether to add spacing, new lines and indents.
	 * @param number $indent_count    The number of tab indents to apply to the rule. Applies if `prettify` is `true`.
	 *
	 * @return string The CSS declarations.
	 */
	public function get_declarations_string( $should_prettify = false, $indent_count = 0 ) {
		$declarations_array  = $this->get_declarations();
		$declarations_output = '';
		$indent              = $should_prettify ? str_repeat( "\t", $indent_count ) : '';
		$suffix              = $should_prettify ? ' ' : '';
		$suffix              = $should_prettify && $indent_count > 0 ? "\n" : $suffix;
		$spacer              = $should_prettify ? ' ' : '';

		foreach ( $declarations_array as $property => $value ) {
			$filtered_declaration = static::filter_declaration( $property, $value, $spacer );
			if ( $filtered_declaration ) {
				$declarations_output .= "{$indent}{$filtered_declaration};$suffix";
			}
		}
		return rtrim( $declarations_output );
	}

	/**
	 * Sanitizes property names.
	 *
	 * @param string $property The CSS property.
	 *
	 * @return string The sanitized property name.
	 */
	protected function sanitize_property( $property ) {
		return sanitize_key( $property );
	}
}
