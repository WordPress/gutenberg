<?php
/**
 * WP_Style_Engine_Renderer
 *
 * Compiles and renders styles from a store of CSS rules.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_Renderer' ) ) {
	return;
}

/**
 * Compiles and renders styles from a store of CSS rules.
 *
 * @access private
 */
class WP_Style_Engine_Renderer {

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
	 * @return string The rendered CSS.
	 */
	public function get_css() {
		// Combine CSS selectors that have identical declarations.
		$this->combine_rules_selectors();

		// Build the CSS.
		$css   = '';
		$rules = $this->store->get_all_rules();
		foreach ( $rules as $rule ) {
			$css .= $rule->get_css();
		}
		return $css;
	}

	/**
	 * Combines selectors from the $styles_array
	 * when they have the same styles.
	 *
	 * @return void
	 */
	private function combine_rules_selectors() {
		$rules           = $this->store->get_all_rules();
		$selector_hashes = array();
		foreach ( $rules as $selector => $rule ) {
			$selector_hashes[ $selector ] = $rule->get_declarations()->get_hash();
		}

		// Combine selectors that have the same styles.
		foreach ( $selector_hashes as $selector => $hash ) {
			// Get selectors that use the same styles.
			$duplicates = array_keys( $selector_hashes, $hash, true );
			// Skip if there are no duplicates.
			if ( 1 >= count( $duplicates ) ) {
				continue;
			}
			// Get the declarations.
			$declarations = $rules[ $selector ]->get_declarations();
			foreach ( $duplicates as $key ) {
				// Unset the duplicates from the hashes array to avoid looping through them as well.
				unset( $selector_hashes[ $key ] );
				// Remove the rules from the store.
				$this->store->remove_rule( $key );
			}
			// Create a new rule with the combined selectors.
			$new_rule = $this->store->add_rule( implode( ',', $duplicates ) );
			// Set the declarations. The extra check is in place because `add_rule` in the store can return `null`.
			if ( $new_rule ) {
				$new_rule->add_declarations( $declarations );
			}
		}
	}
}
