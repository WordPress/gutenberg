<?php
/**
 * Preload path adjustments for the WordPress 6.9 block editor.
 *
 * @package gutenberg
 */

/**
 * Append the user global styles preload entries for classic themes.
 *
 * Core's `edit-form-blocks.php` derives the user global styles post id from
 * `WP_Theme_JSON_Resolver::get_user_global_styles_post_id()`. On WP 6.9 that
 * short-circuits to `null` for themes without a `theme.json`, leaving the two
 * derived preload entries with an empty id (see the early-return removed by
 * https://github.com/WordPress/wordpress-develop/commit/fd2693d9 for the WP 7.0
 * fix). The Gutenberg-shipped resolver has no such early-return, so use it to
 * append the correctly-id'd entries — the malformed core ones go unused.
 *
 * @param array $paths REST API paths to preload.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_user_global_styles_6_9( $paths ) {
	if ( ! class_exists( 'WP_Theme_JSON_Resolver_Gutenberg' ) ) {
		return $paths;
	}
	$id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
	if ( ! $id ) {
		return $paths;
	}
	$context = current_user_can( 'edit_theme_options' ) ? 'edit' : 'view';
	$paths[] = '/wp/v2/global-styles/' . $id . '?context=' . $context;
	$paths[] = array( '/wp/v2/global-styles/' . $id, 'OPTIONS' );
	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_user_global_styles_6_9' );
