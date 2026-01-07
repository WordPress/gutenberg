<?php
/**
 * Clears Core's routes before Gutenberg registers its own.
 *
 * This file must be loaded BEFORE build/index.php so that these actions
 * are added before Gutenberg's routes.php actions. This ensures:
 * 1. Core's routes.php runs (priority 10, added first)
 * 2. These clearing functions run (priority 10, added second)
 * 3. Gutenberg's routes.php runs (priority 10, added third)
 *
 * @package gutenberg
 */

/**
 * Clears Core's font-library routes before Gutenberg registers its own.
 */
function gutenberg_clear_core_font_library_routes() {
	global $wp_font_library_routes;
	$wp_font_library_routes = array();
}
add_action( 'font-library_init', 'gutenberg_clear_core_font_library_routes' );

/**
 * Clears Core's font-library-wp-admin routes before Gutenberg registers its own.
 */
function gutenberg_clear_core_font_library_wp_admin_routes() {
	global $wp_font_library_wp_admin_routes;
	$wp_font_library_wp_admin_routes = array();
}
add_action( 'font-library-wp-admin_init', 'gutenberg_clear_core_font_library_wp_admin_routes' );

/**
 * Clears Core's site-editor-v2 routes before Gutenberg registers its own.
 */
function gutenberg_clear_core_site_editor_v2_routes() {
	global $gutenberg_site_editor_v2_routes;
	$gutenberg_site_editor_v2_routes = array();
}
add_action( 'site-editor-v2_init', 'gutenberg_clear_core_site_editor_v2_routes' );

/**
 * Clears Core's site-editor-v2 routes before Gutenberg registers its own.
 */
function gutenberg_clear_core_site_editor_v2_wp_admin_routes() {
	global $gutenberg_site_editor_v2_routes;
	$gutenberg_site_editor_v2_routes = array();
}
add_action( 'site-editor-v2-wp-admin_init', 'gutenberg_clear_core_site_editor_v2_wp_admin_routes' );
