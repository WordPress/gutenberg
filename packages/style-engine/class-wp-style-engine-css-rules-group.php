<?php
/**
 * WP_Style_Engine_CSS_Rules_Group
 *
 * A container for WP_Style_Engine_CSS_Rule objects.
 *
 * @package Gutenberg
 */

if ( ! class_exists( 'WP_Style_Engine_CSS_Rules_Group' ) ) {
	/**
	 * Holds, sanitizes, processes and prints nested CSS rules for the Style Engine.
	 *
	 * @access private
	 */
	class WP_Style_Engine_CSS_Rules_Group {
		/**
		 * The group's CSS selector in the case of nested CSS, or a CSS nested @rule, such as `@media (min-width: 80rem)` or `@layer module`.
		 *
		 * @var string
		 */
		protected $rules_group;

		/**
		 * The container declarations.
		 *
		 * Contains a WP_Style_Engine_CSS_Rule object.
		 *
		 * @var WP_Style_Engine_CSS_Rule[]
		 */
		protected $rules = array();

		/**
		 * Constructor
		 *
		 * @param string                                              $rules_group A parent CSS selector in the case of nested CSS, or a CSS nested @rule,
		 *                                                                         such as `@media (min-width: 80rem)` or `@layer module`.
		 * @param WP_Style_Engine_CSS_Rule[]|WP_Style_Engine_CSS_Rule $rules       Optional. A WP_Style_Engine_CSS_Rule object.
		 */
		public function __construct( $rules_group, $rules = array() ) {
			$this->set_rules_group( $rules_group );
			$this->add_rules( $rules );
		}

		/**
		 * Sets the rules group.
		 *
		 * @param string $rules_group The group's CSS selector in the case of nested CSS, or a CSS nested @rule, such as `@media (min-width: 80rem)` or `@layer module`.
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
		 * Gets all nested rules.
		 *
		 * @return WP_Style_Engine_CSS_Rule[]
		 */
		public function get_rules() {
			return $this->rules;
		}

		/**
		 * Gets a stored nested rules.
		 *
		 * @return WP_Style_Engine_CSS_Rule
		 */
		public function get_rule( $selector ) {
			return $this->rules[ $selector ] ?? null;
		}

		/**
		 * Adds the rules.
		 *
		 * @param WP_Style_Engine_CSS_Rule|WP_Style_Engine_CSS_Rule[] $container_rules An array of declarations (property => value pairs),
		 *                                                             or a WP_Style_Engine_CSS_Declarations object.
		 *
		 * @return WP_Style_Engine_CSS_Rules_Group Returns the object to allow chaining of methods.
		 */
		public function add_rules( $rules ) {
			if ( empty( $rules ) ) {
				return $this;
			}

			if ( ! is_array( $rules ) ) {
				$rules = array( $rules );
			}

			foreach ( $rules as $rule ) {
				if ( ! $rule instanceof WP_Style_Engine_CSS_Rule ) {
					_doing_it_wrong(
						__METHOD__,
						__( 'Rules passed to WP_Style_Engine_CSS_Rules_Container must be an instance of WP_Style_Engine_CSS_Rule', 'default' ),
						'6.6.0'
					);
					continue;
				}

				if ( $this->rules_group !== $rule->get_rules_group() ) {
					continue;
				}

				$selector = $rule->get_selector();

				if ( isset( $this->rules[ $selector ] ) ) {
					$this->rules[ $selector ]->add_declarations( $rule->get_declarations() );
				} else {
					$this->rules[ $selector ] = $rule;
				}
			}

			return $this;
		}

		/**
		 * Gets the nested CSS.
		 *
		 * @param bool   $should_prettify Whether to add spacing, new lines and indents.
		 * @param number $indent_count    The number of tab indents to apply to the rule. Applies if `prettify` is `true`.
		 *
		 * @return string
		 */
		public function get_css( $should_prettify = false, $indent_count = 0 ) {
			$css          = '';
			$indent_count = $should_prettify ? $indent_count + 1 : $indent_count;
			$new_line     = $should_prettify ? "\n" : '';
			$spacer       = $should_prettify ? ' ' : '';
			$css         .= ! empty( $this->declarations ) ? $this->declarations->get_declarations_string( $should_prettify, $indent_count ) : '';
			$css         .= $should_prettify && $css ? "\n" : '';

			foreach ( $this->rules as $rule ) {
				$css .= $rule->get_css( $should_prettify, $indent_count );
				$css .= $should_prettify ? "\n" : '';
			}

			if ( empty( $css ) ) {
				return $css;
			}

			return "{$this->rules_group}{$spacer}{{$new_line}{$css}}";
		}
	}
}
