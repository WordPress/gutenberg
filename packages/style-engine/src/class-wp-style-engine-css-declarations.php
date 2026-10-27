<?php
/**
 * WP_Style_Engine_CSS_Declarations
 *
 * Holds, sanitizes and prints CSS rules declarations
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Style_Engine_CSS_Declarations' ) ) {

	/**
	 * Holds, sanitizes, processes and prints CSS declarations for the Style Engine.
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
		 * CSS declaration options keyed by property name.
		 *
		 * @var array
		 */
		protected $declaration_options = array();

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
		 * @param array  $options  {
		 *     Optional. An array of options. Default empty array.
		 *
		 *     @type bool $important Whether to output the declaration with !important. Default false.
		 * }
		 *
		 * @return WP_Style_Engine_CSS_Declarations Returns the object to allow chaining methods.
		 */
		public function add_declaration( $property, $value, $options = array() ) {
			// Sanitizes the property.
			$property = $this->sanitize_property( $property );
			// Bails early if the property is empty.
			if ( empty( $property ) ) {
				return $this;
			}

			// Bail early if value is not a string. Prevents fatal errors from malformed block markup.
			if ( ! is_string( $value ) ) {
				return $this;
			}
			$value = trim( $value );
			if ( '' === $value ) {
				return $this;
			}

			$options = wp_parse_args(
				$options,
				array(
					'important' => false,
				)
			);

			$options = array_filter( $options );

			// Adds the declaration property/value pair.
			$this->declarations[ $property ] = $value;
			if ( $options ) {
				$this->declaration_options[ $property ] = $options;
			} else {
				unset( $this->declaration_options[ $property ] );
			}

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
			unset( $this->declaration_options[ $property ] );
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
		 * Gets declaration options keyed by property name.
		 *
		 * @return array
		 */
		public function get_declaration_options() {
			return $this->declaration_options;
		}

		/**
		 * Filters a CSS property + value pair.
		 *
		 * @param string $property The CSS property.
		 * @param string $value    The value to be filtered.
		 * @param string $spacer   The spacer between the colon and the value. Defaults to an empty string.
		 * @param array  $options  {
		 *     Optional. An array of options. Default empty array.
		 *
		 *     @type bool $important Whether to output the declaration with !important. Default false.
		 * }
		 *
		 * @return string The filtered declaration or an empty string.
		 */
		protected static function filter_declaration( $property, $value, $spacer = '', $options = array() ) {
			$filtered_value = wp_strip_all_tags( $value, true );

			if ( '' !== $filtered_value ) {
				$options = wp_parse_args(
					$options,
					array(
						'important' => false,
					)
				);

				$filtered_declaration = safecss_filter_attr( "{$property}:{$spacer}{$filtered_value}" );

				// Only append !important in the presence of an option value and when sanitization returns a single declaration.
				if ( true === $options['important'] && '' !== $filtered_declaration && ! str_contains( $filtered_declaration, ';' ) ) {
					return "$filtered_declaration !important";
				}

				return $filtered_declaration;
			}
			return '';
		}

		/**
		 * Filters and compiles the CSS declarations.
		 *
		 * @param bool $should_prettify Whether to add spacing, new lines and indents.
		 * @param int  $indent_count    The number of tab indents to apply to the rule. Applies if `prettify` is `true`.
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
				$filtered_declaration = static::filter_declaration(
					$property,
					$value,
					$spacer,
					$this->declaration_options[ $property ] ?? array()
				);
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
}
