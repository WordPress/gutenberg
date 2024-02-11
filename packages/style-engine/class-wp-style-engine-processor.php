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
		 * The set of nested CSS rules that this processor will work on.
		 *
		 * @var WP_Style_Engine_CSS_Rules_Container[]
		 */
		protected $css_containers = array();


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
		 * @param WP_Style_Engine_CSS_Rule|WP_Style_Engine_CSS_Rule[]|WP_Style_Engine_CSS_Rules_Container|WP_Style_Engine_CSS_Rules_Container[] $css_rules A single, or an array of, WP_Style_Engine_CSS_Rule objects from a store or otherwise.
		 *
		 * @return WP_Style_Engine_Processor Returns the object to allow chaining methods.
		 */
		public function add_rules( $css_rules ) {
			if ( ! is_array( $css_rules ) ) {
				$css_rules = array( $css_rules );
			}

			foreach ( $css_rules as $rule ) {
				// Check for rules that need to be nested in containers.
				$selector = $rule->get_selector();

				if ( empty( $selector ) ) {
					continue;
				}

				/*
				 * Merge existing rule and container objects or create new ones.
				 * Containers and rules are stored in separate arrays to allow for
				 * separate processing.
				 */
				if ( $rule instanceof WP_Style_Engine_CSS_Rules_Container ) {
					if ( isset( $this->css_containers[ $selector ] ) ) {
						$this->css_containers[ $selector ]->add_rules( $rule->get_rules() );
						$this->css_containers[ $selector ]->add_declarations( $rule->get_declarations() );
					} else {
						$this->css_containers[ $selector ] = $rule;
					}
					continue;
				}

				if ( $rule instanceof WP_Style_Engine_CSS_Rule ) {
					if ( isset( $this->css_rules[ $selector ] ) ) {
						$this->css_rules[ $selector ]->add_declarations( $rule->get_declarations() );
					} else {
						$this->css_rules[ $selector ] = $rule;
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
			// Merge the rules and containers. Containers come last.
			$merged_rules = array_merge( $this->css_rules, $this->css_containers );

			foreach ( $merged_rules as $rule ) {
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
