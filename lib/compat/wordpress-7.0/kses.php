<?php
/**
 * Compatibility shims for KSES (content filtering) for WordPress 7.0.
 *
 * @package gutenberg
 */

/**
 * Add 'display' to the list of safe CSS properties.
 * This is needed for viewport visibility support.
 *
 * @param array $attr List of allowed CSS attributes.
 * @return array Modified list of allowed CSS attributes.
 */
function gutenberg_add_display_to_safe_style_css( $attr ) {
	if ( ! in_array( 'display', $attr, true ) ) {
		$attr[] = 'display';
	}

	return $attr;
}
add_filter( 'safe_style_css', 'gutenberg_add_display_to_safe_style_css' );
