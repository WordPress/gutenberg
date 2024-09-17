<?php
/**
 * WP_Style_Engine_CSS_Rule
 *
 * An object for CSS rules.
 *
 * @package Gutenberg
 */

if ( ! class_exists( 'WP_Style_Engine_CSS_Rule' ) ) {

	/**
	 * Holds, sanitizes, processes and prints CSS declarations for the Style Engine.
	 *
	 * @access private
	 */
	class WP_Style_Engine_CSS_Rule {

		/**
		 * The selector.
		 *
		 * @var string
		 */
		protected $selector;

		/**
		 * The selector declarations.
		 *
		 * Contains a WP_Style_Engine_CSS_Declarations object.
		 *
		 * @var WP_Style_Engine_CSS_Declarations
		 */
		protected $declarations;

		/**
		 * A parent CSS selector in the case of nested CSS, or a CSS nested @rule, such as `@media (min-width: 80rem)` or `@layer module`..
		 *
		 * @var string
		 */
		protected $rules_group;

		/**
		 * Constructor
		 *
		 * @param string                                    $selector     The CSS selector.
		 * @param string[]|WP_Style_Engine_CSS_Declarations $declarations An associative array of CSS definitions, e.g., array( "$property" => "$value", "$property" => "$value" ),
		 *                                                                or a WP_Style_Engine_CSS_Declarations object.
		 * @param string                                    $rules_group  A parent CSS selector in the case of nested CSS, or a CSS nested @rule, such as `@media (min-width: 80rem)` or `@layer module`.
		 *
		 */
		public function __construct( $selector = '', $declarations = array(), $rules_group = '' ) {
			$this->set_selector( $selector );
			$this->add_declarations( $declarations );
			$this->set_rules_group( $rules_group );
		}

		/**
		 * Sets the selector.
		 *
		 * @param string $selector The CSS selector.
		 *
		 * @return WP_Style_Engine_CSS_Rule Returns the object to allow chaining of methods.
		 */
		public function set_selector( $selector ) {
			$this->selector = $selector;
			return $this;
		}

		/**
		 * Sets the declarations.
		 *
		 * @param array|WP_Style_Engine_CSS_Declarations $declarations An array of declarations (property => value pairs),
		 *                                                             or a WP_Style_Engine_CSS_Declarations object.
		 *
		 * @return WP_Style_Engine_CSS_Rule Returns the object to allow chaining of methods.
		 */
		public function add_declarations( $declarations ) {
			$is_declarations_object = ! is_array( $declarations );
			$declarations_array     = $is_declarations_object ? $declarations->get_declarations() : $declarations;

			if ( null === $this->declarations ) {
				if ( $is_declarations_object ) {
					$this->declarations = $declarations;
					return $this;
				}
				$this->declarations = new WP_Style_Engine_CSS_Declarations( $declarations_array );
			}
			$this->declarations->add_declarations( $declarations_array );

			return $this;
		}

		/**
		 * Sets the rules group.
		 *
		 * @param string $rules_group A parent CSS selector in the case of nested CSS, or a CSS nested @rule, such as `@media (min-width: 80rem)` or `@layer module`.
		 *
		 * @return WP_Style_Engine_CSS_Rule Returns the object to allow chaining of methods.
		 */
		public function set_rules_group( $rules_group ) {
			$this->rules_group = $rules_group;
			return $this;
		}

		/**
		 * Gets the rules group.
		 *
		 * @return string
		 */
		public function get_rules_group() {
			return $this->rules_group;
		}

		/**
		 * Gets the declarations object.
		 *
		 * @return WP_Style_Engine_CSS_Declarations The declarations object.
		 */
		public function get_declarations() {
			return $this->declarations;
		}

		/**
		 * Gets the full selector.
		 *
		 * @return string
		 */
		public function get_selector() {
			return $this->selector;
		}

		/**
		 * Gets the CSS.
		 *
		 * @param bool   $should_prettify Whether to add spacing, new lines and indents.
		 * @param number $indent_count    The number of tab indents to apply to the rule. Applies if `prettify` is `true`.
		 *
		 * @return string
		 */
		public function get_css( $should_prettify = false, $indent_count = 0 ) {
			$rule_indent                = $should_prettify ? str_repeat( "\t", $indent_count ) : '';
			$nested_rule_indent         = $should_prettify ? str_repeat( "\t", $indent_count + 1 ) : '';
			$declarations_indent        = $should_prettify ? $indent_count + 1 : 0;
			$nested_declarations_indent = $should_prettify ? $indent_count + 2 : 0;
			$suffix                     = $should_prettify ? "\n" : '';
			$spacer                     = $should_prettify ? ' ' : '';
			// Trims any multiple selectors strings.
			$selector         = $should_prettify ? implode( ',', array_map( 'trim', explode( ',', $this->get_selector() ) ) ) : $this->get_selector();
			$selector         = $should_prettify ? str_replace( array( ',' ), ",\n", $selector ) : $selector;
			$rules_group      = $this->get_rules_group();
			$has_rules_group  = ! empty( $rules_group );
			$css_declarations = $this->declarations->get_declarations_string( $should_prettify, $has_rules_group ? $nested_declarations_indent : $declarations_indent );

			if ( empty( $css_declarations ) ) {
				return '';
			}

			if ( $has_rules_group ) {
				$selector = "{$rule_indent}{$rules_group}{$spacer}{{$suffix}{$nested_rule_indent}{$selector}{$spacer}{{$suffix}{$css_declarations}{$suffix}{$nested_rule_indent}}{$suffix}{$rule_indent}}";
				return $selector;
			}

			return "{$rule_indent}{$selector}{$spacer}{{$suffix}{$css_declarations}{$suffix}{$rule_indent}}";
		}
	}
}
