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
	 * The store of CSS rules.
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
		$css   = '';
		$rules = $this->combine_rules_selectors();
		foreach ( $rules as $selector => $rule ) {
			if ( empty( $selector ) || ! $rule instanceof WP_Style_Engine_CSS_Rule ) {
				continue;
			}
			$css .= $selector . ' {' . $rule->get_declarations()->get_declarations_string() . '}';
		}
		return $css;
	}

	/**
	 * Combines selectors from the $styles_array
	 * when they have the same styles.
	 *
	 * @return array
	 */
	private function combine_rules_selectors() {
		$rules           = $this->store->get_all_rules();
		$selector_hashes = array();
		foreach ( $rules as $selector => $rule ) {
			$selector_hashes[ $selector ] = $rule->get_declarations()->get_hash();
		}

		// Combine selectors that have the same styles.
		$selector_rules = array();
		foreach ( $selector_hashes as $selector => $hash ) {
			// Get selectors that use the same styles.
			$duplicates = array_keys( $selector_hashes, $hash, true );
			// Add item directly if there are no duplicates.
			if ( 1 === count( $duplicates ) ) {
				$selector_rules[ $selector ] = $rules[ $selector ];
				continue;
			}
			foreach ( $duplicates as $key ) {
				unset( $selector_hashes[ $key ] );
			}
			$selector_rules[ implode( ',', $duplicates ) ] = $rules[ $selector ];
		}
		return $selector_rules;
	}
}
