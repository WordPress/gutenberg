<?php
/**
 * Returns the current theme's wanted patterns(slugs) to be
 * registered from Pattern Directory.
 *
 * @since 6.3.0
 *
 * @return string[]
 */
function gutenberg_get_remote_theme_patterns() {
	return WP_Theme_JSON_Resolver_Gutenberg::get_theme_data( array(), array( 'with_supports' => false ) )->get_patterns();
}
