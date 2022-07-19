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
 * Compiles styles from a store of CSS rules.
 *
 * @access private
 */
class WP_Style_Engine_Processor {

	/**
	 * The Style-Engine Store object.
	 *
	 * @var WP_Style_Engine_CSS_Rules_Store
	 */
	protected $store;

	/**
	 * Constructor.
	 *
	 * @param WP_Style_Engine_CSS_Rules_Store $store The store to render.
	 */
	public function __construct( WP_Style_Engine_CSS_Rules_Store $store ) {
		$this->store = $store;
	}

	/**
	 * Get the CSS rules as a string.
	 *
	 * @param bool $remove_printed_rules Whether to remove printed rules.
	 *
	 * @return string The computed CSS.
	 */
	public function get_css( $remove_printed_rules = false ) {
		// Combine CSS selectors that have identical declarations.
		$this->combine_rules_selectors();

		// Build the CSS.
		$css   = '';
		$rules = $this->store->get_all_rules();
		foreach ( $rules as $rule ) {
			// Add the CSS.
			$css .= $rule->get_css();
			if ( $remove_printed_rules ) {
				// Remove the rule from the store to avoid double-rendering.
				$this->store->remove_rule( $rule->get_selector() );
			}
		}
		return $css;
	}

	/**
	 * Combines selectors from the rules store when they have the same styles.
	 *
	 * @return void
	 */
	private function combine_rules_selectors() {
		$rules = $this->store->get_all_rules();

		// Build an array of selectors along with the JSON-ified styles to make comparisons easier.
		$selectors_json = array();
		foreach ( $rules as $selector => $rule ) {
			$declarations = $rule->get_declarations()->get_declarations();
			ksort( $declarations );
			$selectors_json[ $selector ] = json_encode( $declarations );
		}

		// Combine selectors that have the same styles.
		foreach ( $selectors_json as $selector => $json ) {
			// Get selectors that use the same styles.
			$duplicates = array_keys( $selectors_json, $json, true );
			// Skip if there are no duplicates.
			if ( 1 >= count( $duplicates ) ) {
				continue;
			}
			foreach ( $duplicates as $key ) {
				// Unset the duplicates from the $selectors_json array to avoid looping through them as well.
				unset( $selectors_json[ $key ] );
				// Remove the rules from the store.
				$this->store->remove_rule( $key );
			}
			// Create a new rule with the combined selectors.
			$new_rule = $this->store->add_rule( implode( ',', $duplicates ) );
			// Set the declarations. The extra check is in place because `add_rule` in the store can return `null`.
			if ( $new_rule ) {
				$new_rule->add_declarations( $rules[ $selector ]->get_declarations() );
			}
		}
	}
}
