<?php
/**
 * Temporary compatibility shims for kses rules present in Gutenberg.
 *
 * The functions in this file should not be backported to core.
 *
 * @package gutenberg
 */

/**
 * Mark CSS safe if it contains grid functions
 *
 * This function should not be backported to core.
 *
 * @param bool   $allow_css Whether the CSS is allowed.
 * @param string $css_test_string The CSS to test.
 */
function allow_grid_functions_in_styles( $allow_css, $css_test_string ) {
	if ( preg_match(
		'/^grid-template-columns:\s*repeat\([0-9,a-z-\s\(\)]*\)$/',
		$css_test_string
	) ) {
		return true;
	}
	return $allow_css;
}
add_filter( 'safecss_filter_attr_allow_css', 'allow_grid_functions_in_styles', 10, 2 );
