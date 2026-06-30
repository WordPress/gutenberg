<?php
/**
 * Plugin Name: Gutenberg Test Guidelines Remove Blocks Scope
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-guidelines-remove-blocks-scope
 */

/**
 * Removes the built-in `blocks` guideline scope so the Settings → Guidelines
 * page should drop the whole Blocks section.
 *
 * @param array $scopes Slug-keyed map of guideline scopes.
 * @return array Scopes without the `blocks` entry.
 */
function gutenberg_test_remove_blocks_guideline_scope( $scopes ) {
	unset( $scopes['blocks'] );
	return $scopes;
}
add_filter( 'wp_guideline_scopes', 'gutenberg_test_remove_blocks_guideline_scope' );
