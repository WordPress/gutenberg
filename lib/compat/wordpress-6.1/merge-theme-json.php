<?php
/**
 * API to interact with a theme.json array.
 *
 * @package gutenberg
 */

/**
 * Function to merge two theme.json arrays into a single one.
 *
 * @param array  $existing_data Array following the theme.json specification.
 * @param array  $incoming_data Array following the theme.json specification.
 * @param string $origin Optional. The origin of the data ('default', 'theme', 'user').
 *                       If this function is used within a callback for filtering global styles data
 *                       (e.g.: global_styles_filter_theme), the origin will be picked up
 *                       automatically. If not provided and not running on a callback,
 *                       it'll the default value ('theme' origin) will be used.
 * @return array Merged array.
 */
function gutenberg_merge_theme_json( $existing_data, $incoming_data, $origin = null ) {
	if ( null === $origin && doing_filter( 'global_styles_filter_theme' ) ) {
		$origin = 'theme';
	}
	if ( null === $origin && doing_filter( 'global_styles_filter_default' ) ) {
		$origin = 'default';
	}
	if ( null === $origin && doing_filter( 'global_styles_filter_blocks' ) ) {
		$origin = 'core';
	}

	$existing = new WP_Theme_JSON_Gutenberg( $existing_data, $origin );
	$incoming = new WP_Theme_JSON_Gutenberg( $incoming_data, $origin );
	$existing->merge( $incoming );

	return $existing->get_raw_data();
}
