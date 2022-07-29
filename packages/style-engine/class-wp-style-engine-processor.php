<?php
/**
 * WP_Style_Engine_Processor
 *
 * Compiles styles from a store of CSS rules.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_Processor' ) ) {
	return;
}

/**
 * Compiles styles from a collection of CSS rules.
 *
 * @access private
 */
class WP_Style_Engine_Processor {

	/**
	 * The set of CSS rules that this processor will work on.
	 *
	 * @var WP_Style_Engine_CSS_Rule[]
	 */
	protected $css_rules = array();

	/**
	 * Constructor.
	 *
	 * @param WP_Style_Engine_CSS_Rule[] $css_rules An array of WP_Style_Engine_CSS_Rule objects from a store or otherwise.
	 */
	public function __construct( $css_rules = array() ) {
		$this->add_rules( $css_rules );
	}

	/**
	 * Adds rules to be processed.
	 *
	 * @param WP_Style_Engine_CSS_Rule|WP_Style_Engine_CSS_Rule[] $css_rules A single, or an array of, WP_Style_Engine_CSS_Rule objects from a store or otherwise.
	 */
	public function add_rules( $css_rules ) {
		if ( ! is_array( $css_rules ) ) {
			$css_rules = array( $css_rules );
		}
		foreach ( $css_rules as $rule ) {
			$selector = $rule->get_selector();
			if ( isset( $this->css_rules[ $selector ] ) ) {
				$this->css_rules[ $selector ]->add_declarations( $rule->get_declarations() );
			} else {
				$this->css_rules[ $rule->get_selector() ] = $rule;
			}
		}
	}

	/**
	 * Get the CSS rules as a string.
	 *
	 * @return string The computed CSS.
	 */
	public function get_css() {
		// Combine CSS selectors that have identical declarations.
		$this->combine_rules_selectors();

		// Build the CSS.
		$css = '';
		foreach ( $this->css_rules as $rule ) {
			$css .= $rule->get_css();
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
		foreach ( $this->css_rules as $index => $rule ) {

			$rule_selector = $rule->get_selector();
			$declarations  = $rule->get_declarations()->get_declarations();
			ksort( $declarations );
			$selectors_json[ $rule_selector ] = wp_json_encode( $declarations );
		}

		// Combine selectors that have the same styles.
		foreach ( $selectors_json as $selector => $json ) {
			// Get selectors that use the same styles.
			$duplicates = array_keys( $selectors_json, $json, true );
			// Skip if there are no duplicates.
			if ( 1 >= count( $duplicates ) ) {
				continue;
			}

			$new_declarations = $this->css_rules[ $selector ]->get_declarations();

			foreach ( $duplicates as $key ) {
				// Unset the duplicates from the $selectors_json array to avoid looping through them as well.
				unset( $selectors_json[ $key ] );
				// Remove the rules from the rules collection.
				unset( $this->css_rules[ $key ] );
			}
			// Create a new rule with the combined selectors.
			$this->css_rules[ implode( ',', $duplicates ) ] = new WP_Style_Engine_CSS_Rule( implode( ',', $duplicates ), $new_declarations );
		}
	}
}
