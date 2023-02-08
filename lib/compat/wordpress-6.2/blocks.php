<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Update allowed inline style attributes list.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.2.
 *
 * @param string[] $attrs Array of allowed CSS attributes.
 * @return string[] CSS attributes.
 */
function gutenberg_safe_style_attrs_6_2( $attrs ) {
	$attrs[] = 'position';
	$attrs[] = 'top';
	$attrs[] = 'right';
	$attrs[] = 'bottom';
	$attrs[] = 'left';
	$attrs[] = 'z-index';
	$attrs[] = 'box-shadow';

	return $attrs;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_attrs_6_2' );
