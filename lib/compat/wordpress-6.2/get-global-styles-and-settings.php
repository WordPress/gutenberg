<?php
/**
 * API to interact with global settings & styles.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_theme_has_theme_json' ) ) {
	/**
	 * Whether a theme or its parent have a theme.json file.
	 *
	 * @param boolean $clear_cache Whether the cache should be cleared and theme support recomputed. Default is false.
	 *
	 * @return boolean
	 */
	function wp_theme_has_theme_json( $clear_cache = false ) {
		static $theme_has_support = null;

		if ( true === $clear_cache ) {
			$theme_has_support = null;
		}

		if ( null !== $theme_has_support ) {
			return $theme_has_support;
		}

		// Has the own theme a theme.json?
		$theme_has_support = is_readable( get_stylesheet_directory() . '/theme.json' );

		// Look up the parent if the child does not have a theme.json.
		if ( ! $theme_has_support ) {
			$theme_has_support = is_readable( get_template_directory() . '/theme.json' );
		}

		return $theme_has_support;
	}
}

if ( ! function_exists( 'wp_theme_clean_theme_json_cached_data' ) ) {
	/**
	 * Clean theme.json related cached data.
	 */
	function wp_theme_clean_theme_json_cached_data() {
		wp_theme_has_theme_json( true );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
	}
}

/**
 * Lookup a CSS selector for the block provided, and return it if it exists
 * 
 * @param string $block_name The name of the block to lookup the CSS selector for
 * 
 * @return string|null the CSS selector for the block
 */
function wp_theme_get_css_selector_for_block( $block_name ) {
	$registry = WP_Block_Type_Registry::get_instance();
	$blocks   = $registry->get_all_registered();

	if ( isset( $blocks[ $block_name ] ) ) {
		$block = $blocks[ $block_name ];
		if (
			isset( $block->supports['__experimentalSelector'] ) &&
			is_string( $block->supports['__experimentalSelector'] )
		) {
			return $block->supports['__experimentalSelector'];
		} else {
			return '.wp-block-' . str_replace( '/', '-', str_replace( 'core/', '', $block_name ) );
		}
	}

	// Selector for the block was not found
	return null;
}
