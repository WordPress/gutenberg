<?php
/**
 * WP_Style_Engine_Processor
 *
 * Compiles styles from stores or collection of CSS rules.
 *
 * @package Gutenberg
 */

if ( ! class_exists( 'WP_Style_Engine_Processor' ) ) {

	/**
	 * Compiles styles from stores or collection of CSS rules.
	 *
	 * @access private
	 */
	class WP_Style_Engine_Processor {

		/**
		 * A collection of Style Engine Store objects.
		 *
		 * @var WP_Style_Engine_CSS_Rules_Store[]
		 */
		protected $stores = array();

		/**
		 * The set of CSS rules that this processor will work on.
		 *
		 * @var WP_Style_Engine_CSS_Rule[]
		 */
		protected $css_rules = array();

		/**
		 * Add a store to the processor.
		 *
		 * @param WP_Style_Engine_CSS_Rules_Store $store The store to add.
		 *
		 * @return WP_Style_Engine_Processor Returns the object to allow chaining methods.
		 */
		public function add_store( $store ) {
			if ( ! $store instanceof WP_Style_Engine_CSS_Rules_Store ) {
				_doing_it_wrong(
					__METHOD__,
					__( '$store must be an instance of WP_Style_Engine_CSS_Rules_Store', 'default' ),
					'6.1.0'
				);
				return $this;
			}

			$this->stores[ $store->get_name() ] = $store;

			return $this;
		}

		/**
		 * Adds rules to be processed.
		 *
		 * @param WP_Style_Engine_CSS_Rule|WP_Style_Engine_CSS_Rule[] $css_rules A single, or an array of, WP_Style_Engine_CSS_Rule objects from a store or otherwise.
		 *
		 * @return WP_Style_Engine_Processor Returns the object to allow chaining methods.
		 */
		public function add_rules( $css_rules ) {
			if ( ! is_array( $css_rules ) ) {
				$css_rules = array( $css_rules );
			}

			foreach ( $css_rules as $rule ) {
				// Check for rules that need to be nested in containers.
				$container = $rule->get_container();
				$selector  = $rule->get_selector();

				if ( ! empty( $selector ) && empty( $container ) ) {
					if ( isset( $this->css_rules[ $selector ] ) ) {
						$this->css_rules[ $selector ]->add_declarations( $rule->get_declarations() );
					} else {
						$this->css_rules[ $rule->get_selector() ] = $rule;
					}
					continue;
				}

				if ( ! empty( $container ) ) {
					if ( isset( $this->css_rules[ $container ] ) ) {
						$this->css_rules[ $container ]->add_rule( $rule );
					} else {
						$this->css_rules[ $container ] = new WP_Style_Engine_CSS_Rules_Container( $container, $rule );
					}
				}
			}

			return $this;
		}

		/**
		 * Get the CSS rules as a string.
		 *
		 * Since 6.4.0 Optimization is no longer the default.
		 *
		 * @param array $options   {
		 *     Optional. An array of options. Default empty array.
		 *
		 *     @type bool $optimize Whether to optimize the CSS output, e.g., combine rules. Default is `false`.
		 *     @type bool $prettify Whether to add new lines and indents to output. Default is to inherit the value of the global constant `SCRIPT_DEBUG`, if it is defined.
		 * }
		 *
		 * @return string The computed CSS.
		 */
		public function get_css( $options = array() ) {
			$defaults = array(
				'optimize' => false,
				'prettify' => SCRIPT_DEBUG,
			);
			$options  = wp_parse_args( $options, $defaults );

			// If we have stores, get the rules from them.
			foreach ( $this->stores as $store ) {
				$this->add_rules( $store->get_all_rules() );
			}

			// Combine CSS selectors that have identical declarations.
			if ( true === $options['optimize'] ) {
				$this->combine_rules_selectors();
			}

			// Build the CSS.
			$css = '';
			foreach ( $this->css_rules as $rule ) {
				$css .= $rule->get_css( $options['prettify'] );
				$css .= $options['prettify'] ? "\n" : '';
			}
			return $css;
		}

		/**
		 * Combines selectors from the rules store when they have the same styles.
		 *
		 * @return void
		 */
		private function combine_rules_selectors() {
			// Build an array of selectors along with the JSON-ified styles to make comparisons easier.
			$selectors_json = array();
			foreach ( $this->css_rules as $rule ) {
				$declarations = $rule->get_declarations()->get_declarations();
				ksort( $declarations );
				$selectors_json[ $rule->get_selector() ] = wp_json_encode( $declarations );
			}

			// Combine selectors that have the same styles.
			foreach ( $selectors_json as $selector => $json ) {
				// Get selectors that use the same styles.
				$duplicates = array_keys( $selectors_json, $json, true );
				// Skip if there are no duplicates.
				if ( 1 >= count( $duplicates ) ) {
					continue;
				}

				$declarations = $this->css_rules[ $selector ]->get_declarations();

				foreach ( $duplicates as $key ) {
					// Unset the duplicates from the $selectors_json array to avoid looping through them as well.
					unset( $selectors_json[ $key ] );
					// Remove the rules from the rules collection.
					unset( $this->css_rules[ $key ] );
				}
				// Create a new rule with the combined selectors.
				$duplicate_selectors                     = implode( ',', $duplicates );
				$this->css_rules[ $duplicate_selectors ] = new WP_Style_Engine_CSS_Rule( $duplicate_selectors, $declarations );
			}
		}
	}
}


// @TODO new file and tests
// Should have same/similar interface to WP_Style_Engine_CSS_Rule or maybe even part of it?
class WP_Style_Engine_CSS_Rules_Container {
	protected $container;
	protected $rules = array();

	public function __construct( $container = '', $rule ) {
		$this->set_container( $container );
		// @TODO should be able to add multiple rules.
		// @TODO check for instance of WP_Style_Engine_CSS_Rule
		$this->add_rule( $rule );
	}

	public function set_container( $container ) {
		$this->container = $container;
		return $this;
	}

	public function get_container() {
		return $this->container;
	}

	public function get_rules() {
		return $this->rules;
	}

	public function add_rule( $rule ) {
		// @TODO should be able to add multiple rules.
		// @TODO check for instance of WP_Style_Engine_CSS_Rule
		$selector = $rule->get_selector();

		if ( isset( $this->rules[ $selector ] ) ) {
			$this->rules[ $selector ]->add_declarations( $rule->get_declarations() );
		} else {
			$this->rules[ $selector ] = $rule;
		}
		return $this;
	}

	public function get_css( $should_prettify = false, $indent_count = 0 ) {
		$css                 = '';
		$indent_count         = $should_prettify ? $indent_count + 1 : $indent_count;
		$new_line            = $should_prettify ? "\n" : '';
		$spacer              = $should_prettify ? ' ' : '';
		foreach ( $this->rules as $rule ) {
			$css .= $rule->get_css( $should_prettify, $indent_count );
			$css .= $should_prettify ? "\n" : '';
		}

		if ( empty( $css ) ) {
			return '';
		}

		return "{$this->container}{$spacer}{{$new_line}{$css}}";
	}
}
