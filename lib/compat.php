<?php
/**
 * Temporary compatibility shims for features present in Gutenberg, pending
 * upstream commit to the WordPress core source repository. Functions here
 * exist only as long as necessary for corresponding WordPress support, and
 * each should be associated with a Trac ticket.
 *
 * @package gutenberg
 */

/**
 * Filters allowed CSS attributes to include `flex-basis`, included in saved
 * markup of the Column block.
 *
 * This can be removed when plugin support requires WordPress 5.3.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/47281
 * @see https://core.trac.wordpress.org/changeset/45363
 *
 * @since 5.7.0
 *
 * @param string[] $attr Array of allowed CSS attributes.
 *
 * @return string[] Filtered array of allowed CSS attributes.
 */
function gutenberg_safe_style_css_column_flex_basis( $attr ) {
	$attr[] = 'flex-basis';

	return $attr;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_css_column_flex_basis' );
