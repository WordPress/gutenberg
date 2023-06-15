<?php
/**
 * API to interact with global settings & styles.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_get_block_css_selector' ) ) {
	/**
	 * Determine the CSS selector for the block type and property provided,
	 * returning it if available.
	 *
	 * @since WordPress 6.3.0
	 *
	 * @param WP_Block_Type $block_type The block's type.
	 * @param string|array  $target     The desired selector's target, `root` or array path.
	 * @param boolean       $fallback   Whether or not to fallback to broader selector.
	 *
	 * @return string|null CSS selector or `null` if no selector available.
	 */
	function wp_get_block_css_selector( $block_type, $target = 'root', $fallback = false ) {
		if ( empty( $target ) ) {
			return null;
		}

		$has_selectors = ! empty( $block_type->selectors );

		// Root Selector.

		// Calculated before returning as it can be used as fallback for
		// feature selectors later on.
		$root_selector = null;

		if ( $has_selectors && isset( $block_type->selectors['root'] ) ) {
			// Use the selectors API if available.
			$root_selector = $block_type->selectors['root'];
		} elseif ( isset( $block_type->supports['__experimentalSelector'] ) && is_string( $block_type->supports['__experimentalSelector'] ) ) {
			// Use the old experimental selector supports property if set.
			$root_selector = $block_type->supports['__experimentalSelector'];
		} else {
			// If no root selector found, generate default block class selector.
			$block_name    = str_replace( '/', '-', str_replace( 'core/', '', $block_type->name ) );
			$root_selector = ".wp-block-{$block_name}";
		}

		// Return selector if it's the root target we are looking for.
		if ( 'root' === $target ) {
			return $root_selector;
		}

		// If target is not `root` we have a feature or subfeature as the target.
		// If the target is a string convert to an array.
		if ( is_string( $target ) ) {
			$target = explode( '.', $target );
		}

		// Feature Selectors ( May fallback to root selector ).
		if ( 1 === count( $target ) ) {
			$fallback_selector = $fallback ? $root_selector : null;

			// Prefer the selectors API if available.
			if ( $has_selectors ) {
				// Look for selector under `feature.root`.
				$path             = array_merge( $target, array( 'root' ) );
				$feature_selector = _wp_array_get( $block_type->selectors, $path, null );

				if ( $feature_selector ) {
					return $feature_selector;
				}

				// Check if feature selector is set via shorthand.
				$feature_selector = _wp_array_get( $block_type->selectors, $target, null );

				return is_string( $feature_selector ) ? $feature_selector : $fallback_selector;
			}

			// Try getting old experimental supports selector value.
			$path             = array_merge( $target, array( '__experimentalSelector' ) );
			$feature_selector = _wp_array_get( $block_type->supports, $path, null );

			// Nothing to work with, provide fallback or null.
			if ( null === $feature_selector ) {
				return $fallback_selector;
			}

			// Scope the feature selector by the block's root selector.
			return WP_Theme_JSON_Gutenberg::scope_selector( $root_selector, $feature_selector );
		}

		// Subfeature selector
		// This may fallback either to parent feature or root selector.
		$subfeature_selector = null;

		// Use selectors API if available.
		if ( $has_selectors ) {
			$subfeature_selector = _wp_array_get( $block_type->selectors, $target, null );
		}

		// Only return if we have a subfeature selector.
		if ( $subfeature_selector ) {
			return $subfeature_selector;
		}

		// To this point we don't have a subfeature selector. If a fallback
		// has been requested, remove subfeature from target path and return
		// results of a call for the parent feature's selector.
		if ( $fallback ) {
			return wp_get_block_css_selector( $block_type, $target[0], $fallback );
		}

		// We tried...
		return null;
	}
}
