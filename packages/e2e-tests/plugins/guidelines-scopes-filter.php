<?php
/**
 * Plugin Name: Gutenberg Test Guidelines Scopes Filter
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-guidelines-scopes-filter
 */

/**
 * Exercises the `wp_guideline_scopes` filter for e2e tests: adds a custom
 * scope and removes the built-in `blocks` scope. The Settings -> Guidelines
 * page should grow the custom section and drop the Blocks section.
 *
 * @param array $scopes Slug-keyed map of guideline scopes.
 * @return array Filtered scopes.
 */
function gutenberg_test_filter_guideline_scopes( $scopes ) {
	unset( $scopes['blocks'] );

	$scopes['e2e-custom'] = array(
		'title'       => 'E2E Custom',
		'description' => 'A custom guideline scope added by an e2e test plugin.',
		'order'       => 45,
	);

	return $scopes;
}
add_filter( 'wp_guideline_scopes', 'gutenberg_test_filter_guideline_scopes' );
