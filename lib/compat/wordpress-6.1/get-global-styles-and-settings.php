<?php
/**
 * API to interact with global settings & styles.
 *
 * @package gutenberg
 */

/**
 * Returns the stylesheet resulting of merging core, theme, and user data.
 * This is a duplicate of wp_get_global_stylesheet
 *
 * @since 5.9.0
 *
 * @param array $types Types of styles to load. Optional.
 *                     It accepts 'variables', 'styles', 'presets' as values.
 *                     If empty, it'll load all for themes with theme.json support
 *                     and only [ 'variables', 'presets' ] for themes without theme.json support.
 *
 * @return string Stylesheet.
 */
function wp_get_global_stylesheet_gutenberg( $types = array() ) {
	// Return cached value if it can be used and exists.
	// It's cached by theme to make sure that theme switching clears the cache.
	$can_use_cached = (
		( empty( $types ) ) &&
		( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) &&
		( ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG ) &&
		( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) &&
		! is_admin()
	);
	$transient_name = 'global_styles_' . get_stylesheet();
	if ( $can_use_cached ) {
		$cached = get_transient( $transient_name );
		if ( $cached ) {
			return $cached;
		}
	}

	$tree = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();

	$supports_theme_json = WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();
	if ( empty( $types ) && ! $supports_theme_json ) {
		$types = array( 'variables', 'presets' );
	} elseif ( empty( $types ) ) {
		$types = array( 'variables', 'styles', 'presets' );
	}

	/*
	 * If variables are part of the stylesheet,
	 * we add them for all origins (default, theme, user).
	 * This is so themes without a theme.json still work as before 5.9:
	 * they can override the default presets.
	 * See https://core.trac.wordpress.org/ticket/54782
	 */
	$styles_variables = '';
	if ( in_array( 'variables', $types, true ) ) {
		$styles_variables = $tree->get_stylesheet( array( 'variables' ) );
		$types            = array_diff( $types, array( 'variables' ) );
	}

	/*
	 * For the remaining types (presets, styles), we do consider origins:
	 *
	 * - themes without theme.json: only the classes for the presets defined by core
	 * - themes with theme.json: the presets and styles classes, both from core and the theme
	 */
	$styles_rest = '';
	if ( ! empty( $types ) ) {
		$origins = array( 'default', 'theme', 'custom' );
		if ( ! $supports_theme_json ) {
			$origins = array( 'default' );
		}
		$styles_rest = $tree->get_stylesheet( $types, $origins );
	}

	$stylesheet = $styles_variables . $styles_rest;

	if ( $can_use_cached ) {
		// Cache for a minute.
		// This cache doesn't need to be any longer, we only want to avoid spikes on high-traffic sites.
		set_transient( $transient_name, $stylesheet, MINUTE_IN_SECONDS );
	}

	return $stylesheet;
}

/**
 * Adds global style rules to the inline style for each block.
 */
function wp_add_global_styles_for_blocks() {
	$tree = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	// TODO some nodes dont have a name...
	$block_nodes = $tree->get_styles_block_nodes();
	foreach ( $block_nodes as $metadata ) {
		$block_css  = $tree->get_styles_for_block( $metadata );
		$block_name = str_replace( 'core/', '', $metadata['name'] );
		wp_add_inline_style( 'wp-block-' . $block_name, $block_css );
	}
}
