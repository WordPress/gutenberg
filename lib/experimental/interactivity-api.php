<?php
/**
 * Overrides URLs to load the Gutenberg interactivity script modules instead of
 * the WordPress Core ones.
 *
 * This function checks the URL for specific script modules and overrides the
 * default URL to point to the Gutenberg plugin. It supports both the
 * interactivity and interactivity-router scripts, with or without the `.min`
 * suffix.
 *
 * @param string $url The URL of the enqueued script.
 * @return string The new Gutenberg URL if it's a match, or the WordPress Core URL otherwise.
 */
function gutenberg_interactivity_override_script_module_urls( $url ) {
	$pattern = '/wp-includes\/js\/dist\/interactivity(-router)?(\.min)?\.js/';
	if ( preg_match( $pattern, $url, $matches ) ) {
		return gutenberg_url( '/build/interactivity/' . ( ( isset( $matches[1] ) && $matches[1] ) ? 'router' : 'index' ) . '.min.js' );
	}
	return $url;
}

add_filter( 'includes_url', 'gutenberg_interactivity_override_script_module_urls', 10, 3 );
