<?php
/**
 * Compatibility shims for KSES (content filtering) for WordPress 7.2.
 *
 * @package gutenberg
 */

/**
 * Adds 'text-shadow' to the list of safe CSS properties.
 * This is needed for the typography text shadow block support.
 *
 * @param string[] $attr Array of allowed CSS attributes.
 * @return string[] Modified array of allowed CSS attributes.
 */
function gutenberg_add_text_shadow_to_safe_style_css( $attr ) {
	if ( ! in_array( 'text-shadow', $attr, true ) ) {
		$attr[] = 'text-shadow';
	}

	return $attr;
}
add_filter( 'safe_style_css', 'gutenberg_add_text_shadow_to_safe_style_css' );
