<?php
/**
 * Sets up the default filters and actions for most
 * of the WordPress hooks.
 *
 * If you need to remove a default hook, this file will
 * give you the priority to use for removing the hook.
 *
 * Not all of the default hooks are found in this file.
 * For instance, administration-related hooks are located in
 * wp-admin/includes/admin-filters.php.
 *
 * If a hook should only be called from a specific context
 * (admin area, multisite environment…), please move it
 * to a more appropriate file instead.
 *
 * @package gutenberg
 */

add_action( 'switch_theme', 'wp_theme_has_theme_json_clean_cache' );
add_action( 'start_previewing_theme', 'wp_theme_has_theme_json_clean_cache' );
add_action( 'upgrader_process_complete', '_wp_theme_has_theme_json_clean_cache_upon_upgrading_active_theme' );
add_action( 'save_post_wp_global_styles', array( 'WP_Theme_JSON_Resolver_Gutenberg', 'clean_cached_data' ) );
add_action( 'activated_plugin', array( 'WP_Theme_JSON_Resolver_Gutenberg', 'clean_cached_data' ) );
add_action( 'deactivated_plugin', array( 'WP_Theme_JSON_Resolver_Gutenberg', 'clean_cached_data' ) );
add_action( 'upgrader_process_complete', array( 'WP_Theme_JSON_Resolver_Gutenberg', '_clean_cached_data_upon_upgrading', 10, 2 ) );
add_action( 'save_post_wp_global_styles', 'gutenberg_get_global_stylesheet_clean_cache' );
add_action( 'switch_theme', 'gutenberg_get_global_stylesheet_clean_cache' );
add_action( 'start_previewing_theme', 'gutenberg_get_global_stylesheet_clean_cache' );
add_action( 'activated_plugin', 'gutenberg_get_global_stylesheet_clean_cache' );
add_action( 'deactivated_plugin', 'gutenberg_get_global_stylesheet_clean_cache' );
add_action( 'upgrader_process_complete', '_gutenberg_get_global_stylesheet_clean_cache_upon_upgrading', 10, 2 );
