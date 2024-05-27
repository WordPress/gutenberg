<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Update allowed inline style attributes list.
 *
 * @param string[] $attrs Array of allowed CSS attributes.
 * @return string[] CSS attributes.
 */
function gutenberg_safe_style_attrs_6_5( $attrs ) {
	$attrs[] = 'background-repeat';
	return $attrs;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_attrs_6_5' );
