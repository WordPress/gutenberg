<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Update allowed inline style attributes list.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.1.
 *
 * @param string[] $attrs Array of allowed CSS attributes.
 * @return string[] CSS attributes.
 */
function gutenberg_safe_style_attrs_6_3( $attrs ) {
	$attrs[] = 'display';
	return $attrs;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_attrs_6_3' );

/**
 * Update allowed CSS values to match WordPress 6.1.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.1.
 *
 * The logic in this function follows that provided in: https://core.trac.wordpress.org/ticket/55966.
 *
 * @param boolean $allow_css       Whether or not the current test string is allowed.
 * @param string  $css_test_string The CSS string to be tested.
 * @return boolean
 */
function gutenberg_safecss_filter_attr_allow_css_6_3( $allow_css, $css_test_string ) {
	if ( false === $allow_css ) {
		// Allow all "display" values EXCEPT "none".
		if ( str_starts_with( $css_test_string, 'display:' ) && str_contains( $css_test_string, 'none' ) ) {
			return false;
		}
		return $allow_css;
	}
	return $allow_css;
}
add_filter( 'safecss_filter_attr_allow_css', 'gutenberg_safecss_filter_attr_allow_css_6_3', 10, 2 );
